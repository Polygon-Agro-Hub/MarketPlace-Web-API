const CartDao = require("../../dao/Cart-dao");
const ProductDao = require("../../dao/Product-dao");
const { collectionofficer } = require("../../startup/database");
const {
  getScheduleWindow,
  generateScheduleDates,
} = require("../../utils/sheduleGenarator");

/**
 * Executes full order placement transaction in MySQL.
 * Used by webhooks upon verified payment confirmation.
 *
 * scheduleDates: array of "YYYY-MM-DD" strings, generated and validated at
 * initiatePayment time (so a late webhook can never fail on the 6 PM cutoff).
 * If it is missing for a recurring order, dates are regenerated as a safety net.
 *
 * Recurring behaviour (same as createOrder controller):
 *  - one `orders` row
 *  - one `processorders` row per schedule date
 *  - only the FIRST processorders row carries payment (amount/credit/money);
 *    the rest are saved with 0
 *  - items are saved for EVERY processorders row
 *  - credit is deducted ONCE
 */
exports.placeOrderFromCheckout = async ({
  userId,
  cartId,
  checkoutDetails,
  paymentMethod = "Card",
  discountAmount = 0,
  grandTotal,
  orderApp = "Marketplace",
  deliveryCharge = 0,
  creditPaid = 0,
  moneyPaid = 0,
  isFinalizeImdt = 0,
  transactionId = null,
  isPaid = 1,
  status = "Ordered",
  scheduleDates = null,
}) => {
  return new Promise((resolve, reject) => {
    const {
      buildingType,
      houseNo,
      street,
      cityName,
      buildingNo,
      buildingName,
      flatNumber,
      floorNumber,
      deliveryMethod,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName,
      centerId,
      couponValue = 0,
      isCoupon = false,
      geoLatitude = null,
      geoLongitude = null,
      companycenterId,
      couponType = null,
      saveAs = null,
      selectedDays = null,
      validPeriod = null,
      sheduleDate = null,
    } = checkoutDetails;

    console.log("[Order Placement] Received checkout details:", checkoutDetails);

    const parsedCreditPaid = parseFloat(creditPaid) || 0;
    const parsedMoneyPaid = parseFloat(moneyPaid) || 0;
    const isRecurring = (scheduleType || "One Time") !== "One Time";

    let released = false;
    const releaseConnection = (conn) => {
      if (!released && conn) {
        released = true;
        conn.release();
      }
    };

    collectionofficer.getConnection((connErr, connection) => {
      if (connErr) {
        console.error("[Order Placement] Database connection error:", connErr);
        return reject(connErr);
      }

      connection.beginTransaction(async (txErr) => {
        if (txErr) {
          releaseConnection(connection);
          return reject(txErr);
        }

        try {
          // 0. Idempotency: webhooks can retry. If this transaction was already
          //    turned into an order, return it instead of creating a duplicate.
          if (transactionId) {
            const existing = await new Promise((res, rej) => {
              connection.query(
                "SELECT id, orderId, invNo FROM processorders WHERE transactionId = ? LIMIT 1",
                [transactionId],
                (e, rows) => (e ? rej(e) : res(rows && rows[0]))
              );
            });

            if (existing) {
              console.warn(
                `[Order Placement] transactionId ${transactionId} already processed (order ${existing.orderId}), skipping`
              );
              return connection.rollback(() => {
                releaseConnection(connection);
                resolve({
                  duplicate: true,
                  orderId: existing.orderId,
                  processOrderId: existing.id,
                  invoiceNumber: existing.invNo,
                  invNo: existing.invNo,
                });
              });
            }
          }

          // 1. Verify Cart & Availability
          const cartExists = await CartDao.validateCart(cartId, userId);
          if (!cartExists) {
            throw new Error(
              `Cart ${cartId} not found or doesn't belong to user ${userId}`
            );
          }

          const availability = await CartDao.checkCartItemsAvailability(cartId);
          if (availability.hasUnavailableItems) {
            console.warn(
              "[Order Placement] Some cart items are no longer available:",
              availability
            );
          }

          const cartItems = await CartDao.getCartItems(cartId);
          if (!cartItems || cartItems.length === 0) {
            throw new Error("Cart is empty. Cannot create order.");
          }

          // 2. Insert into orders table
          const orderData = {
            userId,
            orderApp,
            delivaryMethod: deliveryMethod,
            centerId: centerId || null,
            buildingType: deliveryMethod === "home" ? buildingType : null,
            title,
            fullName,
            phonecode1: phoneCode1,
            phone1,
            phonecode2: phoneCode2,
            phone2,
            sheduleType: scheduleType || null,
            sheduleTime: timeSlot || null,
            validityPeriod: validPeriod ? parseInt(validPeriod, 10) : null,
            // always store as a JSON string (an array would be expanded by mysql)
            selectedDays: selectedDays
              ? typeof selectedDays === "string"
                ? selectedDays
                : JSON.stringify(selectedDays)
              : null,
            isPackage: cartItems.some((item) => item.itemType === "package")
              ? 1
              : 0,
            latitude: geoLatitude ? parseFloat(geoLatitude) : null,
            longitude: geoLongitude ? parseFloat(geoLongitude) : null,
            companycenterId: parseInt(companycenterId) || null,
            isFinalizeImdt: isFinalizeImdt ? 1 : 0,
          };

          const orderId = await CartDao.createOrderWithTransaction(
            connection,
            orderData
          );
          console.log("[Order Placement] Created order with ID:", orderId);

          // 3. Insert address if home delivery
          if (deliveryMethod === "home") {
            const addressData = {
              buildingNo,
              buildingName,
              unitNo: flatNumber,
              floorNo: floorNumber,
              houseNo,
              streetName: street,
              city: cityName,
              saveAs: saveAs || null,
            };
            await CartDao.createOrderAddressWithTransaction(
              connection,
              orderId,
              addressData,
              buildingType
            );
          }

          // 4. Resolve schedule dates (one processorders row per date)
          const fallbackOneTime =
            (deliveryDate ? String(deliveryDate).slice(0, 10) : null) ||
            (sheduleDate ? String(sheduleDate).slice(0, 10) : null);

          let dates;
          if (Array.isArray(scheduleDates) && scheduleDates.length > 0) {
            // generated + validated at initiatePayment time
            dates = scheduleDates;
          } else if (isRecurring) {
            // Safety net only: initiatePayment should have supplied scheduleDates.
            // If this throws, the transaction rolls back so no partial order is made.
            console.warn(
              "[Order Placement] Recurring order without scheduleDates, regenerating"
            );
            const oneTimePackages =
              await ProductDao.getCheckoutOneTimePackagesDao(userId);
            dates = generateScheduleDates({
              scheduleType,
              deliveryDate: fallbackOneTime,
              selectedDays,
              validPeriod,
              window: getScheduleWindow(oneTimePackages),
            });
          } else {
            dates = [fallbackOneTime];
          }

          console.log(
            `[Order Placement] ${dates.length} schedule date(s):`,
            dates
          );

          const baseProcessOrderData = {
            orderId,
            paymentMethod: paymentMethod || "Card",
            amount: parseFloat(grandTotal) || 0,
            creditPaid: parsedCreditPaid,
            moneyPaid: parsedMoneyPaid,
            status: status || "Ordered",
            isPaid: isPaid ? 1 : 0,
            transactionId: transactionId || null,
            isCoupon: isCoupon ? 1 : 0,
            couponValue: parseFloat(couponValue) || 0,
            couponType: isCoupon ? couponType : null,
            total:
              (parseFloat(grandTotal) || 0) + (parseFloat(discountAmount) || 0),
            fullTotal: parseFloat(grandTotal) || 0,
            discount: parseFloat(discountAmount) || 0,
            deliveryCharge: parseFloat(deliveryCharge) || 0,
          };

          console.log(
            "[Order Placement] Base process order data:",
            baseProcessOrderData
          );

          // Values for the paying (first) order
          const payingAmount = parseFloat(grandTotal) || 0;
          const payingCreditPaid = parsedCreditPaid > 0 ? parsedCreditPaid : 0;
          const payingMoneyPaid =
            Math.round((payingAmount - payingCreditPaid) * 100) / 100;

          // Sequential: every call shares the same connection
          const processOrderResults = [];
          for (let i = 0; i < dates.length; i++) {
            // One Time: the only order pays. Recurring: only the first pays now.
            const isPayingOrder = !isRecurring || i === 0;

            // First (paying) order: isPaid = 1, amount = grand total,
            //   creditPaid = credit used (or 0), moneyPaid = amount - creditPaid.
            // Other recurring orders: isPaid = 0, amount = first order's amount,
            //   creditPaid = 0, moneyPaid = 0.
            const paymentFields = isPayingOrder
              ? {
                  isPaid: 1,
                  amount: payingAmount,
                  creditPaid: payingCreditPaid,
                  moneyPaid: payingMoneyPaid,
                }
              : {
                  isPaid: 0,
                  amount: payingAmount,
                  creditPaid: 0,
                  moneyPaid: 0,
                };

            const po = await CartDao.createProcessOrderWithTransaction(
              connection,
              {
                ...baseProcessOrderData,
                ...paymentFields,
                isPayingOrder, // DAO must honour this (see DAO change)
                sheduleDate: dates[i], // "YYYY-MM-DD", no timezone shifting
              }
            );

            processOrderResults.push(po);
            console.log(
              `[Order Placement] Process order created for ${dates[i]} (paying: ${isPayingOrder}) - insertId: ${po.insertId}, invNo: ${po.invNo}`
            );
          }

          // 5. Save items for EACH process order
          for (const po of processOrderResults) {
            await CartDao.saveOrderItemsWithTransaction(
              connection,
              orderId,
              po.insertId,
              cartItems
            );
          }

          const primaryProcessOrder = processOrderResults[0];

          // 6. Credit limit bonus check (always, like the controller) and
          //    credit deduction (no-op when 0). Done once, not per date.
          await CartDao.applyCreditLimitBonusIfEligible(connection, userId);
          const creditDeductionResult =
            await CartDao.deductUserCreditWithTransaction(
              connection,
              userId,
              parsedCreditPaid
            );

          // 7. Commit transaction
          connection.commit(async (commitErr) => {
            if (commitErr) {
              console.error("[Order Placement] Commit failed:", commitErr);
              return connection.rollback(() => {
                releaseConnection(connection);
                reject(commitErr);
              });
            }

            releaseConnection(connection);

            // 8. Clear Cart (failure here must not fail the order)
            try {
              await CartDao.clearCart(cartId);
              console.log(`[Order Placement] Cart ${cartId} cleared successfully.`);
            } catch (clearErr) {
              console.warn(
                "[Order Placement] Could not clear cart:",
                clearErr.message
              );
            }

            resolve({
              orderId,
              // backward-compat fields (first schedule date)
              processOrderId: primaryProcessOrder.insertId,
              invoiceNumber: primaryProcessOrder.invNo,
              invNo: primaryProcessOrder.invNo,
              qrCodeUrl: primaryProcessOrder.qrCodeUrl,
              // all process orders, one per scheduled date
              processOrders: processOrderResults.map((po, i) => ({
                processOrderId: po.insertId,
                invoiceNumber: po.invNo,
                qrCodeUrl: po.qrCodeUrl,
                sheduleDate: dates[i],
                isPayingOrder: !isRecurring || i === 0,
              })),
              total: grandTotal,
              status,
              creditPaid: parsedCreditPaid,
              moneyPaid: parsedMoneyPaid,
              newCreditBalance: creditDeductionResult?.newBalance ?? null,
            });
          });
        } catch (innerErr) {
          console.error("[Order Placement] Transaction error:", innerErr);
          connection.rollback(() => {
            releaseConnection(connection);
            reject(innerErr);
          });
        }
      });
    });
  });
};