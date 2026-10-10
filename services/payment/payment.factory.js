const PaymentsLkStrategy = require("./payments-lk.strategy");

/**
 * Payment Gateway Factory
 * Instantiates and returns the configured payment gateway strategy.
 */
class PaymentGatewayFactory {
  constructor() {
    this.strategies = new Map();
    // Register default Payments.lk strategy
    this.strategies.set("payments_lk", new PaymentsLkStrategy());
  }

  /**
   * Returns gateway strategy by name or default configured gateway
   * @param {string} [gatewayName]
   * @returns {PaymentStrategy}
   */
  getGateway(gatewayName) {
    const selected = (
      gatewayName ||
      process.env.ACTIVE_PAYMENT_GATEWAY ||
      "payments_lk"
    ).toLowerCase();

    if (this.strategies.has(selected)) {
      return this.strategies.get(selected);
    }

    // Default fallback to payments_lk
    return this.strategies.get("payments_lk");
  }

  /**
   * Registers a new custom strategy at runtime
   * @param {string} name
   * @param {PaymentStrategy} strategy
   */
  registerGateway(name, strategy) {
    this.strategies.set(name.toLowerCase(), strategy);
  }

  /**
   * Returns list of supported gateways
   * @returns {string[]}
   */
  getSupportedGateways() {
    return Array.from(this.strategies.keys());
  }

  getActiveGatewayName() {
    return (
      process.env.ACTIVE_PAYMENT_GATEWAY || "payments_lk"
    ).toLowerCase();
  }
}

// Export singleton instance
module.exports = new PaymentGatewayFactory();
