const PGdao = require("../dao/PaymentGateway-dao");
const CartDao = require("../dao/Cart-dao");
const { getCouponDetailsDao } = require("../dao/RetailOrder-dao");
const { createOrderValidationSchema } = require("../validations/order-validation");
const paymentGatewayFactory = require("../services/payment/payment.factory");
const orderPlacementService = require("../services/payment/order-placement.service");

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

/**
 * 1. INITIATE PAYMENT CHECKOUT (Adapter & Factory Pattern)
 * Calculates authoritative price on server records and generates Payments.lk hosted session.
 */
exports.initiatePayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized. Please log in." });
    }

    // Validate the incoming checkout request payload
    const { error, value } = createOrderValidationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

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

    // 1. Verify Cart Ownership
    const cartExists = await CartDao.validateCart(cartId, userId);
    if (!cartExists) {
      return res.status(404).json({
        status: false,
        message: "Cart not found or does not belong to your account",
      });
    }

    // 2. Verify Item Availability
    const availability = await CartDao.checkCartItemsAvailability(cartId);
    if (availability.hasUnavailableItems) {
      return res.status(409).json({
        status: false,
        code: "ITEMS_UNAVAILABLE",
        message: "Some items in your cart are no longer available. Please update your cart.",
      });
    }

    // 3. Authoritative Pricing from Database Records
    const cartItems = await CartDao.getCartItems(cartId);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ status: false, message: "Your cart is empty." });
    }

    // 3. Pricing & Amount Payable Calculation
    const grandTotal = parseFloat(value.grandTotal) || 0;
    const creditPaid = value.isCreditApplied ? parseFloat(value.creditPaid) || 0 : 0;
    const moneyPaid = parseFloat(value.moneyPaid) > 0
      ? parseFloat(value.moneyPaid)
      : Math.max(0, parseFloat((grandTotal - creditPaid).toFixed(2)));

    if (moneyPaid <= 0) {
      return res.status(400).json({
        status: false,
        message: "Amount payable by card is zero. Please place order directly using Credit Balance.",
      });
    }

    // Update payload with verified calculations
    const finalPayload = {
      ...value,
      userId,
      cartId,
      grandTotal,
      discountAmount: parseFloat(value.discountAmount) || 0,
      deliveryCharge: parseFloat(value.deliveryCharge) || 0,
      creditPaid,
      moneyPaid,
      checkoutDetails: {
        ...checkoutDetails,
      },
      paymentMethod: "Card",
    };

    // 4. Customer Profile Info for Checkout Form Pre-fill
    const userProfile = (await PGdao.getUserProfile(userId)) || {};
    const customer = {
      firstName: checkoutDetails.fullName || userProfile.firstName || "Customer",
      lastName: userProfile.lastName || "",
      email: userProfile.email || "customer@govimart.lk",
      phone: checkoutDetails.phone1 || userProfile.phoneNumber || "",
    };

    // 5. Request Hosted Checkout from Active Payment Strategy (Adapter Pattern)
    const reference = `ORD_${userId}_${Date.now()}`;
    const clientOrigin =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")).origin : null) ||
      process.env.FRONTEND_URL ||
      "https://dev.polygon.lk";

    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    const session = await strategy.initiatePayment({
      amount: moneyPaid,
      reference,
      description: `GoviMart Order #${reference}`,
      customer,
      origin: clientOrigin,
    });

    // 6. Save Pending Session with sessionId
    await PGdao.savePendingCheckout(
      reference,
      userId,
      cartId,
      finalPayload,
      moneyPaid,
      session.sessionId
    );

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
 * 2. WEBHOOK HANDLER (Signed Webhook Verification & Safe Order Placement)
 * Endpoint: POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers["payments-signature"];
    const rawBody = req.rawBody || req.body;

    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    const verification = strategy.verifyAndConstructWebhook(signatureHeader, rawBody);

    if (!verification.isValid) {
      console.error("[PG Webhook] Invalid signature:", verification.error);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = strategy.parseWebhookEvent(verification.event);
    console.log(`[PG Webhook] Verified event: ${event.eventType} for reference: ${event.reference}`);

    // Deduplication / Idempotency Check
    const eventId = event.paymentId || `${event.eventType}_${event.reference}`;
    if (markPaymentProcessed(eventId)) {
      console.log(`[PG Webhook] Duplicate webhook skipped for event ID: ${eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (event.isPaid) {
      console.log(`[PG Webhook] Payment succeeded for reference ${event.reference}! Placing order...`);
      const pendingSession = await PGdao.getPendingCheckout(event.reference);

      if (!pendingSession) {
        console.warn(`[PG Webhook] No pending checkout session found for reference ${event.reference}`);
        return res.status(200).json({ received: true, note: "Session reference not found" });
      }

      if (pendingSession.status === "COMPLETED") {
        console.log(`[PG Webhook] Order already fulfilled for reference ${event.reference}`);
        return res.status(200).json({ received: true, alreadyFulfilled: true });
      }

      // Execute order creation transaction
      try {
        const orderResult = await orderPlacementService.placeOrderFromCheckout({
          ...pendingSession.payload,
          transactionId: event.paymentId,
          isPaid: 1,
          status: "Ordered",
        });

        await PGdao.updatePendingCheckoutStatus(
          event.reference,
          "COMPLETED",
          orderResult.orderId
        );

        console.log(`[PG Webhook] Order #${orderResult.orderId} successfully placed via webhook!`);
      } catch (placeErr) {
        console.error(`[PG Webhook] Failed to place order for reference ${event.reference}:`, placeErr);
        return res.status(500).json({ error: "Failed to place order in database" });
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
    return res.status(500).json({ error: "Server error processing webhook" });
  }
};

/**
 * 3. ORDER STATUS INQUIRY
 * Allows frontend return URL to check if order has been created and marked paid by webhook.
 * Endpoint: GET /api/payment/order-status/:reference
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ status: false, message: "Reference is required" });
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
      try {
        const strategy = paymentGatewayFactory.getGateway("payments_lk");
        const checkoutData = await strategy.retrieveCheckout(targetCheckoutId);

        if (
          checkoutData &&
          (checkoutData.status === "completed" || checkoutData.payment?.status === "succeeded")
        ) {
          console.log(
            `[Order Status Sync] Payment confirmed via Payments.lk API for reference ${reference}! Placing order...`
          );
          const paymentId = checkoutData.payment?.id || `pay_${Date.now()}`;

          // Execute order creation transaction
          const orderResult = await orderPlacementService.placeOrderFromCheckout({
            ...pendingSession.payload,
            transactionId: paymentId,
            isPaid: 1,
            status: "Ordered",
          });

          await PGdao.updatePendingCheckoutStatus(
            reference,
            "COMPLETED",
            orderResult.orderId
          );

          console.log(`[Order Status Sync] Order #${orderResult.orderId} successfully placed!`);

          return res.status(200).json({
            status: true,
            isCompleted: true,
            orderId: orderResult.orderId,
            invoiceNumber: orderResult.invoiceNumber,
            amount: pendingSession.amount,
          });
        }
      } catch (syncErr) {
        console.warn("[Order Status Sync] Could not sync with Payments.lk API:", syncErr.message);
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