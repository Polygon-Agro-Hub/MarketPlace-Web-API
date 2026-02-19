const express = require("express");
const CartEP = require("../end-point/Cart-ep");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/get-true-cart/:userId",
    // authMiddleware,
    CartEP.getTrueCart
);

router.get(
    '/cart/:userId', 
    CartEP.getCartDetails
);


router.post(
    "/create-order",
    authMiddleware,
    CartEP.createOrder
);

router.get(
    "/get-centers",
    CartEP.getPickupCenters
);

router.get(
    "/get-cities",
    CartEP.getNearestCities
);






module.exports = router;