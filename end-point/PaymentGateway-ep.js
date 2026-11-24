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
const { PaymentsLk } = require("@payments-lk/node");

const lk = new PaymentsLk(process.env.PAYMENTS_LK_SECRET_KEY);
const CARD_VERIFY_AMOUNT_CENTS = 1000;

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

// Promise wrappers around the mysql connection callbacks
const getConnection = () =>
  new Promise((resolve, reject) =>
    collectionofficer.getConnection((err, conn) => (err ? reject(err) : resolve(conn)))
  );
const beginTx = (conn) =>
  new Promise((resolve, reject) => conn.beginTransaction((e) => (e ? reject(e) : resolve())));
const commitTx = (conn) =>
  new Promise((resolve, reject) => conn.commit((e) => (e ? reject(e) : resolve())));
const rollbackTx = (conn) => new Promise((resolve) => conn.rollback(() => resolve()));

/**
 * Creates the order, address, process orders, items and credit deduction in ONE
 * transaction. Only called after the gateway confirmed the payment.
 * Returns { orderId, invoiceNumber, newBalance }.
 */
const placeOrderAfterPayment = async (payload, paymentId) => {
  const {
    userId,
    cartId,
    cartItems,
    checkoutDetails,
    scheduleDates,
    earliestPossibleDate,
    hasPackages,
    isRecurring,
    orderApp = "Marketplace",
    isFinalizeImdt = 0,
    grandTotal,
    discountAmount,
    deliveryCharge,
    creditPaid,
    moneyPaid,
    reference,
  } = payload;

  const {
    buildingType, houseNo, street, cityName, buildingNo, buildingName,
    flatNumber, floorNumber, deliveryMethod, title, phoneCode1, phone1,
    phoneCode2, phone2, scheduleType, timeSlot, fullName, centerId,
    couponValue = 0, isCoupon = false, geoLatitude = null, geoLongitude = null,
    companycenterId, couponType = null, saveAs = null, selectedDays = null,
    validPeriod = null,
  } = checkoutDetails;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart snapshot is empty. Cannot create order.");
  }
  if (!Array.isArray(scheduleDates) || scheduleDates.length === 0) {
    throw new Error("No schedule dates in checkout payload.");
  }

  const toDate = (v) => (v ? String(v).slice(0, 10) : null);
  const computeIsConfirmed = (dateIso) =>
    (!!isFinalizeImdt || !hasPackages) &&
      !!earliestPossibleDate &&
      toDate(dateIso) === toDate(earliestPossibleDate)
      ? 1
      : 0;

  const connection = await getConnection();
  try {
    await beginTx(connection);

    if (paymentId) {
      const [existing] = await new Promise((resolve, reject) =>
        connection.query(
          "SELECT orderId, invNo FROM processorders WHERE transactionId = ? LIMIT 1",
          [paymentId],
          (e, rows) => (e ? reject(e) : resolve(rows || []))
        )
      );
      if (existing) {
        await rollbackTx(connection);
        return { orderId: existing.orderId, invoiceNumber: existing.invNo, newBalance: null };
      }
    }

    // 1. Order
    const orderId = await CartDao.createOrderWithTransaction(connection, {
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
      isPackage: hasPackages ? 1 : 0,
      latitude: geoLatitude ? parseFloat(geoLatitude) : null,
      longitude: geoLongitude ? parseFloat(geoLongitude) : null,
      companycenterId: parseInt(companycenterId) || null,
      isFinalizeImdt: isFinalizeImdt ? 1 : 0,
    });
    if (!orderId) throw new Error("Failed to create order");

    // 2. Address (home delivery only)
    if (deliveryMethod === "home") {
      await CartDao.createOrderAddressWithTransaction(
        connection,
        orderId,
        {
          buildingNo,
          buildingName,
          unitNo: flatNumber,
          floorNo: floorNumber,
          houseNo,
          streetName: street,
          city: cityName,
          saveAs: saveAs || null,
        },
        buildingType
      );
    }

    // 3. Process orders: one per schedule date. Only the first is the paying one.
    const baseProcessOrderData = {
      orderId,
      paymentMethod: "Card",
      status: "Ordered",
      isCoupon: isCoupon ? 1 : 0,
      couponValue: parseFloat(couponValue) || 0,
      couponType: isCoupon ? couponType : null,
      total: parseFloat(grandTotal) + parseFloat(discountAmount) || 0,
      fullTotal: parseFloat(grandTotal) || 0,
      discount: parseFloat(discountAmount) || 0,
      deliveryCharge: parseFloat(deliveryCharge) || 0,
    };

    const processOrderResults = [];
    for (let index = 0; index < scheduleDates.length; index++) {
      const dateIso = scheduleDates[index];
      const isPayingOrder = !isRecurring || index === 0;

      const processOrderData = isPayingOrder
        ? {
          ...baseProcessOrderData,
          amount: parseFloat(grandTotal),
          creditPaid,
          moneyPaid,
          isPaid: 1,                 // payment is confirmed at this point
          transactionId: paymentId,
          isPayingOrder: true,
        }
        : {
          ...baseProcessOrderData,
          amount: 0,
          creditPaid: 0,
          moneyPaid: 0,
          isPaid: 0,                 // later recurring rows carry no payment
          transactionId: null,
          isPayingOrder: false,
        };

      processOrderData.isConfirmed = computeIsConfirmed(dateIso);
      processOrderData.sheduleDate = dateIso;

      console.log("[PO insert]", processOrderData)

      const po = await CartDao.createProcessOrderWithTransaction(connection, processOrderData);
      processOrderResults.push(po);
    }

    // 4. Items for every process order
    for (const po of processOrderResults) {
      await CartDao.saveOrderItemsWithTransaction(connection, orderId, po.insertId, cartItems);
    }

    // 5. Credit bonus + deduction (once, only the credit portion). Row-locked.
    await CartDao.applyCreditLimitBonusIfEligible(connection, userId);
    const deduction = await CartDao.deductUserCreditWithTransaction(connection, userId, creditPaid);

    await commitTx(connection);

    // 6. Clear the cart only now that the order exists
    CartDao.clearCart(cartId).catch((e) =>
      console.warn("[PG] Could not clear cart after order placement:", e.message)
    );

    return {
      orderId,
      invoiceNumber: processOrderResults[0]?.invNo || null,
      newBalance: deduction?.newBalance ?? null,
    };
  } catch (err) {
    await rollbackTx(connection);
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Finalises a paid checkout.
 * - New sessions: no orderId in the payload, so the order is created now.
 * - Sessions created by the OLD flow (orderId already exists): just flip to paid.
 *   Keep this branch until all old pending sessions have completed or expired.
 */
const fulfillPaidCheckout = async (pendingSession, paymentId) => {
  const payload = pendingSession.payload || {};
  console.log("[fulfill] paymentId:", paymentId, "payload.orderId:", payload.orderId, "hasSnapshot:", !!payload.cartItems);

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
      console.warn("[PG] Could not load invoice number:", summaryErr.message);
    }
    return { orderId: payload.orderId, invoiceNumber };
  }

  return placeOrderAfterPayment(payload, paymentId);
};

