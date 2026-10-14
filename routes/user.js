const express = require("express");
const userEp = require("../end-point/user-ep");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.get("/billing-details",authMiddleware, userEp.getBillingDetails);
router.put("/billing-details",authMiddleware, userEp.updateBillingDetails);
router.post("/credit-balance-payment",authMiddleware, userEp.creditBalancePayment);

module.exports = router;

