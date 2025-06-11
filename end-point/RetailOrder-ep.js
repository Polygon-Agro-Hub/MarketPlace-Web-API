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
    console.log("Order history fetched:", orderHistory); // Debug log
    

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
      const rawData = await RetailOrderDao.getCheckOutDao();

      if (!rawData) {
          return res.status(404).json({
              status: false,
              message: "No data found."
          });
      }

      let formattedData = {
          userId: rawData.userId,
          orderApp: rawData.orderApp,
          // buildingType: rawData.buildingType,
          buildingType: rawData.buildingType,
          title: rawData.title,
          fullName: rawData.fullName,
          phone1: rawData.phone1,
          phone2: rawData.phone2,
          phoneCode1: rawData.phonecode1,
          phoneCode2: rawData.phonecode2,
          createdAt: rawData.createdAt
      };

      if (rawData.buildingType === 'House') {
          formattedData = {
              ...formattedData,
              houseNo: rawData.houseNo,
              street: rawData.streetName,
              cityName: rawData.city
              // houseNo: '26' ,
              // streetName: '12',
              // city: '13'
          };
      } else if (rawData.buildingType === 'Apartment') {
          formattedData = {
              ...formattedData,
              buildingName: rawData.buildingName,
              buildingNo: rawData.buildingNo,
              unitNo: rawData.unitNo,
              floorNo: rawData.floorNo,
              houseNo: rawData.houseNo,
              street: rawData.streetName,
              cityName: rawData.city
              // buildingName: 'sfsdf',
              // buildingNo: 'sd23',
              // unitNo: '2',
              // floorNo: '3',
              // houseNo: 'dfsdf',
              // streetName: 'dsd',
              // city: 'sds'
          };
      }

      // console.log(formattedData);

      res.status(200).json({
          status: true,
          message: "Result found.",
          result: formattedData
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