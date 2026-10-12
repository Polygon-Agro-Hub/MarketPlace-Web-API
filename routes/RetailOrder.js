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

router.get('/fetch-recent-order-address', authMiddleware, RetailOrderEp.getRecentOrderAddress);
router.get('/fetch-saved-addresses', authMiddleware, RetailOrderEp.getSavedAddresses);
router.get('/order/packages/:orderId',authMiddleware, RetailOrderEp.getOrderPackages);
router.get("/order/additional-items/:orderId",authMiddleware, RetailOrderEp. getOrderAdditionalItems);
router.get("/order/:orderId", authMiddleware, RetailOrderEp.getRetailOrderById);
router.get('/invoice/:orderId', authMiddleware, RetailOrderEp.getRetailOrderInvoiceByOrderId);

router.post(
    "/check-coupon-avalability",
    authMiddleware,
    RetailOrderEp.checkCouponAvalability
);

router.get("/order-confirmation/:processedOrderId", authMiddleware, RetailOrderEp.getOrderConfirmation);
router.get("/pending-confirmation", authMiddleware, RetailOrderEp.getPendingConfirmationOrder);
router.post(
    "/order-confirmation/:processedOrderId/confirm",
    (req, res, next) => {
        console.log("[RetailOrder Route] Confirmation request reached route:", {
            method: req.method,
            path: req.originalUrl,
            processedOrderId: req.params.processedOrderId,
        });
        next();
    },
    authMiddleware,
    RetailOrderEp.confirmOrderConfirmation
);

module.exports = router;
