// postinvoice-endpoint.js
// NOTE: adjust the require path to match your project structure.
const PostInvoiceDao = require("../dao/postinvoice-dao");

exports.getPostInvoiceDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log("Request URL:", fullUrl);

  try {
    const { processOrderId } = req.params;

    if (!processOrderId) {
      return res.status(400).json({
        success: false,
        error: "Process order ID is required",
      });
    }

    const invoiceDetails =
      await PostInvoiceDao.getInvoiceDetailsDAO(processOrderId);

    if (!invoiceDetails) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    const [familyPackItems, additionalItems, billingDetails] =
      await Promise.all([
        PostInvoiceDao.getFamilyPackItemsDAO(processOrderId),
        PostInvoiceDao.getAdditionalItemsDAO(processOrderId),
        PostInvoiceDao.getBillingDetailsDAO(invoiceDetails.orderId),
      ]);

    let pickupCenterDetails = null;
    let deliveryChargeDetails = null;

    if (invoiceDetails.deliveryMethod === "Pickup" && invoiceDetails.centerId) {
      pickupCenterDetails = await PostInvoiceDao.getPickupCenterDetailsDAO(
        invoiceDetails.centerId,
      );
    } else if (
      invoiceDetails.deliveryMethod !== "Pickup" &&
      invoiceDetails.city
    ) {
      deliveryChargeDetails = await PostInvoiceDao.getDeliveryChargeByCityDAO(
        invoiceDetails.city,
      );

      // Nullify delivery charge if order has a Free Delivery coupon
      if (
        invoiceDetails.isCoupon === 1 &&
        invoiceDetails.couponType === "Free Delivery"
      ) {
        deliveryChargeDetails = null;
      }
    }

    // Package details are keyed by processOrderId, so fetch them once
    // (the original code made the same query once per pack item).
    const packageDetailResults =
      familyPackItems.length > 0
        ? await PostInvoiceDao.getPosPackageDetailsDAO(processOrderId)
        : [];

    // Map family pack items with their corresponding package details
    const familyPackItemsWithDetails = familyPackItems.map((item) => {
      const matchedPackage = packageDetailResults.find(
        (pkg) => pkg.packageName === item.name,
      );

      return {
        id: item.id,
        packageId: item.packageId,
        name: item.name,
        amount: item.amount,
        packingFee: item.packingFee,
        serviceFee: item.serviceFee,
        reviewValue: item.reviewValue,
        packageDetails: matchedPackage ? matchedPackage.items : [],
      };
    });

    const response = {
      invoice: invoiceDetails,
      items: {
        familyPacks: familyPackItemsWithDetails,
        additionalItems: additionalItems,
      },
      billing: billingDetails,
      pickupCenter: pickupCenterDetails,
      deliveryCharge: deliveryChargeDetails,
    };

    return res.status(200).json({
      success: true,
      message: "Invoice details retrieved successfully",
      data: response,
    });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    console.error("Error fetching invoice details:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while fetching invoice details",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};