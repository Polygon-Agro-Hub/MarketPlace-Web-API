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
router.put(
    "/post-check-out-data",
    authMiddleware,
    RetailOrderEp.postCheckOutData
);

router.get(
    "/fetch-check-out-data",
    authMiddleware,
    RetailOrderEp.getLastOrderAddress
);
router.get('/order/packages/:orderId',authMiddleware, RetailOrderEp.getOrderPackages);
router.get("/order/additional-items/:orderId",authMiddleware, RetailOrderEp. getOrderAdditionalItems);
// router.get("/order-history", authMiddleware, RetailOrderEp.getRetailOrderHistory);
router.get("/order/:orderId", authMiddleware, RetailOrderEp.getRetailOrderById);
router.get('/invoice/:orderId', authMiddleware, RetailOrderEp.getRetailOrderInvoiceByOrderId);

router.post(
    "/check-coupon-avalability",
    authMiddleware,
    RetailOrderEp.checkCouponAvalability
);

module.exports = router;

