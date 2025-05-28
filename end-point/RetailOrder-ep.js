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


exports.getCheckOutData = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        const results = await RetailOrderDao.getCheckOutDao();
        console.log("results found:", results);
        
        res.status(200).json({
            status: true,
            message: "results found.",
            results
        });
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};


exports.postCheckOutData = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log("Endpoint hit:", fullUrl);

    try {
        const { userId } = req.user;
        const formData = req.body;
        console.log("Received form data:", formData);

        let homedeliveryId = null;

        if (formData.deliveryMethod === 'home') {
            // Insert address and get homedeliveryId
            const homeDeliveryResult = await RetailOrderDao.insertHomeDeliveryDetails({
                buildingType: formData.buildingType,
                houseNo: formData.houseNumber,
                street: formData.streetName,
                city: formData.cityName,
                buildingName: formData.buildingName,
                flatNo: formData.flatNumber,
                floorNo: formData.floorNumber,
                buildingNo: formData.buildingNumber
            });
            homedeliveryId = homeDeliveryResult.insertId;
        }

        // Prepare retail order data
        const retailOrderData = {
            userId,
            fullName: formData.fullName,
            deliveryMethod: formData.deliveryMethod,
            centerId: formData.centerId || null,
            homedeliveryId,
            title: formData.title,
            phonecode1: formData.phoneCode1,
            phone1: formData.phone1,
            phonecode2: formData.phoneCode2,
            phone2: formData.phone2,
            scheduleType: formData.scheduleType,
            scheduleDate: formData.deliveryDate,
            scheduleTime: formData.timeSlot
        };
        console.log('this is retail', retailOrderData);

        await RetailOrderDao.insertRetailOrder(retailOrderData);

        res.status(200).json({
            status: true,
            message: "Form data updated successfully.",
        });
    } catch (err) {
        console.error("Error updating checkout form:", err);
        res.status(500).json({ error: "An error occurred while updating the form." });
    }
};

exports.getRetailOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    console.log("Received orderId:", orderId, "for userId:", userId); // Debug log



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


exports.getCheckOutData = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        const results = await RetailOrderDao.getCheckOutDao();
        console.log("results found:", results);
        
        res.status(200).json({
            status: true,
            message: "results found.",
            results
        });
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};


exports.postCheckOutData = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log("Endpoint hit:", fullUrl);

    try {
        const { userId } = req.user;
        const formData = req.body;
        console.log("Received form data:", formData);

        let homedeliveryId = null;

        if (formData.deliveryMethod === 'home') {
            // Insert address and get homedeliveryId
            const homeDeliveryResult = await RetailOrderDao.insertHomeDeliveryDetails({
                buildingType: formData.buildingType,
                houseNo: formData.houseNumber,
                street: formData.streetName,
                city: formData.cityName,
                buildingName: formData.buildingName,
                flatNo: formData.flatNumber,
                floorNo: formData.floorNumber,
                buildingNo: formData.buildingNumber
            });
            homedeliveryId = homeDeliveryResult.insertId;
        }

        // Prepare retail order data
        const retailOrderData = {
            userId,
            fullName: formData.fullName,
            deliveryMethod: formData.deliveryMethod,
            centerId: formData.centerId || null,
            homedeliveryId,
            title: formData.title,
            phonecode1: formData.phoneCode1,
            phone1: formData.phone1,
            phonecode2: formData.phoneCode2,
            phone2: formData.phone2,
            scheduleType: formData.scheduleType,
            scheduleDate: formData.deliveryDate,
            scheduleTime: formData.timeSlot
        };
        console.log('this is retail', retailOrderData);

        await RetailOrderDao.insertRetailOrder(retailOrderData);

        res.status(200).json({
            status: true,
            message: "Form data updated successfully.",
        });
    } catch (err) {
        console.error("Error updating checkout form:", err);
        res.status(500).json({ error: "An error occurred while updating the form." });
    }
};
