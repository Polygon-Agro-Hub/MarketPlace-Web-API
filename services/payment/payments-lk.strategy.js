const { PaymentsLk } = require("@payments-lk/node");
const PaymentStrategy = require("./payment.strategy");

/**
 * Payments.lk Gateway Strategy
 * Communicates with Payments.lk SDK for hosted checkouts and signed webhooks.
 */
class PaymentsLkStrategy extends PaymentStrategy {
  constructor() {
    super();
    this.secretKey =
      process.env.PAYMENTS_LK_SECRET_KEY || "sk_test_demo";
    this.webhookSecret =
      process.env.PAYMENTS_LK_WEBHOOK_SECRET || "";
    this.frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:3000"
    ).replace(/\/$/, "");

    this.lk = new PaymentsLk(this.secretKey);
  }

  get gatewayName() {
    return "payments_lk";
  }

  /**
   * Creates a hosted checkout session on Payments.lk
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async initiatePayment(params) {
    const {
      amount,
      reference,
      description,
      customer = {},
      successUrl: customSuccessUrl,
      cancelUrl: customCancelUrl,
    } = params;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error("A valid positive payment amount is required");
    }

    // Convert standard LKR into whole cents (e.g., LKR 1,450.00 -> 145000)
    const amountCents = Math.round(Number(amount) * 100);

    const baseUrl = (
      params.origin ||
      this.frontendUrl ||
      "https://dev.polygon.lk"
    ).replace(/\/$/, "");

    const successUrl =
      customSuccessUrl ||
      `${baseUrl}/payment/return?reference=${encodeURIComponent(
        reference
      )}&status=success`;
    const cancelUrl =
      customCancelUrl ||
      `${baseUrl}/payment/return?reference=${encodeURIComponent(
        reference
      )}&status=cancel`;

    const customerPayload = {
      name:
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "GoviMart Customer",
      email: customer.email || "customer@govimart.lk",
    };

    // Format phone to valid Sri Lankan mobile number (e.g. 07XXXXXXXX) only if provided
    if (customer.phone) {
      let rawDigits = String(customer.phone).replace(/\D/g, "");
      if (rawDigits.startsWith("94") && rawDigits.length === 11) {
        rawDigits = rawDigits.slice(2);
      }
      if (rawDigits.startsWith("0") && rawDigits.length === 10) {
        rawDigits = rawDigits.slice(1);
      }
      if (rawDigits.length === 9) {
        customerPayload.phone = `0${rawDigits}`;
      }
    }

    const idempotencyKey = `chk-${reference}-${Date.now()}`;

    const checkout = await this.lk.checkouts.create(
      {
        amountCents,
        description: description || `GoviMart Order #${reference}`,
        reference: String(reference),
        successUrl,
        cancelUrl,
        customer: customerPayload,
      },
      { idempotencyKey }
    );

    return {
      gateway: this.gatewayName,
      checkoutUrl: checkout.url,
      sessionId: checkout.id,
      reference: String(reference),
      amount: Number(amount),
      currency: "LKR",
      successUrl,
      cancelUrl,
      rawData: checkout,
    };
  }

  /**
   * Directly retrieves a checkout session from Payments.lk API
   * @param {string} checkoutId
   * @returns {Promise<Object>}
   */
  async retrieveCheckout(checkoutId) {
    if (!checkoutId) return null;
    return await this.lk.checkouts.retrieve(checkoutId);
  }

  /**
   * Verifies incoming webhook using Payments.lk SDK constructEvent
   * @param {string|Object} signatureHeader - payments-signature header
   * @param {Buffer|string} rawBody - Raw body buffer/string
   * @returns {{ isValid: boolean, event?: Object, error?: string }}
   */
  verifyAndConstructWebhook(signatureHeader, rawBody) {
    if (!signatureHeader) {
      return { isValid: false, error: "Missing Payments-Signature header" };
    }

    if (!this.webhookSecret) {
      console.warn(
        "[Payments.lk] PAYMENTS_LK_WEBHOOK_SECRET is not configured in .env. Skipping cryptographic validation in dev mode."
      );
      // If no secret configured yet in dev, attempt JSON parse if possible
      try {
        const parsed = Buffer.isBuffer(rawBody)
          ? JSON.parse(rawBody.toString("utf8"))
          : typeof rawBody === "string"
          ? JSON.parse(rawBody)
          : rawBody;
        return { isValid: true, event: parsed };
      } catch (e) {
        return { isValid: false, error: e.message };
      }
    }

    try {
      const event = this.lk.webhooks.constructEvent(
        rawBody,
        signatureHeader,
        this.webhookSecret
      );
      return { isValid: true, event };
    } catch (err) {
      console.error("[Payments.lk Webhook Verification Error]:", err.message);
      return { isValid: false, error: err.message };
    }
  }

  /**
   * Normalizes Payments.lk event into standardized format
   * @param {Object} event
   * @returns {Object}
   */
  parseWebhookEvent(event) {
    const eventType = event?.type || "unknown";
    const data = event?.data || {};

    const amountInLkr =
      typeof data.amountCents === "number" ? data.amountCents / 100 : undefined;

    const reference = data.reference || data.orderId || "";

    return {
      eventType,
      isPaid: eventType === "payment.succeeded",
      reference: String(reference),
      paymentId: data.id || event.id,
      amount: amountInLkr,
      customer: data.customer,
      rawEvent: event,
    };
  }
}

module.exports = PaymentsLkStrategy;
