const express = require("express");
const CartEP = require("../end-point/Cart-ep");
const authMiddleware = require("../middlewares/authMiddleware");
const sheduleUtill = require("../utils/sheduleGenarator");

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

router.get(
  "/cash-payment-limit",
  authMiddleware,
  CartEP.getCashPaymentLimit
);

router.get(
  "/test-sheduler", (req, res) => {
    const data = sheduleUtill.generateScheduleDates({
      scheduleType: "Twice a week",
      sheduleDate: "2026-10-14T00:00:00.000Z", 
      selectedDays:'["We","Fr"]',
      validPeriod: "04"
  })

  res.json({
    success: true,
    message: "Schedule dates generated successfully",
    data: data
  })
}
  
);


module.exports = router;