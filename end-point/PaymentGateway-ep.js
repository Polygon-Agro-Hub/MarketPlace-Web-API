const PGdao = require("../dao/Paymentgateway-dao");
const CartDao = require("../dao/Cart-dao");
const ProductDao = require("../dao/Product-dao");
const { getScheduleWindow, generateScheduleDates } = require("../utils/sheduleGenarator");
const { createOrderValidationSchema } = require("../validations/order-validation");
const paymentGatewayFactory = require("../services/payment/payment.factory");
const orderPlacementService = require("../services/payment/order-placement.service");
const RetailOrderDao = require("../dao/RetailOrder-dao");
const UserDao = require("../dao/user-dao");
const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");

// Bounded in-memory idempotency cache for duplicate webhook event deduplication
const processedPaymentIds = new Set();
const MAX_PROCESSED_IDS = 5000;

const markPaymentProcessed = (paymentId) => {
  if (!paymentId) return false;
  const pid = String(paymentId);
  if (processedPaymentIds.has(pid)) return true;
  if (processedPaymentIds.size >= MAX_PROCESSED_IDS) {
    const firstEntry = processedPaymentIds.values().next().value;
    processedPaymentIds.delete(firstEntry);
  }
  processedPaymentIds.add(pid);
  return false;
};

// Allow a gateway retry to be processed again if placing the order failed
const unmarkPaymentProcessed = (paymentId) => {
  if (!paymentId) return;
  processedPaymentIds.delete(String(paymentId));
};

const parseCreditBalanceReference = (reference) => {
  const match = /^CREDIT_(\d+)_(\d+)_(\d+)$/.exec(String(reference || ""));
  if (!match) return null;
  return {
    userId: match[1],
    amount: Number(match[2]) / 100,
  };
};

/**
 * Finalises a paid checkout.
 *
 * New flow: the order + process orders were already created in initiatePayment,
 * so we only flip them to paid.
 * Legacy flow: sessions saved before this change have no orderId in their
 * payload, so the order is still placed from the stored checkout payload.
 */
const fulfillPaidCheckout = async (pendingSession, paymentId) => {
  const payload = pendingSession.payload || {};

  if (payload.orderId) {
    await PGdao.markOrderPaid({
      orderId: payload.orderId,
      processOrderIds: payload.processOrderIds || [],
      transactionId: paymentId,
    });

    let invoiceNumber = null;
    try {
      const summary = await PGdao.getOrderStatusSummary(payload.orderId);
      invoiceNumber = summary?.invoiceNumber || null;
    } catch (summaryErr) {
      // Not critical: the order is already marked paid
      console.warn("[PG] Could not load invoice number:", summaryErr.message);
    }

    return { orderId: payload.orderId, invoiceNumber };
  }

  return orderPlacementService.placeOrderFromCheckout({
    ...payload,
    transactionId: paymentId,
    isPaid: 1,
    status: "Ordered",
  });
};

/**
 * 1. INITIATE PAYMENT CHECKOUT (Adapter & Factory Pattern)
 * Creates the order (unpaid) in a transaction, then generates the
 * Payments.lk hosted session. The webhook / status fallback marks it paid.
 */

const toDateStr = (v) => (v ? String(v).slice(0, 10) : null);


