const UserAddressDao = require('../dao/user-dao');
const PaymentGatewayDao = require('../dao/Paymentgateway-dao');
const paymentGatewayFactory = require('../services/payment/payment.factory');
const { validateBillingDetails } = require('../validations/user-validation');

/**
 * Get billing details for a user
 */
exports.getBillingDetails = async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.userId;
    
    // Get billing details from DAO
    const billingDetails = await UserAddressDao.getBillingDetailsByUserIdDao(userId);
    
    if (!billingDetails || billingDetails.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No billing details found for this user",
        billingDetails: []
      });
    }
    
    res.status(200).json({
      status: true,
      message: "Billing details retrieved successfully",
      billingDetails: billingDetails
    });
  } catch (err) {
    console.error("Error retrieving billing details:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while retrieving billing details"
    });
  }
};

/**
 * Update billing details for a user
 */
exports.updateBillingDetails = async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.userId;
    console.log("User ID:", userId);
    
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User ID not found in request"
      });
    }
    
    // Validate request body
    const { error, value } = validateBillingDetails(req.body);
    
    if (error) {
      return res.status(400).json({
        status: false,
        message: "Invalid request data",
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Update billing details
    const result = await UserAddressDao.updateBillingDetailsByUserIdDao(userId, value);
    
    if (result.created) {
      res.status(201).json({
        status: true,
        message: "Billing details created successfully",
        result: {
          id: result.id,
          created: true
        }
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Billing details updated successfully",
        result: {
          id: result.id,
          updated: true
        }
      });
    }
  } catch (err) {
    console.error("Error updating billing details:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating billing details"
    });
  }
};

exports.creditBalancePayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { amount } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User ID not found in request",
      });
    }

    const parsedAmount = Math.abs(Number(amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid amount provided",
      });
    }

    const userProfile = await PaymentGatewayDao.getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const reference = `CREDIT_${userId}_${Math.round(parsedAmount * 100)}_${Date.now()}`;

    const clientOrigin =
      req.get("origin") ||
      process.env.FRONTEND_URL ||
      "https://dev.polygon.lk";

    const returnBase = `${clientOrigin}/clear-balance-page/payment/return`;

    const successUrl = `${returnBase}?reference=${encodeURIComponent(reference)}&status=success`;
    const cancelUrl = `${returnBase}?reference=${encodeURIComponent(reference)}&status=cancel`;

    const strategy = paymentGatewayFactory.getGateway("payments_lk");
    const session = await strategy.initiatePayment({
      amount: parsedAmount,
      reference,
      description: `Credit balance top-up #${reference}`,
      origin: clientOrigin,
      returnUrl: successUrl, 
      successUrl,
      cancelUrl,
      customer: {
        firstName: userProfile.firstName || "Customer",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "customer@govimart.lk",
        phone: userProfile.phoneNumber || "",
      },
    });

    return res.status(201).json({
      status: true,
      message: "Credit balance checkout created successfully",
      reference,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      amount: parsedAmount,
      currency: session.currency || "LKR",
    });
  } catch (err) {
    console.error("Error processing credit balance payment:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing credit balance payment",
    });
  }
};
