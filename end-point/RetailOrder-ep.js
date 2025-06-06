const RetailOrderDao = require("../dao/RetailOrder-dao");
const ValidateSchema = require("../validations/Auth-validation");



exports.getRetailCart = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        const { userId } = req.user;
        const product = await RetailOrderDao.getRetailCartDao(userId);

        console.log("Product found:", product);
        
        res.status(200).json({
            status: true,
            message: "Product count found.",
            product
            // productCount: productCount
        });
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};

// exports.getRetailOrderHistory = async (req, res) => {
//   try {
//     const { userId } = req.user;

//     const orderHistory = await RetailOrderDao.getRetailOrderHistoryDao(userId);

//     res.status(200).json({
//       status: true,
//       message: "Order history fetched successfully.",
//       orderHistory
//     });
//   } catch (err) {
//     console.error("Error fetching order history:", err);
//     res.status(500).json({
//       status: false,
//       message: "Failed to fetch order history.",
//     });
//   }
// };

// exports.getFilteredRetailOrderHistory = async (req, res) => {
//   try {
//     const { userId } = req.user;

//     const filteredOrderHistory = await RetailOrderDao.getFilteredRetailOrderHistoryDao(userId);

//     res.status(200).json({
//       status: true,
//       message: "Filtered order history fetched successfully.",
//       filteredOrderHistory,
//     });
//   } catch (err) {
//     console.error("Error fetching filtered order history:", err);
//     res.status(500).json({
//       status: false,
//       message: "Failed to fetch filtered order history.",
//     });
//   }
// };



// exports.getRetailOrderHistory = async (req, res) => {
//   try {
//     const { userId } = req.user;

//     const orderHistory = await RetailOrderDao.getRetailOrderHistoryDao(userId);

//     return res.status(200).json({
//       status: true,
//       message: "Order history fetched successfully.",
//       data: orderHistory,
//     });
//   } catch (err) {
//     console.error("Error fetching order history:", err);
//     return res.status(500).json({
//       status: false,
//       message: "Failed to fetch order history.",
//     });
//   }
// };

exports.getRetailOrderHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log("Fetching order history for userId:", userId); // Debug log

    const orderHistory = await RetailOrderDao.getRetailOrderHistoryDao(userId);

    res.status(200).json({
      status: true,
      message: "Order history fetched successfully.",
      orderHistory,
    });
  } catch (err) {
    console.error("Error fetching order history:", err);
    res.status(500).json({
      status: false,
      message: "Failed to fetch order history.",
    });
  }
};

exports.getRetailOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    console.log("Received orderId:", orderId, "for userId:", userId); // Debug log

    const order = await RetailOrderDao.getRetailOrderByIdDao(orderId, userId);

    res.status(200).json({
      status: true,
      message: "Order fetched successfully.",
      order,
    });
  } catch (err) {
    console.error("Error fetching order for orderId:", req.params.orderId, err);
    res.status(500).json({
      status: false,
      message: "Failed to fetch order.",
    });
  }
};

exports.getOrderPackages = async (req, res) => {
    try {
    const { orderId } = req.params;

    const packages = await RetailOrderDao.getOrderPackageDetailsDao(orderId);

    res.json({
      status: true,
      message: "Packages fetched successfully",
      data: packages
    });
  } catch (error) {
    console.error('Error in getPackagesByOrderId:', error);
    res.status(500).json({
      status: false,
      message: error?.toString() || 'Unknown server error'
    });
  }
};

exports.getRetailOrderInvoiceById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    console.log("Fetching invoice for orderId:", orderId, "for userId:", userId);

    const invoice = await RetailOrderDao.getRetailOrderInvoiceByIdDao(orderId, userId);

    if (!invoice) {
      return res.status(404).json({
        status: false,
        message: "Invoice not found for this order.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Invoice fetched successfully.",
      invoice,
    });
  } catch (err) {
    console.error("Error fetching invoice for orderId:", req.params.orderId, err);
    res.status(500).json({
      status: false,
      message: "Failed to fetch invoice.",
    });
  }
};

exports.getOrderAdditionalItems = async (req, res) => {
  try {
    const { orderId } = req.params;

    const additionalItems = await RetailOrderDao.getOrderAdditionalItemsDao(orderId);

    res.json({
      status: true,
      message: "Additional items fetched successfully",
      data: additionalItems
    });
  } catch (error) {
    console.error('Error in getOrderAdditionalItems:', error);
    res.status(500).json({
      status: false,
      message: error?.toString() || 'Unknown server error'
    });
  }
};