exports.initiatePayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized. Please log in." });
    }

    // ------------------------------------------------------------------
    // 1. Validate payload
    // ------------------------------------------------------------------
    const { error, value } = createOrderValidationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    console.log("[PG EP] Initiate Payment Request:", { userId, payload: value });

    if (error) {
      return res.status(400).json({
        status: false,
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const {
      cartId,
      checkoutDetails,
      paymentMethod,
      orderApp = "Marketplace",
      isFinalizeImdt = 0,
    } = value;

    // ------------------------------------------------------------------
    // 2. Verify cart ownership + availability + get items
    // ------------------------------------------------------------------
    const cartExists = await CartDao.validateCart(cartId, userId);
    if (!cartExists) {
      return res.status(404).json({
        status: false,
        message: "Cart not found or does not belong to your account",
      });
    }

    const availability = await CartDao.checkCartItemsAvailability(cartId);
    if (availability.hasUnavailableItems) {
      return res.status(409).json({
        status: false,
        code: "ITEMS_UNAVAILABLE",
        message: "Some items in your cart are no longer available. Please update your cart.",
      });
    }

    const cartItems = await CartDao.getCartItems(cartId);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ status: false, message: "Your cart is empty." });
    }

    // ------------------------------------------------------------------
    // 3. Destructure checkout details (same as createOrder)
    // ------------------------------------------------------------------
    const {
      buildingType, houseNo, street, cityName, buildingNo, buildingName,
      flatNumber, floorNumber, deliveryMethod, title, phoneCode1, phone1,
      phoneCode2, phone2, scheduleType, deliveryDate, timeSlot, fullName,
      centerId, couponValue = 0, isCoupon = false, geoLatitude = null,
      geoLongitude = null, companycenterId,
      couponType = null,
      saveAs = null,
      selectedDays = null,
      validPeriod = null,
      sheduleDate = null,
    } = checkoutDetails;

    if (!deliveryMethod || !title || !phone1 || !fullName) {
      return res.status(400).json({
        error: "Missing required checkout details: deliveryMethod, title, phone1, or fullName",
      });
    }

    if (deliveryMethod === "home") {
      if (buildingType === "apartment") {
        if (!buildingNo || !buildingName || !flatNumber || !floorNumber) {
          return res.status(400).json({
            error: "For apartment delivery, buildingNo, buildingName, flatNumber, and floorNumber are required",
          });
        }
      } else if (buildingType === "house") {
        if (!houseNo || !street) {
          return res.status(400).json({
            error: "For house delivery, houseNo and street are required",
          });
        }
      }
      if (!cityName) {
        return res.status(400).json({ error: "City name is required for home delivery" });
      }
    } else if (deliveryMethod === "pickup") {
      if (!centerId) {
        return res.status(400).json({ error: "Center ID is required for pickup delivery" });
      }
    }

    // ------------------------------------------------------------------
    // 4. Schedule dates (validated NOW, reused by webhook)
    // ------------------------------------------------------------------

    const isRecurring = (scheduleType || "One Time") !== "One Time";
    let scheduleDates;
    let scheduleWindow; // NEW

    let oneTimePackages;
    try {
      oneTimePackages = await ProductDao.getCheckoutOneTimePackagesDao(userId);
    } catch (pkgErr) {
      console.error("[PG EP] Failed to load one-time packages:", pkgErr);
      return res.status(500).json({ status: false, message: "Could not verify schedule dates" });
    }

    try {
      scheduleWindow = getScheduleWindow(oneTimePackages); // NEW: reuse below

      scheduleDates = generateScheduleDates({
        scheduleType: scheduleType || "One Time",
        deliveryDate:
          (deliveryDate ? String(deliveryDate).slice(0, 10) : null) ||
          (sheduleDate ? String(sheduleDate).slice(0, 10) : null),
        selectedDays,
        validPeriod,
        window: scheduleWindow, // NEW
      });
    } catch (scheduleErr) {
      console.error("[PG EP] Schedule validation failed:", scheduleErr.message);
      return res.status(400).json({
        status: false,
        code: "INVALID_SCHEDULE",
        message: "Invalid schedule details",
        details: scheduleErr.message,
      });
    }

    const earliestPossibleDate = toDateStr(scheduleWindow?.earliestDate);

    const hasPackages = cartItems.some((item) => item.itemType === 'package');

    const computeIsConfirmed = (dateIso) =>
      (!!isFinalizeImdt || !hasPackages) &&
        !!earliestPossibleDate &&
        toDateStr(dateIso) === earliestPossibleDate
        ? 1
        : 0;

    // ------------------------------------------------------------------
    // 5. Pricing & amount payable calculation
    // ------------------------------------------------------------------
    const grandTotal = parseFloat(value.grandTotal) || 0;
    const discountAmount = parseFloat(value.discountAmount) || 0;
    const deliveryCharge = parseFloat(value.deliveryCharge) || 0;
    const creditPaid = value.isCreditApplied ? parseFloat(value.creditPaid) || 0 : 0;
    const moneyPaid =
      parseFloat(value.moneyPaid) > 0
        ? parseFloat(value.moneyPaid)
        : Math.max(0, parseFloat((grandTotal - creditPaid).toFixed(2)));

    if (moneyPaid <= 0) {
      return res.status(400).json({
        status: false,
        message: "Amount payable by card is zero. Please place order directly using Credit Balance.",
      });
    }

    // Sanity: creditPaid + moneyPaid must equal grandTotal
    const combinedPaid = Math.round((creditPaid + moneyPaid) * 100) / 100;
    const roundedGrandTotal = Math.round(grandTotal * 100) / 100;
    if (Math.abs(combinedPaid - roundedGrandTotal) > 0.01) {
      return res.status(400).json({
        status: false,
        message: "creditPaid and moneyPaid must add up to the grand total",
      });
    }

    // ------------------------------------------------------------------
    // 6. Customer profile for gateway pre-fill
    // ------------------------------------------------------------------
    const userProfile = (await PGdao.getUserProfile(userId)) || {};
    const customer = {
      firstName: checkoutDetails.fullName || userProfile.firstName || "Customer",
      lastName: userProfile.lastName || "",
      email: userProfile.email || "customer@govimart.lk",
      phone: checkoutDetails.phone1 || userProfile.phoneNumber || "",
    };

    // ------------------------------------------------------------------
    // 7. Generate reference (used for gateway + stored on order)
    // ------------------------------------------------------------------
    const reference = `ORD_${userId}_${Date.now()}`;

    const clientOrigin =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")).origin : null) ||
      process.env.FRONTEND_URL ||
      "https://dev.polygon.lk";

    // ==================================================================
    // 8. CREATE THE ORDER (logic copied from createOrder) - inside txn
    // ==================================================================
    let orderId;
    let processOrderResults = [];
    let addressId;
    let creditDeductionResult = { deducted: 0, newBalance: null };
    let creditLimitBonusResult = { applied: false };

    let released = false;
    const releaseConnection = (connection) => {
      if (!released && connection) {
        released = true;
        connection.release();
      }
    };

    const ITEMS_UNAVAILABLE_SENTINEL = Symbol("ITEMS_UNAVAILABLE");

    const orderCreationResult = await new Promise((resolve, reject) => {
      collectionofficer.getConnection((connErr, connection) => {
        if (connErr) {
          console.error("[PG EP] DB connection error:", connErr);
          return reject(new Error("Database connection error"));
        }

        connection.beginTransaction((txErr) => {
          if (txErr) {
            console.error("[PG EP] Transaction start error:", txErr);
            releaseConnection(connection);
            return reject(new Error("Transaction start error"));
          }

          // Re-verify cart inside the transaction (same as createOrder)
          CartDao.validateCart(cartId, userId)
            .then((exists) => {
              if (!exists) throw new Error("Cart not found or doesn't belong to user");
              return CartDao.checkCartItemsAvailability(cartId);
            })
            .then((avail) => {
              if (avail.hasUnavailableItems) return ITEMS_UNAVAILABLE_SENTINEL;
              return CartDao.getCartItems(cartId);
            })
            .then((itemsOrSentinel) => {
              if (itemsOrSentinel === ITEMS_UNAVAILABLE_SENTINEL) return ITEMS_UNAVAILABLE_SENTINEL;

              const freshCartItems = itemsOrSentinel;
              if (!freshCartItems || freshCartItems.length === 0) {
                throw new Error("Cart is empty. Cannot create order.");
              }

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
                selectedDays: selectedDays || null,
                isPackage: freshCartItems.some((item) => item.itemType === "package") ? 1 : 0,
                latitude: geoLatitude ? parseFloat(geoLatitude) : null,
                longitude: geoLongitude ? parseFloat(geoLongitude) : null,
                companycenterId: parseInt(companycenterId) || null,
                isFinalizeImdt: isFinalizeImdt ? 1 : 0,
                // store reference so webhook can match the order
                paymentReference: reference,
              };

              return CartDao.createOrderWithTransaction(connection, orderData);
            })
            .then((newOrderIdOrSentinel) => {
              if (newOrderIdOrSentinel === ITEMS_UNAVAILABLE_SENTINEL) return ITEMS_UNAVAILABLE_SENTINEL;
              if (!newOrderIdOrSentinel) throw new Error("Failed to create order");
              orderId = newOrderIdOrSentinel;

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
                return CartDao.createOrderAddressWithTransaction(
                  connection,
                  orderId,
                  addressData,
                  buildingType
                );
              }
              return Promise.resolve(null);
            })
            .then((newAddressIdOrSentinel) => {
              if (newAddressIdOrSentinel === ITEMS_UNAVAILABLE_SENTINEL) return ITEMS_UNAVAILABLE_SENTINEL;
              addressId = newAddressIdOrSentinel;

              const baseProcessOrderData = {
                orderId,
                paymentMethod: "Card", // gateway payment
                amount: parseFloat(grandTotal),
                creditPaid,
                moneyPaid,
                status: "Ordered",
                isPaid: 0, // flipped to 1 by webhook / status fallback
                isCoupon: isCoupon ? 1 : 0,
                couponValue: parseFloat(couponValue) || 0,
                couponType: isCoupon ? couponType : null,
                total: parseFloat(grandTotal) + parseFloat(discountAmount) || 0,
                fullTotal: parseFloat(grandTotal) || 0,
                discount: parseFloat(discountAmount) || 0,
                deliveryCharge: parseFloat(deliveryCharge) || 0,
                paymentReference: reference,
              };

              return scheduleDates.reduce((chain, dateIso, index) => {
                return chain.then(() => {
                  const isPayingOrder = !isRecurring || index === 0;

                  const isConfirmed = computeIsConfirmed(dateIso);   // ← was: date === earliest only

                  const processOrderData = {
                    ...baseProcessOrderData,
                    ...(isPayingOrder ? {} : { amount: 0, creditPaid: 0, moneyPaid: 0 }),
                    isPayingOrder,
                    isConfirmed,
                    sheduleDate: dateIso,
                  };
                  return CartDao.createProcessOrderWithTransaction(connection, processOrderData).then(
                    (po) => processOrderResults.push(po)
                  );
                });
              }, Promise.resolve());
            })
            .then((sentinelOrVoid) => {
              if (sentinelOrVoid === ITEMS_UNAVAILABLE_SENTINEL) return ITEMS_UNAVAILABLE_SENTINEL;

              return processOrderResults.reduce((chain, po) => {
                return chain.then(() =>
                  CartDao.saveOrderItemsWithTransaction(connection, orderId, po.insertId, cartItems)
                );
              }, Promise.resolve());
            })
            .then((sentinelOrVoid) => {
              if (sentinelOrVoid === ITEMS_UNAVAILABLE_SENTINEL) return ITEMS_UNAVAILABLE_SENTINEL;

              // Deduct credit ONCE (only the paying order's credit portion)
              return CartDao.applyCreditLimitBonusIfEligible(connection, userId).then((bonusResult) => {
                creditLimitBonusResult = bonusResult;
                return CartDao.deductUserCreditWithTransaction(connection, userId, creditPaid);
              });
            })
            .then((deductionResultOrSentinel) => {
              if (deductionResultOrSentinel === ITEMS_UNAVAILABLE_SENTINEL) {
                connection.rollback(() => {
                  releaseConnection(connection);
                  resolve({ sentinel: ITEMS_UNAVAILABLE_SENTINEL });
                });
                return;
              }

              creditDeductionResult = deductionResultOrSentinel;

              connection.commit((commitErr) => {
                if (commitErr) {
                  console.error("[PG EP] Commit error:", commitErr);
                  connection.rollback(() => {
                    releaseConnection(connection);
                    reject(new Error("Transaction commit failed"));
                  });
                  return;
                }
                releaseConnection(connection);
                resolve({ sentinel: null });
              });
            })
            .catch((error) => {
              console.error("[PG EP] Order creation error:", error);
              connection.rollback(() => {
                releaseConnection(connection);
                reject(error);
              });
            });
        });
      });
    });

    // Handle cart-items-unavailable during txn
    if (orderCreationResult.sentinel === ITEMS_UNAVAILABLE_SENTINEL) {
      return res.status(409).json({
        status: false,
        code: "ITEMS_UNAVAILABLE",
        message: "Some items in your cart are no longer available. Please update your cart.",
      });
    }

    // ------------------------------------------------------------------
    // 9. Initiate payment gateway session
    // ------------------------------------------------------------------
    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    let session;
    try {
      session = await strategy.initiatePayment({
        amount: moneyPaid,
        reference,
        description: `GoviMart Order #${reference}`,
        customer,
        origin: clientOrigin,
      });
    } catch (gatewayErr) {
      console.error("[PG EP] Gateway initiate failed:", gatewayErr);
      // Order already created; needs manual review / cancel
      return res.status(502).json({
        status: false,
        message: "Order created but failed to initialize payment session. Please contact support.",
        orderId,
        reference,
      });
    }

    // ------------------------------------------------------------------
    // 10. Save pending checkout (with sessionId + orderId + scheduleDates)
    // ------------------------------------------------------------------
    const finalPayload = {
      ...value,
      userId,
      cartId,
      orderId,
      processOrderIds: processOrderResults.map((po) => po.insertId),
      scheduleDates,
      grandTotal,
      discountAmount,
      deliveryCharge,
      creditPaid,
      moneyPaid,
      paymentMethod: "Card",
      reference,
    };

    await PGdao.savePendingCheckout(
      reference,
      userId,
      cartId,
      finalPayload,
      moneyPaid,
      session.sessionId
    );

    // ------------------------------------------------------------------
    // 11. Clear cart (after commit - same as createOrder)
    // ------------------------------------------------------------------
    CartDao.clearCart(cartId)
      .then((cleared) => {
        if (cleared) console.log(`[PG EP] Cart ${cartId} cleared`);
        else console.warn(`[PG EP] Cart ${cartId} not found or already cleared`);
      })
      .catch((cartError) => {
        console.warn("[PG EP] Could not clear cart:", cartError);
      });

    // ------------------------------------------------------------------
    // 12. Respond
    // ------------------------------------------------------------------
    return res.status(200).json({
      status: true,
      message: "Payments.lk checkout session initialized successfully",
      data: {
        checkoutUrl: session.checkoutUrl,
        sessionId: session.sessionId,
        reference: session.reference,
        amount: session.amount,
        currency: session.currency,
        orderId,
        processOrders: processOrderResults.map((po, idx) => ({
          processOrderId: po.insertId,
          invoiceNumber: po.invNo,
          sheduleDate: scheduleDates[idx],
          isPayingOrder: !isRecurring || idx === 0,
          isConfirmed: !!po.isConfirmed,
        })),
        newCreditBalance: creditDeductionResult.newBalance,
      },
    });
  } catch (err) {
    console.error("[PG EP Initiate Payment Error]:", err);

    // Handle specific known errors from the order-creation promise
    if (err.message === "Cart not found or doesn't belong to user") {
      return res.status(404).json({ status: false, message: err.message });
    }
    if (err.message === "Cart is empty. Cannot create order.") {
      return res.status(400).json({ status: false, message: err.message });
    }
    if (err.message === "Insufficient credit balance") {
      return res.status(400).json({ status: false, message: err.message });
    }

    return res.status(500).json({
      status: false,
      message: err.message || "Failed to initiate payment session",
    });
  }
};

