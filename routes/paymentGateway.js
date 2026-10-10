const express = require("express");
const PGep = require("../end-point/PaymentGateway-ep");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
    "/save-card",
    authMiddleware,
    PGep.saveCard
);


module.exports = router; 
