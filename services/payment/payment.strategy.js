/**
 * Base Payment Strategy (Contract for payment gateways)
 */
class PaymentStrategy {
  /**
   * Gateway name identifier
   */
  get gatewayName() {
    throw new Error("Property 'gatewayName' must be implemented.");
  }

  /**
   * Initiates a payment session with the gateway.
   * @param {Object} params
   * @returns {Promise<Object>} Unified session details including checkoutUrl
   */
  async initiatePayment(params) {
    throw new Error("Method 'initiatePayment()' must be implemented.");
  }

  /**
   * Verifies the incoming webhook payload / signature.
   * @param {Object} headers - Request headers
   * @param {Buffer|string} rawBody - Raw unparsed body buffer
   * @returns {boolean}
   */
  verifyWebhook(headers, rawBody) {
    throw new Error("Method 'verifyWebhook()' must be implemented.");
  }

  /**
   * Parses and normalizes webhook event payload into unified structure
   * @param {Object} payload
   * @returns {Object}
   */
  parseWebhookEvent(payload) {
    throw new Error("Method 'parseWebhookEvent()' must be implemented.");
  }
}

module.exports = PaymentStrategy;
