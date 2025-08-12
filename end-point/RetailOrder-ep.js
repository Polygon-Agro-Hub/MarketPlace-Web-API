const RetailOrderDao = require("../dao/RetailOrder-dao");
const athDao = require("../dao/Auth-dao");
const ValidateSchema = require("../validations/order-validation");



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


exports.getLastOrderAddress = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: 'User not authenticated'
      });
    }

    // Fetch last order address
    const lastAddress = await RetailOrderDao.getLastAddress(userId);

    if (!lastAddress) {
      return res.status(200).json({
        status: false,
        message: 'No previous order address found',
        hasAddress: false
      });
    }

    // Check if address data exists (not just user data)
    const hasAddressData = lastAddress.buildingType && (
      (lastAddress.buildingType === 'Apartment' && (lastAddress.buildingNo || lastAddress.buildingName)) ||
      (lastAddress.buildingType === 'House' && lastAddress.houseNo) ||
      lastAddress.streetName || 
      lastAddress.city
    );

    if (!hasAddressData) {
      return res.status(200).json({
        status: false,
        message: 'No previous order address found',
        hasAddress: false
      });
    }

    console.log('address', lastAddress);

    return res.status(200).json({
      status: true,
      message: 'Last order address retrieved successfully',
      hasAddress: true,
      result: lastAddress
    });

  } catch (error) {
    console.error('Error fetching last order address:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
      hasAddress: false,
      error: error.message
    });
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

    console.log('invoice details --',invoice);

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


exports.checkCouponAvalability = async (req, res) => {
  try {
    const { userId } = req.user;
    // userId = 55;
    // coupon = "VVVV";
    const { coupon } = await ValidateSchema.couponValidationSchema.validateAsync(req.body);

    console.log('coupon detailsss', req.body);

    const currentDate = new Date();
    let discount = 0;

    // Helper function to format numbers with thousand separators
    const formatPrice = (price) => {
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    };

    const couponData = await RetailOrderDao.getCouponDetailsDao(coupon);
    console.log("Coupon data:", couponData);
    const startDate = new Date(couponData.startDate);
    const endDate = new Date(couponData.endDate);
    
    if (!couponData || couponData === null) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found.",
        discount
      });
    }

    if (couponData.status === 'Disabled') {
      return res.status(404).json({
        status: false,
        message: "Coupon doesn't available now.",
        discount
      });
    }

    console.log(currentDate, startDate);

    if (currentDate < startDate) {
      return res.status(400).json({
        status: false,
        message: `This coupon will be valid from ${startDate.toLocaleDateString()}.`,
        discount
      });
    }

    if (currentDate > endDate) {
      return res.status(400).json({
        status: false,
        message: `This coupon has expired on ${endDate.toLocaleDateString()}.`,
        discount
      });
    }

    const package = await athDao.getCartPackageInfoDao(userId);
    const items = await athDao.getCartAdditionalInfoDao(userId);
    const cartObj = {
      price: parseFloat(package.price) + parseFloat(items.price),
      count: parseFloat(package.count) + parseFloat(items.count)
    };
    console.log(cartObj);

    if (couponData.type === 'Percentage') {
      if (couponData.checkLimit === 1) {
        if (cartObj.price >= couponData.priceLimit) {
          discount = (cartObj.price * couponData.percentage / 100);
        } else {
          return res.status(400).json({
            status: false,
            message: `This coupon is valid for minimum purchase of ${formatPrice(couponData.priceLimit)}`,
            discount
          });
        }
      } else {
        discount = (cartObj.price * couponData.percentage / 100);
      }
    } else if (couponData.type === 'Fixed Amount') {
      if (couponData.checkLimit === 1) {
        if (cartObj.price >= couponData.priceLimit) {
          discount = couponData.fixDiscount;
        } else {
          return res.status(400).json({
            status: false,
            message: `This coupon is valid for minimum purchase of ${formatPrice(couponData.priceLimit)}`,
            discount
          });
        }
      } else {
        discount = couponData.fixDiscount;
      }
    } else if (couponData.type === 'Free Delivary') {
      if (couponData.checkLimit === 1) {
        if (cartObj.price >= couponData.priceLimit) {
          discount = 0;
          // get requirement and it should be defined in the coupon table
        } else {
          return res.status(400).json({
            status: false,
            message: `This coupon is valid for minimum purchase of ${formatPrice(couponData.priceLimit)}`,
            discount
          });
        }
      } else {
        discount = 0;
        // get requirement and it should be defined in the coupon table
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Invalid coupon type.",
        discount
      });
    }

    res.status(200).json({
      status: true,
      message: "Coupon is valid.",
      discount: formatPrice(discount),
      type: couponData.type 
    });
  } catch (err) {
    console.error("Error fetching invoice for orderId:", err);
    res.status(500).json({
      status: false,
      message: "Invalid coupon code",
    });
  }
};