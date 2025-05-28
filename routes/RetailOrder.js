const express = require("express");
const RetailOrderEp = require("../end-point/RetailOrder-ep");
const authMiddleware = require("../middlewares/authMiddleware");


const router = express.Router();

router.get(
    "/get-retail-cart",
    authMiddleware,
    RetailOrderEp.getRetailCart
);

router.get("/order-history", authMiddleware, RetailOrderEp.getRetailOrderHistory);
router.get("/order/:orderId", authMiddleware, RetailOrderEp.getRetailOrderById);
router.get('/invoice/:orderId',authMiddleware, RetailOrderEp.getRetailOrderInvoiceById);



module.exports = router;

