const CartDao = require("../../dao/Cart-dao");
const { collectionofficer } = require("../../startup/database");

/**
 * Executes full order placement transaction in MySQL.
 * Used by webhooks upon verified payment confirmation.
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

    const parsedCreditPaid = parseFloat(creditPaid) || 0;
    const parsedMoneyPaid = parseFloat(moneyPaid) || 0;

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
          // 1. Verify Cart & Availability
          const cartExists = await CartDao.validateCart(cartId, userId);
          if (!cartExists) {
            throw new Error(`Cart ${cartId} not found or doesn't belong to user ${userId}`);
          }

          const availability = await CartDao.checkCartItemsAvailability(cartId);
          if (availability.hasUnavailableItems) {
            console.warn("[Order Placement] Some cart items are no longer available:", availability);
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
            isCoupon: isCoupon ? 1 : 0,
            couponValue: parseFloat(couponValue) || 0,
            couponType: isCoupon ? couponType : null,
            total: parseFloat(grandTotal) + parseFloat(discountAmount) || 0,
            fullTotal: parseFloat(grandTotal) || 0,
            discount: parseFloat(discountAmount) || 0,
            sheduleType: scheduleType || null,
            sheduleTime: timeSlot || null,
            validityPeriod: validPeriod ? parseInt(validPeriod, 10) : null,
            selectedDays: selectedDays || null,
            isPackage: cartItems.some((item) => item.itemType === "package") ? 1 : 0,
            latitude: geoLatitude ? parseFloat(geoLatitude) : null,
            longitude: geoLongitude ? parseFloat(geoLongitude) : null,
            companycenterId: parseInt(companycenterId) || null,
            deliveryCharge: parseFloat(deliveryCharge) || 0,
            isFinalizeImdt: isFinalizeImdt ? 1 : 0,
          };

          const orderId = await CartDao.createOrderWithTransaction(connection, orderData);
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

          // 4. Insert into processorders
          const processOrderData = {
            orderId,
            paymentMethod: paymentMethod || "Card",
            amount: parseFloat(grandTotal),
            creditPaid: parsedCreditPaid,
            moneyPaid: parsedMoneyPaid,
            status: status || "Ordered",
            isPaid: isPaid ? 1 : 0,
            transactionId: transactionId || null,
            sheduleDate: sheduleDate
              ? new Date(sheduleDate)
              : deliveryDate
              ? new Date(deliveryDate)
              : null,
          };

          const processOrderResult = await CartDao.createProcessOrderWithTransaction(
            connection,
            processOrderData
          );

          // 5. Save items
          await CartDao.saveOrderItemsWithTransaction(
            connection,
            orderId,
            processOrderResult.insertId,
            cartItems
          );

          // 6. Credit bonus & credit deduction if credit was used
          if (parsedCreditPaid > 0) {
            await CartDao.applyCreditLimitBonusIfEligible(connection, userId);
            await CartDao.deductUserCreditWithTransaction(
              connection,
              userId,
              parsedCreditPaid
            );
          }

          // 7. Commit transaction
          connection.commit(async (commitErr) => {
            if (commitErr) {
              connection.rollback(() => releaseConnection(connection));
              return reject(commitErr);
            }

            releaseConnection(connection);

            // 8. Clear Cart
            try {
              await CartDao.clearCart(cartId);
              console.log(`[Order Placement] Cart ${cartId} cleared successfully.`);
            } catch (clearErr) {
              console.warn("[Order Placement] Could not clear cart:", clearErr.message);
            }

            resolve({
              orderId,
              processOrderId: processOrderResult.insertId,
              invoiceNumber: processOrderResult.invNo,
              qrCodeUrl: processOrderResult.qrCodeUrl,
              total: grandTotal,
              status,
              creditPaid: parsedCreditPaid,
              moneyPaid: parsedMoneyPaid,
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
