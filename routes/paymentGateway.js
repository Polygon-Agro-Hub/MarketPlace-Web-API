const express = require("express");
const PGep = require("../end-point/PaymentGateway-ep");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. Create checkout session (Protected - Requires Auth)
router.post(
  "/initiate",
  authMiddleware,
  PGep.initiatePayment
);

// 2. Payments.lk signed webhook handler (Public - Verified via Payments-Signature)
router.post(
  "/webhook",
  PGep.handleWebhook
);

// 3. Status check for redirect return page (Protected - Requires Auth)
router.get(
  "/order-status/:reference",
  authMiddleware,
  PGep.getOrderStatus
);

module.exports = router;