/**
 * 2. WEBHOOK HANDLER (Signed Webhook Verification & Order Finalisation)
 * Endpoint: POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res) => {
  let eventId = null;

  try {
    const signatureHeader = req.headers["payments-signature"];
    const rawBody = req.rawBody || req.body;
    console.log("[PG Webhook] Request received:", {
      method: req.method,
      path: req.originalUrl,
      hasSignature: Boolean(signatureHeader),
      rawBodyType: Buffer.isBuffer(rawBody) ? "Buffer" : typeof rawBody,
      rawBodyLength: Buffer.isBuffer(rawBody)
        ? rawBody.length
        : typeof rawBody === "string"
          ? rawBody.length
          : undefined,
    });

    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    const verification = strategy.verifyAndConstructWebhook(signatureHeader, rawBody);

    if (!verification.isValid) {
      console.error("[PG Webhook] Invalid signature:", verification.error);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = strategy.parseWebhookEvent(verification.event);
    console.log("[PG Webhook] Verified event:", {
      eventType: event.eventType,
      reference: event.reference,
      paymentId: event.paymentId,
      amount: event.amount,
      isPaid: event.isPaid,
    });

    // Deduplication / Idempotency Check
    eventId = event.paymentId || `${event.eventType}_${event.reference}`;
    if (markPaymentProcessed(eventId)) {
      console.log(`[PG Webhook] Duplicate webhook skipped for event ID: ${eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    const creditPayment = parseCreditBalanceReference(event.reference);
    if (creditPayment) {
      if (event.isPaid) {
        if (
          typeof event.amount !== "number" ||
          Math.abs(event.amount - creditPayment.amount) > 0.01
        ) {
          console.error("[Credit Payment] Gateway amount mismatch:", {
            reference: event.reference,
            expected: creditPayment.amount,
            received: event.amount,
          });
          unmarkPaymentProcessed(eventId);
          return res.status(400).json({ error: "Payment amount mismatch" });
        }

        try {
          await UserDao.updateCreditBalanceByUserIdDao(creditPayment.userId);
          console.log(
            `[Credit Payment] User ${creditPayment.userId} credit balance cleared`
          );
        } catch (creditErr) {
          unmarkPaymentProcessed(eventId);
          console.error("[Credit Payment] Failed to clear credit balance:", creditErr);
          return res.status(500).json({ error: "Failed to update credit balance" });
        }
      }

      return res.status(200).json({ received: true });
    }

    if (typeof event.reference === "string" && event.reference.startsWith("CNF_")) {
      if (event.isPaid) {
        try {
          const result = await RetailOrderDao.handleConfirmationPaymentSuccess({
            reference: event.reference,
            transactionId: event.paymentId,
            amountPaid: event.amount ?? null,
          });
          console.log("[PG Webhook] Order confirmation DB update completed:", {
            reference: event.reference,
            result,
          });
        } catch (confirmErr) {
          if (["AMOUNT_MISMATCH", "INSUFFICIENT_CREDIT", "NOT_FOUND"].includes(confirmErr.code)) {
            console.error(
              `[PG Webhook] MANUAL REVIEW: paid but could not confirm ${event.reference} (${confirmErr.code}): ${confirmErr.message}`
            );
            return res.status(200).json({ received: true, needsReview: true });
          }
          processedPaymentIds.delete(String(eventId));
          console.error(`[PG Webhook] Failed to confirm order for ${event.reference}:`, confirmErr);
          return res.status(500).json({ error: "Failed to confirm order in database" });
        }
      } else {
        console.log(`[PG Webhook] ${event.eventType} for ${event.reference} - order eka confirm wenne na`);
      }
      return res.status(200).json({ received: true });
    }

    if (event.isPaid) {
      console.log(`[PG Webhook] Payment succeeded for reference ${event.reference}! Finalising order...`);
      const pendingSession = await PGdao.getPendingCheckout(event.reference);

      if (!pendingSession) {
        console.warn(`[PG Webhook] No pending checkout session found for reference ${event.reference}`);
        return res.status(200).json({ received: true, note: "Session reference not found" });
      }

      if (pendingSession.status === "COMPLETED") {
        console.log(`[PG Webhook] Order already fulfilled for reference ${event.reference}`);
        return res.status(200).json({ received: true, alreadyFulfilled: true });
      }

      // Atomically claim the session so the status-fallback can't finalise it too
      const claimed = await PGdao.claimPendingCheckout(event.reference);
      if (!claimed) {
        console.log(`[PG Webhook] Reference ${event.reference} is already being fulfilled elsewhere, skipping`);
        return res.status(200).json({ received: true, alreadyProcessing: true });
      }

      try {
        const orderResult = await fulfillPaidCheckout(pendingSession, event.paymentId);

        await PGdao.updatePendingCheckoutStatus(
          event.reference,
          "COMPLETED",
          orderResult.orderId
        );

        console.log(`[PG Webhook] Order #${orderResult.orderId} successfully finalised via webhook!`);
      } catch (placeErr) {
        console.error(
          `[PG Webhook] Failed to finalise order for reference ${event.reference}:`,
          placeErr && placeErr.stack ? placeErr.stack : placeErr
        );

        // Release the claim and the in-memory dedupe so the gateway's retry can succeed
        try {
          await PGdao.updatePendingCheckoutStatus(event.reference, "PENDING");
        } catch (resetErr) {
          console.error("[PG Webhook] Could not reset session to PENDING:", resetErr);
        }
        unmarkPaymentProcessed(eventId);

        return res.status(500).json({ error: "Failed to finalise order in database" });
      }
    } else if (event.eventType === "payment.failed" || event.eventType === "checkout.expired") {
      console.log(`[PG Webhook] Payment failed or expired for reference ${event.reference}`);
      await PGdao.updatePendingCheckoutStatus(
        event.reference,
        event.eventType === "checkout.expired" ? "EXPIRED" : "FAILED"
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[PG Webhook Error]:", error);
    unmarkPaymentProcessed(eventId);
    return res.status(500).json({ error: "Server error processing webhook" });
  }
};

/**
 * 3. ORDER STATUS INQUIRY
 * Allows frontend return URL to check if the order has been marked paid.
 * Endpoint: GET /api/payment/order-status/:reference
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ status: false, message: "Reference is required" });
    }

    const confirmationMatch = /^CNF_(\d+)_/.exec(reference);
    if (confirmationMatch) {
      const processOrderId = Number(confirmationMatch[1]);
      const confirmation = await RetailOrderDao.getConfirmationStatusDao(
        processOrderId,
        userId
      );

      if (!confirmation) {
        return res.status(404).json({ status: false, message: "Order not found" });
      }

      if (!confirmation.isConfirmed) {
        const checkoutId = req.query.checkout || req.query.checkoutId;
        if (checkoutId) {
          try {
            const strategy = paymentGatewayFactory.getGateway("payments_lk");
            const checkoutData = await strategy.retrieveCheckout(checkoutId);
            const paymentSucceeded =
              checkoutData &&
              (checkoutData.status === "completed" ||
                checkoutData.payment?.status === "succeeded");

            if (paymentSucceeded) {
              const amountCents =
                checkoutData.payment?.amountCents ?? checkoutData.amountCents;
              const result = await RetailOrderDao.handleConfirmationPaymentSuccess({
                reference,
                transactionId:
                  checkoutData.payment?.id || checkoutData.paymentId || checkoutData.id,
                amountPaid:
                  typeof amountCents === "number" ? amountCents / 100 : null,
              });
              console.log("[Order Status Sync] Confirmation payment synchronized:", {
                reference,
                checkoutId,
                result,
              });
            }
          } catch (syncErr) {
            console.warn(
              "[Order Status Sync] Could not synchronize confirmation payment:",
              syncErr.message
            );
          }
        }
      }

      const updatedConfirmation = await RetailOrderDao.getConfirmationStatusDao(
        processOrderId,
        userId
      );
      return res.status(200).json({
        status: true,
        isCompleted: updatedConfirmation.isConfirmed,
        orderId: processOrderId,
        invoiceNumber: updatedConfirmation.invoiceNumber,
      });
    }

    const creditPayment = parseCreditBalanceReference(reference);
    if (creditPayment) {
      if (String(creditPayment.userId) !== String(userId)) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized: This payment does not belong to your account",
        });
      }

      const checkoutId = req.query.checkout || req.query.checkoutId;
      if (!checkoutId) {
        return res.status(400).json({
          status: false,
          message: "Checkout ID is required for credit balance payment status",
        });
      }

      try {
        const strategy = paymentGatewayFactory.getGateway("payments_lk");
        const checkoutData = await strategy.retrieveCheckout(checkoutId);
        const paymentSucceeded =
          checkoutData &&
          (checkoutData.status === "completed" ||
            checkoutData.payment?.status === "succeeded");

        if (paymentSucceeded) {
          const amountCents =
            checkoutData.payment?.amountCents ?? checkoutData.amountCents;
          const paidAmount =
            typeof amountCents === "number" ? amountCents / 100 : null;

          if (paidAmount === null || Math.abs(paidAmount - creditPayment.amount) > 0.01) {
            return res.status(400).json({
              status: false,
              message: "Payment amount mismatch",
            });
          }

          const result = await UserDao.updateCreditBalanceByUserIdDao(userId);
          return res.status(200).json({
            status: true,
            isCompleted: true,
            amount: creditPayment.amount,
            newBalance: result.newBalance,
          });
        }

        return res.status(200).json({
          status: true,
          isCompleted: false,
          sessionStatus: checkoutData?.status || "PENDING",
        });
      } catch (creditStatusErr) {
        console.error("[Credit Payment] Failed to retrieve payment status:", creditStatusErr);
        return res.status(502).json({
          status: false,
          message: "Failed to retrieve credit payment status",
        });
      }
    }

    const pendingSession = await PGdao.getPendingCheckout(reference);
    if (!pendingSession) {
      return res.status(404).json({ status: false, message: "Checkout session not found" });
    }

    // IDOR Protection: Verify reference belongs to authenticated user
    if (String(pendingSession.userId) !== String(userId)) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized: This session does not belong to your account",
      });
    }

    if (pendingSession.status === "COMPLETED" && pendingSession.orderId) {
      const summary = await PGdao.getOrderStatusSummary(pendingSession.orderId);
      return res.status(200).json({
        status: true,
        isCompleted: true,
        orderId: pendingSession.orderId,
        invoiceNumber: summary?.invoiceNumber || null,
        amount: pendingSession.amount,
      });
    }

    // Fallback sync: If still PENDING, verify directly with Payments.lk API
    const targetCheckoutId = req.query.checkout || req.query.checkoutId || pendingSession.sessionId;
    if (targetCheckoutId && pendingSession.status === "PENDING") {
      let claimed = false;

      try {
        const strategy = paymentGatewayFactory.getGateway("payments_lk");
        const checkoutData = await strategy.retrieveCheckout(targetCheckoutId);

        if (
          checkoutData &&
          (checkoutData.status === "completed" || checkoutData.payment?.status === "succeeded")
        ) {
          console.log(
            `[Order Status Sync] Payment confirmed via Payments.lk API for reference ${reference}! Finalising order...`
          );

          // Atomically claim the session; if the webhook got there first, just report "not yet"
          claimed = await PGdao.claimPendingCheckout(reference);
          if (claimed) {
            const paymentId = checkoutData.payment?.id || `pay_${Date.now()}`;

            // NOTE: use paymentId here ("event" only exists in the webhook handler)
            const orderResult = await fulfillPaidCheckout(pendingSession, paymentId);

            await PGdao.updatePendingCheckoutStatus(
              reference,
              "COMPLETED",
              orderResult.orderId
            );

            console.log(`[Order Status Sync] Order #${orderResult.orderId} successfully finalised!`);

            return res.status(200).json({
              status: true,
              isCompleted: true,
              orderId: orderResult.orderId,
              invoiceNumber: orderResult.invoiceNumber,
              newBalance: orderResult.newBalance,
              amount: pendingSession.amount,
            });
          }
        }
      } catch (syncErr) {
        console.error(
          "[Order Status Sync] Could not sync with Payments.lk API:",
          syncErr && syncErr.stack ? syncErr.stack : syncErr
        );

        // If we claimed the session but failed to finalise, release it for a retry
        if (claimed) {
          try {
            await PGdao.updatePendingCheckoutStatus(reference, "PENDING");
          } catch (resetErr) {
            console.error("[Order Status Sync] Could not reset session to PENDING:", resetErr);
          }
        }
      }
    }

    return res.status(200).json({
      status: true,
      isCompleted: false,
      sessionStatus: pendingSession.status,
    });
  } catch (error) {
    console.error("[PG EP Get Order Status Error]:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to retrieve order status",
    });
  }
};