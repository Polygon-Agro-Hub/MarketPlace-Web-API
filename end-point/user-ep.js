const UserAddressDao = require('../dao/user-dao');
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