/**
 * 1. INITIATE PAYMENT CHECKOUT (Adapter & Factory Pattern)
 * Creates the order (unpaid) in a transaction, then generates the
 * Payments.lk hosted session. The webhook / status fallback marks it paid.
 */

const toDateStr = (v) => (v ? String(v).slice(0, 10) : null);

/**
 * 1. INITIATE PAYMENT CHECKOUT (Adapter & Factory Pattern)
 *
 * Validates the request, creates the Payments.lk hosted session and stores
 * everything needed to place the order in pending_checkout_sessions.
 *
 * NOTHING is written to orders / processorders here, no credit is deducted and
 * the cart is NOT cleared. The webhook (or the order-status fallback) calls
 * fulfillPaidCheckout -> orderPlacementService.placeOrderFromCheckout once the
 * payment is confirmed.
 */
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
    // 3. Destructure + validate checkout details
    // ------------------------------------------------------------------
    const {
      buildingType, houseNo, street, cityName, buildingNo, buildingName,
      flatNumber, floorNumber, deliveryMethod, title, phone1, fullName,
      centerId, deliveryDate, scheduleType, selectedDays = null,
      validPeriod = null, sheduleDate = null,
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
    // 4. Schedule dates (validated NOW, stored in the payload for fulfilment)
    // ------------------------------------------------------------------
    const isRecurring = (scheduleType || "One Time") !== "One Time";
    let scheduleDates;
    let scheduleWindow;

    let oneTimePackages;
    let buyerType;
    try {
      [oneTimePackages, buyerType] = await Promise.all([
        ProductDao.getCheckoutOneTimePackagesDao(userId),
        ProductDao.getUserBuyerTypeDao(userId),
      ]);
    } catch (pkgErr) {
      console.error("[PG EP] Failed to load schedule data:", pkgErr);
      return res.status(500).json({ status: false, message: "Could not verify schedule dates" });
    }

    try {
      scheduleWindow = getScheduleWindow(oneTimePackages, buyerType);
      console.log("[PG EP] Schedule window:", {
        buyerType,
        gapDays: scheduleWindow.gapDays,
        earliestDate: scheduleWindow.earliestDate,
      });

      scheduleDates = generateScheduleDates({
        scheduleType: scheduleType || "One Time",
        deliveryDate:
          (deliveryDate ? String(deliveryDate).slice(0, 10) : null) ||
          (sheduleDate ? String(sheduleDate).slice(0, 10) : null),
        selectedDays,
        validPeriod,
        window: scheduleWindow,
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

    // Stored so fulfilment can compute isConfirmed without re-reading the window
    const earliestPossibleDate = toDateStr(scheduleWindow?.earliestDate);
    const hasPackages = cartItems.some((item) => item.itemType === "package");

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
    // 5b. Read-only credit check (the real deduction happens after payment,
    //     inside placeOrderAfterPayment, with a row lock)
    // ------------------------------------------------------------------
    if (creditPaid > 0) {
      const balance = await UserDao.getCreditBalanceByUserId(userId);
      if (creditPaid > balance) {
        return res.status(400).json({
          status: false,
          message: "Insufficient credit balance",
        });
      }
    }

    // ------------------------------------------------------------------
    // 6. Customer profile for gateway pre-fill + "keep this card" offer
    // ------------------------------------------------------------------
    const userProfile = (await PGdao.getUserProfile(userId)) || {};
    const customer = {
      firstName: checkoutDetails.fullName || userProfile.firstName || "Customer",
      lastName: userProfile.lastName || "",
      email: userProfile.email || "customer@govimart.lk",
      phone: checkoutDetails.phone1 || userProfile.phoneNumber || "",
    };

    // Offer "keep this card" only when the user has a real email (cards are
    // linked by email) and no card saved yet. A failed lookup never blocks payment.
    let offerSaveCard = false;
    if (userProfile.email) {
      try {
        const existingCard = await findActiveCard(userProfile.email);
        offerSaveCard = !existingCard;
      } catch (cardErr) {
        console.warn("[PG EP] Saved card lookup failed, skipping save offer:", cardErr.message);
      }
    }

    // ------------------------------------------------------------------
    // 7. Generate reference (used for gateway + pending session)
    // ------------------------------------------------------------------
    const reference = `ORD_${userId}_${Date.now()}`;

    // Allowed by the Joi schema now; req.body is kept as a safety net
    const useSavedCard = value.useSavedCard === true || req.body?.useSavedCard === true;

    // ------------------------------------------------------------------
    // 8. Pending checkout payload: everything needed to place the order later
    // ------------------------------------------------------------------
    const finalPayload = {
      ...value,
      orderApp,
      isFinalizeImdt,
      userId,
      cartId,
      cartItems,            // snapshot, so cart edits during payment don't matter
      scheduleDates,
      earliestPossibleDate, // used for isConfirmed at fulfilment
      hasPackages,
      isRecurring,
      grandTotal,
      discountAmount,
      deliveryCharge,
      creditPaid,
      moneyPaid,
      paymentMethod: "Card",
      reference,
    };

    // ------------------------------------------------------------------
    // 9a. PAY WITH SAVED CARD (no redirect)
    // ------------------------------------------------------------------
    if (useSavedCard) {
      // The card id comes from the gateway lookup for THIS user's email, never from the client
      const card = userProfile.email ? await findActiveCard(userProfile.email) : null;
      if (!card) {
        return res.status(409).json({
          status: false,
          code: "NO_SAVED_CARD",
          message: "No saved card found. Please pay with another card.",
        });
      }

      // Expired card: the bank would decline it, so fail early
      if (card.expiry?.month && card.expiry?.year) {
        const y = card.expiry.year < 100 ? 2000 + card.expiry.year : card.expiry.year;
        const now = new Date();
        const expired =
          y < now.getFullYear() ||
          (y === now.getFullYear() && card.expiry.month < now.getMonth() + 1);
        if (expired) {
          return res.status(409).json({
            status: false,
            code: "CARD_EXPIRED",
            message: "Your saved card has expired. Please pay with another card.",
          });
        }
      }

      // Save FIRST: the payment.succeeded webhook looks this session up by reference,
      // and it can arrive before the charge call returns
      await PGdao.savePendingCheckout(reference, userId, cartId, finalPayload, moneyPaid, null);

      let payment;
      try {
        payment = await lk.cards.charge(
          card.id,
          {
            amountCents: Math.round(moneyPaid * 100),
            description: `Polygon Order #${reference}`,
            reference,
          },
          { idempotencyKey: reference }
        );
      } catch (chargeErr) {
        console.error("[PG EP] Saved card charge failed:", chargeErr);
        await PGdao.updatePendingCheckoutStatus(reference, "FAILED");

        const permanent = chargeErr?.reason === "card_not_reusable";
        return res.status(permanent ? 409 : 502).json({
          status: false,
          code: permanent ? "CARD_NOT_USABLE" : "CHARGE_FAILED",
          message: permanent
            ? "Your saved card can no longer be used. Please pay with another card."
            : "Could not charge your saved card. Please try again or use another card.",
        });
      }

      console.log("[PG EP] Saved card charge result:", { id: payment?.id, status: payment?.status });

      // Remember the payment id so order-status can check it without a webhook
      if (payment?.id) {
        await PGdao.setPendingSessionId(reference, `PAY:${payment.id}`);
      }

      // Usually "processing": the webhook or order-status finalises the order
      return res.status(200).json({
        status: true,
        message: "Saved card charge started",
        data: {
          reference,
          amount: moneyPaid,
          currency: "LKR",
          mode: "saved_card",
        },
      });
    }

    // ------------------------------------------------------------------
    // 9b. HOSTED CHECKOUT (pay with another card)
    // ------------------------------------------------------------------
    const clientOrigin =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")).origin : null) ||
      process.env.FRONTEND_URL ||
      "https://dev.polygon.lk";

    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    let session;
    try {
      session = await strategy.initiatePayment({
        amount: moneyPaid,
        reference,
        description: `Polygon Order #${reference}`,
        customer,
        origin: clientOrigin,
        saveCard: offerSaveCard, // the checkout shows a "keep this card" tick box
      });
    } catch (gatewayErr) {
      console.error("[PG EP] Gateway initiate failed:", gatewayErr);
      // Nothing was written to the DB, so the user can simply retry
      return res.status(502).json({
        status: false,
        message: "Failed to initialize payment session. Please try again.",
      });
    }

    await PGdao.savePendingCheckout(
      reference,
      userId,
      cartId,
      finalPayload,
      moneyPaid,
      session.sessionId
    );

    // ------------------------------------------------------------------
    // 10. Respond. No orderId yet: the frontend return page polls
    //     GET /order-status/:reference for orderId + invoiceNumber.
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
      },
    });
  } catch (err) {
    console.error("[PG EP Initiate Payment Error]:", err);
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
  console.log("[HIT]", require("os").hostname(), process.pid);
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

    // NEW: card events (card.saved, card.save_failed) are only acknowledged.
    // Cards live in Payments.lk, so there is nothing to store. This must stay
    // BEFORE parseWebhookEvent so card events never reach the order parsing.
    const rawEvent = verification.event; // assumes { type, data }
    if (typeof rawEvent?.type === "string" && rawEvent.type.startsWith("card.")) {
      if (rawEvent.type === "card.save_failed") {
        console.warn("[Card] card.save_failed", rawEvent.data?.id);
      }
      return res.status(200).json({ received: true });
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

    // NEW: the Rs. 50 card verification payment has no order session, so skip it.
    if (typeof event.reference === "string" && event.reference.startsWith("CARDSAVE_")) {
      return res.status(200).json({ received: true });
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
        const NON_RETRYABLE = [
          "Insufficient credit balance",
          "Cart snapshot is empty. Cannot create order.",
          "No schedule dates in checkout payload.",
        ];
        const isNonRetryable =
          NON_RETRYABLE.includes(placeErr.message) ||
          (placeErr.message || "").startsWith("Marketplace item with ID");

        if (isNonRetryable) {
          console.error(
            `[PG Webhook] MANUAL REVIEW / REFUND: paid but could not place order for ${event.reference}: ${placeErr.message}`
          );
          await PGdao.updatePendingCheckoutStatus(event.reference, "NEEDS_REVIEW");
          return res.status(200).json({ received: true, needsReview: true });
        }

        console.error(`[PG Webhook] Failed to finalise order for ${event.reference}:`, placeErr);
        try { await PGdao.updatePendingCheckoutStatus(event.reference, "PENDING"); } catch (e) { }
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
  console.log("[HIT]", require("os").hostname(), process.pid);
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
    console.log("[order-status] session:", reference, pendingSession?.status, pendingSession?.orderId);

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

    // ---- NEW: saved card payments (no checkout exists, so check the payment itself) ----
    const isSavedCardSession = String(pendingSession.sessionId || "").startsWith("PAY:");

    if (isSavedCardSession) {
      if (pendingSession.status === "PENDING") {
        const savedPaymentId = pendingSession.sessionId.slice(4);
        let claimedSaved = false;

        try {
          const payment = await lk.payments.retrieve(savedPaymentId);
          console.log("[order-status] saved card payment:", { reference, status: payment?.status });

          if (payment?.status === "succeeded") {
            claimedSaved = await PGdao.claimPendingCheckout(reference);
            if (claimedSaved) {
              const orderResult = await fulfillPaidCheckout(pendingSession, payment.id);
              await PGdao.updatePendingCheckoutStatus(reference, "COMPLETED", orderResult.orderId);

              return res.status(200).json({
                status: true,
                isCompleted: true,
                orderId: orderResult.orderId,
                invoiceNumber: orderResult.invoiceNumber,
                newBalance: orderResult.newBalance,
                amount: pendingSession.amount,
              });
            }
          } else if (payment?.status === "failed" || payment?.status === "canceled") {
            await PGdao.updatePendingCheckoutStatus(reference, "FAILED");
            return res.status(200).json({ status: true, isCompleted: false, sessionStatus: "FAILED" });
          }
        } catch (savedErr) {
          console.error("[order-status] saved card check failed:", savedErr);
          if (claimedSaved) {
            try { await PGdao.updatePendingCheckoutStatus(reference, "PENDING"); } catch (e) {}
          }
        }
      }

      // Never fall through to the checkout fallback below for a saved card session
      return res.status(200).json({
        status: true,
        isCompleted: false,
        sessionStatus: pendingSession.status,
      });
    }
    // ---- END NEW ----

    // Fallback sync: If still PENDING, verify directly with Payments.lk API
    const targetCheckoutId = req.query.checkout || req.query.checkoutId || pendingSession.sessionId;
    if (targetCheckoutId && pendingSession.status === "PENDING") {
      let claimed = false;

      try {
        const strategy = paymentGatewayFactory.getGateway("payments_lk");
        const checkoutData = await strategy.retrieveCheckout(targetCheckoutId);

        console.log("[order-status] checkout:", {
          reference,
          targetCheckoutId,
          status: checkoutData?.status,
          paymentStatus: checkoutData?.payment?.status,
        });

        if (
          checkoutData &&
          (checkoutData.status === "completed" || checkoutData.payment?.status === "succeeded")
        ) {
          console.log(
            `[Order Status Sync] Payment confirmed via Payments.lk API for reference ${reference}! Finalising order...`
          );

          claimed = await PGdao.claimPendingCheckout(reference);
          if (claimed) {
            const paymentId = checkoutData.payment?.id || `pay_${Date.now()}`;
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

// Reads the user's card from Payments.lk. Nothing is stored in our DB.
const findActiveCard = async (email) => {
  if (!email) return null;
  let found = null;
  for await (const card of lk.cards.listAll({ customerEmail: email })) {
    if (card.active && !card.retiredAt) found = card; // only one card is allowed at a time
  }
  return found;
};

const toCardResponse = (card, profile) => ({
  cardId: card.id,
  scheme: card.scheme,
  last4: card.last4,
  expiryMonth: card.expiry?.month ?? null,
  expiryYear: card.expiry?.year ?? null,
  holderName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim().toUpperCase(),
});


exports.getSavedCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const profile = (await PGdao.getUserProfile(userId)) || {};
    const card = await findActiveCard(profile.email);
    return res.status(200).json({
      status: true,
      data: card ? toCardResponse(card, profile) : null,
    });
  } catch (err) {
    console.error("[Card] get failed:", err);
    return res.status(500).json({ status: false, message: "Failed to load saved card" });
  }
};

exports.addCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const profile = await PGdao.getUserProfile(userId);
    if (!profile?.email) {
      return res.status(400).json({ status: false, message: "Please add an email to your profile first." });
    }

    if (await findActiveCard(profile.email)) {
      return res.status(409).json({ status: false, message: "Remove your current card before adding a new one." });
    }

    let returnPath = String(req.body?.returnPath || "/");
    if (!returnPath.startsWith("/") || returnPath.startsWith("//")) returnPath = "/";

    const origin =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")).origin : null) ||
      process.env.FRONTEND_URL;

    const reference = `CARDSAVE_${userId}_${Date.now()}`;
    const checkout = await lk.checkouts.create(
      {
        amountCents: CARD_VERIFY_AMOUNT_CENTS,
        description: "Card verification (save card)",
        reference,
        customer: {
          name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Customer",
          email: profile.email,
        },
        saveCard: true,
        successUrl: `${origin}${returnPath}?card=return`,
        cancelUrl: `${origin}${returnPath}`,
      },
      { idempotencyKey: reference }
    );

    return res.status(200).json({ status: true, data: { checkoutUrl: checkout.url } });
  } catch (err) {
    console.error("[Card] add failed:", err);
    return res.status(502).json({ status: false, message: "Could not start card setup. Please try again." });
  }
};

exports.removeCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const profile = (await PGdao.getUserProfile(userId)) || {};

    // The card id comes from the gateway lookup for THIS user's email,
    // never from the request, so nobody can delete someone else's card.
    const card = await findActiveCard(profile.email);
    if (!card) return res.status(404).json({ status: false, message: "No saved card found" });

    await lk.cards.delete(card.id);
    return res.status(200).json({ status: true });
  } catch (err) {
    console.error("[Card] remove failed:", err);
    return res.status(502).json({ status: false, message: "Could not remove card. Please try again." });
  }
};