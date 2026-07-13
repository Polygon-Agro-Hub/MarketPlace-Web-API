const CartDao = require("../dao/Cart-dao");
const ProductValidate = require("../validations/product-validation");
const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");
const { parse } = require("dotenv");

exports.getTrueCart = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const userId = req.params.userId;
    const cart = await CartDao.getTrueCart(userId);
    console.log("Cart retrieved:", userId);
    if (cart.length === 0) {
      return res.json({
        status: false,
        message: "No cart found",
        cart: [],
      });
    }
    res.status(200).json({
      status: true,
      message: "cart found.",
      cart: cart,
    });
  } catch (err) {
    console.error("Error during get product:", err);
    res.status(500).json({ error: "An error occurred during retrieval." });
  }
};

exports.getCartDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await CartDao.getCartByUserId(userId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const result = { cartId: cart.id };

    if (cart.isAditional) {
      result.additionalItems = await CartDao.getAdditionalItems(cart.id);
    }

    if (cart.isPackage) {
      const packageItems = await CartDao.getPackageItems(cart.id);
      result.packageItems = await Promise.all(packageItems.map(async (pkg) => {
        const baseDetails = await CartDao.getPackageDetails(pkg.packageId);

        if (pkg.isMin) {
          const minusItems = await CartDao.getPackageItemMin(pkg.id);
          baseDetails.forEach(item => {
            const minus = minusItems.find(m => m.packageItemId === item.id);
            if (minus) item.quantity -= minus.qty;
          });
        }

        if (pkg.isAdded) {
          const addedItems = await CartDao.getPackageItemAdded(pkg.id);
          addedItems.forEach(add => {
            const existing = baseDetails.find(i => i.id === add.packageItemId);
            if (existing) {
              existing.quantity += add.qty;
            } else {
              baseDetails.push({ ...add, id: add.packageItemId });
            }
          });
        }

        return {
          packageId: pkg.packageId,
          finalItems: baseDetails
        };
      }));
    }

    res.json(result);

  } catch (error) {
    console.error('DAO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrder = (req, res) => {
  return new Promise((resolve, reject) => {
    const {
      cartId,
      checkoutDetails,
      paymentMethod,
      discountAmount,
      grandTotal,
      orderApp = 'Marketplace',
      deliveryCharge = 0,
      creditPaid = 0,
      moneyPaid = 0,
      isFinalizeImdt = 0, 
    } = req.body;

    console.log('grandTotal:', grandTotal);
    console.log('creditPaid:', creditPaid, 'moneyPaid:', moneyPaid);
    console.log('checkoutDetails received:', checkoutDetails);

    const { userId } = req.user;
    console.log('userId for order:', userId);

    console.log("Order creation started", { cartId, userId });

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }

    if (!checkoutDetails) {
      return res.status(400).json({ error: "Checkout details are required" });
    }

    if (!grandTotal || grandTotal <= 0) {
      return res.status(400).json({ error: "Valid grand total is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    const parsedCreditPaid = parseFloat(creditPaid) || 0;
    const parsedMoneyPaid = parseFloat(moneyPaid) || 0;
    const combinedPaid = Math.round((parsedCreditPaid + parsedMoneyPaid) * 100) / 100;
    const roundedGrandTotal = Math.round(parseFloat(grandTotal) * 100) / 100;

    if (Math.abs(combinedPaid - roundedGrandTotal) > 0.01) {
      return res.status(400).json({
        error: "creditPaid and moneyPaid must add up to the grand total"
      });
    }

    const {
      buildingType, houseNo, street, cityName, buildingNo, buildingName,
      flatNumber, floorNumber, deliveryMethod, title, phoneCode1, phone1,
      phoneCode2, phone2, scheduleType, deliveryDate, timeSlot, fullName,
      centerId, couponValue = 0, isCoupon = false, geoLatitude = null,
      geoLongitude = null, companycenterId,
      couponType = null
    } = checkoutDetails;

    console.log('Coupon details extracted:', { couponValue, isCoupon });
    console.log('Geolocation details extracted:', { geoLatitude, geoLongitude });

    if (!deliveryMethod || !title || !phone1 || !fullName) {
      return res.status(400).json({
        error: "Missing required checkout details: deliveryMethod, title, phone1, or fullName"
      });
    }

    if (deliveryMethod === 'home') {
      if (buildingType === 'apartment') {
        if (!buildingNo || !buildingName || !flatNumber || !floorNumber) {
          return res.status(400).json({
            error: "For apartment delivery, buildingNo, buildingName, flatNumber, and floorNumber are required"
          });
        }
      } else if (buildingType === 'house') {
        if (!houseNo || !street) {
          return res.status(400).json({
            error: "For house delivery, houseNo and street are required"
          });
        }
      }

      if (!cityName) {
        return res.status(400).json({
          error: "City name is required for home delivery"
        });
      }
    } else if (deliveryMethod === 'pickup') {
      if (!centerId) {
        return res.status(400).json({
          error: "Center ID is required for pickup delivery"
        });
      }
    }

    let connection;
    let orderId;
    let processOrderResult;
    let addressId;
    let cartItems = [];
    let creditDeductionResult = { deducted: 0, newBalance: null };

    marketPlace.getConnection((err, conn) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return res.status(500).json({ error: "Database connection error" });
      }

      connection = conn;

      connection.beginTransaction((err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          connection.release();
          return res.status(500).json({ error: "Transaction start error" });
        }

        console.log('Transaction started');

        CartDao.validateCart(cartId, userId)
          .then((cartExists) => {
            if (!cartExists) {
              throw new Error("Cart not found or doesn't belong to user");
            }
            return CartDao.getCartItems(cartId);
          })
          .then((items) => {
            cartItems = items;
            console.log('Retrieved cart items from backend:', cartItems.length);

            if (!cartItems || cartItems.length === 0) {
              throw new Error("Cart is empty. Cannot create order.");
            }

            const orderData = {
              userId,
              orderApp,
              delivaryMethod: deliveryMethod,
              centerId: centerId || null,
              buildingType: deliveryMethod === 'home' ? buildingType : null,
              title, fullName,
              phonecode1: phoneCode1, phone1,
              phonecode2: phoneCode2, phone2,
              isCoupon: isCoupon ? 1 : 0,
              couponValue: parseFloat(couponValue) || 0,
              couponType: isCoupon ? couponType : null,
              total: parseFloat(grandTotal) + parseFloat(discountAmount) || 0,
              fullTotal: parseFloat(grandTotal) || 0,
              discount: parseFloat(discountAmount) || 0,
              sheduleType: scheduleType || null,
              sheduleDate: deliveryDate ? new Date(deliveryDate) : null,
              sheduleTime: timeSlot || null,
              isPackage: cartItems.some(item => item.itemType === 'package') ? 1 : 0,
              latitude: geoLatitude ? parseFloat(geoLatitude) : null,
              longitude: geoLongitude ? parseFloat(geoLongitude) : null,
              companycenterId: parseInt(companycenterId) || null,
              deliveryCharge: parseFloat(deliveryCharge) || 0,
              isFinalizeImdt: isFinalizeImdt ? 1 : 0 
            };

            console.log('Final orderData being sent:', orderData);
            return CartDao.createOrderWithTransaction(connection, orderData);
          })
          .then((newOrderId) => {
            if (!newOrderId) {
              throw new Error("Failed to create order");
            }
            orderId = newOrderId;
            console.log('Order created with ID:', orderId);

            if (deliveryMethod === 'home') {
              const addressData = {
                buildingNo, buildingName,
                unitNo: flatNumber, floorNo: floorNumber,
                houseNo, streetName: street, city: cityName
              };
              return CartDao.createOrderAddressWithTransaction(
                connection, orderId, addressData, buildingType
              );
            } else {
              console.log('Skipping address creation for pickup delivery');
              return Promise.resolve(null);
            }
          })
          .then((newAddressId) => {
            addressId = newAddressId;
            if (addressId) {
              console.log('Order address created with ID:', addressId);
            }

            const processOrderData = {
              orderId,
              paymentMethod,
              amount: parseFloat(grandTotal),
              creditPaid: parsedCreditPaid,
              moneyPaid: parsedMoneyPaid,
              status: 'Ordered',
              isPaid: 0
            };

            return CartDao.createProcessOrderWithTransaction(connection, processOrderData);
          })
          .then((processOrderRes) => {
            processOrderResult = processOrderRes;
            console.log('Process order created:', processOrderResult);

            return CartDao.saveOrderItemsWithTransaction(
              connection, orderId, processOrderResult.insertId, cartItems
            );
          })
          .then(() => {
            console.log('Order items saved successfully');

            // Deduct credit balance (if any) within the same transaction
            return CartDao.deductUserCreditWithTransaction(connection, userId, parsedCreditPaid);
          })
          .then((deductionResult) => {
            creditDeductionResult = deductionResult;
            console.log('Credit deduction result:', creditDeductionResult);

            connection.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                connection.rollback(() => {
                  console.log('Transaction rolled back due to commit error');
                  connection.release();
                  res.status(500).json({ error: "Transaction commit failed" });
                });
                return;
              }

              console.log('Transaction committed successfully');

              CartDao.clearCart(cartId)
                .then((cartCleared) => {
                  if (cartCleared) {
                    console.log(`Cart ${cartId} cleared successfully`);
                  } else {
                    console.warn(`Cart ${cartId} was not found or already cleared`);
                  }
                })
                .catch((cartError) => {
                  console.warn('Warning: Could not clear cart:', cartError);
                })
                .finally(() => {
                  connection.release();

                  console.log("Order creation success", {
                    orderId,
                    processOrderId: processOrderResult.insertId,
                    userId,
                    newCreditBalance: creditDeductionResult.newBalance
                  });

                  res.status(201).json({
                    status: true,
                    message: "Order created successfully",
                    orderId: orderId,
                    processOrderId: processOrderResult.insertId,
                    data: {
                      orderId,
                      processOrderId: processOrderResult.insertId,
                      invoiceNumber: processOrderResult.invNo,
                      qrCodeUrl: processOrderResult.qrCodeUrl,
                      total: grandTotal,
                      status: 'Ordered',
                      creditPaid: parsedCreditPaid,
                      moneyPaid: parsedMoneyPaid,
                      newCreditBalance: creditDeductionResult.newBalance
                    }
                  });
                  resolve();
                });
            });
          })
          .catch((error) => {
            console.error("Error in createOrder transaction:", error);

            connection.rollback(() => {
              console.log('Transaction rolled back due to error');
              connection.release();

              if (error.message === "Cart not found or doesn't belong to user") {
                res.status(404).json({ error: error.message });
              } else if (error.message === "Cart is empty. Cannot create order.") {
                res.status(400).json({ error: error.message });
              } else if (error.message === "Insufficient credit balance") {
                res.status(400).json({ error: error.message });
              } else {
                res.status(500).json({
                  error: "An unexpected error occurred while creating order",
                  message: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
              }
              reject(error);
            });
          });
      });
    });
  });
};

exports.getPickupCenters = async (req, res) => {
  try {
    const centers = await CartDao.getPickupCenters();

    if (!centers || centers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pickup centers found',
        data: []
      });
    }

    // Format data for frontend dropdown
    const formattedCenters = centers.map(center => ({
      id: center.centerId,
      name: center.centerName,
      longitude: parseFloat(center.longitude),
      latitude: parseFloat(center.latitude),
      city: center.city,
      district: center.district,
      label: `${center.centerName} - ${center.city}`, // For dropdown display
      value: center.centerId.toString() // For dropdown value
    }));

    res.status(200).json({
      success: true,
      message: 'Pickup centers retrieved successfully',
      data: formattedCenters,
      count: formattedCenters.length
    });

  } catch (error) {
    console.error('Error in getPickupCenters controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching pickup centers',
      error: error.message
    });
  }
};

exports.getNearestCities = async (req, res) => {
  try {
    const cities = await CartDao.getNearestCitiesDao();

    res.status(200).json({
      success: true,
      message: 'Cities retrieved successfully',
      count: cities.length,
      data: cities
    });

  } catch (error) {
    console.error('Error in getNearestCities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};