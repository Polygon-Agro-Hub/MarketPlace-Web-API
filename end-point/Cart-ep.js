const CartDao = require("../dao/Cart-dao");
const ProductValidate = require("../validations/product-validation");
const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");

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




// exports.createOrder = async (req, res) => {
//   try {
//     const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//     console.log('Full URL:', fullUrl);

//     const { items, cartId, checkoutDetails, paymentMethod, discountAmount, grandTotal } = req.body;
//     console.log("Order creation started", { itemsCount: items?.length, cartId });

//     // Input validation
//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: "Items must be a non-empty array" });
//     }

//     if (!cartId) {
//       return res.status(400).json({ error: "Cart ID is required" });
//     }

//     if (!checkoutDetails) {
//       return res.status(400).json({ error: "Checkout details are required" });
//     }

//     if (!grandTotal || grandTotal <= 0) {
//       return res.status(400).json({ error: "Valid grand total is required" });
//     }

//     const {
//       buildingType,
//       houseNo,
//       street,
//       cityName,
//       buildingNo,
//       buildingName,
//       flatNumber,
//       floorNumber,
//       deliveryMethod,
//       title,
//       phoneCode1,
//       phone1,
//       phoneCode2,
//       phone2,
//       scheduleType,
//       deliveryDate,
//       timeSlot,
//       fullName
//     } = checkoutDetails;

//     // Validate required checkout fields
//     if (!deliveryMethod || !title || !phone1 || !fullName) {
//       return res.status(400).json({ 
//         error: "Missing required checkout details: deliveryMethod, title, phone1, or fullName" 
//       });
//     }

//     // Step 1: Create delivery address with error handling
//     let homedeliveryId;
//     try {
//       homedeliveryId = await CartDao.createDeliveryAddress(
//         buildingType,
//         houseNo,
//         street,
//         cityName,
//         buildingNo,
//         buildingName,
//         flatNumber,
//         floorNumber
//       );

//       if (!homedeliveryId) {
//         throw new Error("Failed to create delivery address");
//       }
//     } catch (error) {
//       console.error("Error creating delivery address:", error);
//       return res.status(500).json({ error: "Failed to create delivery address" });
//     }

//     // Step 2: Get cart details with error handling
//     let cartDetails;
//     try {
//       cartDetails = await CartDao.checkCartDetails(cartId);

//       if (!cartDetails || cartDetails.length === 0) {
//         return res.status(404).json({ error: "Cart not found" });
//       }
//     } catch (error) {
//       console.error("Error checking cart details:", error);
//       return res.status(500).json({ error: "Failed to retrieve cart details" });
//     }

//     const userId = cartDetails[0]?.userId;
//     if (!userId) {
//       return res.status(400).json({ error: "Invalid cart or missing user" });
//     }

//     // Step 3: Create order with error handling
//     let orderId;
//     try {
//       orderId = await CartDao.createOrder(
//         userId,
//         deliveryMethod,
//         homedeliveryId,
//         title,
//         phoneCode1,
//         phone1,
//         phoneCode2,
//         phone2,
//         scheduleType,
//         deliveryDate,
//         timeSlot,
//         fullName,
//         grandTotal,
//         discountAmount || 0
//       );

//       if (!orderId) {
//         throw new Error("Failed to create order");
//       }
//     } catch (error) {
//       console.error("Error creating order:", error);
//       return res.status(500).json({ error: "Failed to create order" });
//     }

//     // Step 4: Save order items with detailed error handling
//     const orderItemPromises = [];
//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       // Validate each item
//       if (!item.productId || !item.unit || !item.qty) {
//         console.error(`Invalid item at index ${i}:`, item);
//         return res.status(400).json({ 
//           error: `Invalid item at index ${i}: missing productId, unit, or qty` 
//         });
//       }

//       const orderItemPromise = CartDao.saveOrderItem({
//         orderId,
//         productId: item.productId,
//         unit: item.unit,
//         qty: item.qty,
//         discount: item.totalDiscount || 0,
//         price: item.totalPrice || 0,
//         packageId: item.itemType === 'package' ? item.packageId : null,
//         packageItemId: item.itemType === 'package' ? item.id : null
//       }).catch(error => {
//         console.error(`Error saving order item ${i}:`, error);
//         throw new Error(`Failed to save order item ${i}: ${error.message}`);
//       });



//       orderItemPromises.push(orderItemPromise);
//     }

//     try {
//       await Promise.all(orderItemPromises);
//     } catch (error) {
//       console.error("Error saving order items:", error);
//       // Consider rolling back the order creation here
//       return res.status(500).json({ error: "Failed to save order items" });
//     }


//     try {
//   await CartDao.deleteCropTask(cartId);
//   console.log(`Cart ${cartId} deleted successfully`);
// } catch (error) {
//   console.error(`Failed to delete cart ${cartId}:`, error);
// }

//     console.log("Order creation success", { orderId, userId });
//     return res.status(200).json({ 
//       status: true, 
//       message: "Order created successfully", 
//       orderId: orderId 
//     });




//   } catch (err) {
//     console.error("Unexpected error in createOrder:", err);
//     return res.status(500).json({ 
//       error: "An unexpected error occurred while creating order",
//       message: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };

//new order creation endpoint

exports.createOrder = (req, res) => {
  return new Promise((resolve, reject) => {
    const {
      cartId,
      checkoutDetails,
      paymentMethod,
      discountAmount,
      grandTotal,
      orderApp = 'Marketplace'
    } = req.body;

    console.log('grandTotal:', grandTotal);
    console.log('checkoutDetails received:', checkoutDetails);

    const { userId } = req.user;
    console.log('userId for order:', userId);

    console.log("Order creation started", {
      cartId,
      userId
    });

    // Input validation
    if (!cartId) {
      return res.status(400).json({
        error: "Cart ID is required"
      });
    }

    if (!checkoutDetails) {
      return res.status(400).json({
        error: "Checkout details are required"
      });
    }

    if (!grandTotal || grandTotal <= 0) {
      return res.status(400).json({
        error: "Valid grand total is required"
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        error: "Payment method is required"
      });
    }

    // Extract all checkout details including coupon information
    const {
      buildingType,
      houseNo,
      street,
      cityName,
      buildingNo,
      buildingName,
      flatNumber,
      floorNumber,
      deliveryMethod,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName,
      centerId,
      couponValue = 0,
      isCoupon = false
    } = checkoutDetails;

    console.log('Coupon details extracted:', {
      couponValue,
      isCoupon
    });

    // Validate required checkout fields
    if (!deliveryMethod || !title || !phone1 || !fullName) {
      return res.status(400).json({
        error: "Missing required checkout details: deliveryMethod, title, phone1, or fullName"
      });
    }

    // Validate delivery method specific requirements
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
    let processOrderId;
    let addressId;
    let cartItems = [];

    // Get connection from pool and start transaction
    marketPlace.getConnection((err, conn) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return res.status(500).json({
          error: "Database connection error"
        });
      }

      connection = conn;

      // Start transaction
      connection.beginTransaction((err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          connection.release();
          return res.status(500).json({
            error: "Transaction start error"
          });
        }

        console.log('Transaction started');

        // Step 1: Validate cart exists and belongs to user
        CartDao.validateCart(cartId, userId)
          .then((cartExists) => {
            if (!cartExists) {
              throw new Error("Cart not found or doesn't belong to user");
            }

            // Step 2: Get cart items from backend
            return CartDao.getCartItems(cartId);
          })
          .then((items) => {
            cartItems = items;
            console.log('Retrieved cart items from backend:', cartItems.length);

            // Validate that cart has items
            if (!cartItems || cartItems.length === 0) {
              throw new Error("Cart is empty. Cannot create order.");
            }

            // Step 3: Create order with transaction
            const orderData = {
              userId,
              orderApp,
              delivaryMethod: deliveryMethod,
              centerId: centerId || null,
              buildingType: deliveryMethod === 'home' ? buildingType : null,
              title,
              fullName,
              phonecode1: phoneCode1,
              phone1,
              phonecode2: phoneCode2,
              phone2,
              isCoupon: isCoupon ? 1 : 0,
              couponValue: parseFloat(couponValue) || 0,
              total: parseFloat(grandTotal) + parseFloat(discountAmount) || 0,
              fullTotal: parseFloat(grandTotal) || 0,
              discount: parseFloat(discountAmount) || 0,
              sheduleType: scheduleType || null,
              sheduleDate: deliveryDate ? new Date(deliveryDate) : null,
              sheduleTime: timeSlot || null,
              isPackage: cartItems.some(item => item.itemType === 'package') ? 1 : 0
            };

            console.log('Final orderData being sent to createOrderWithTransaction:', orderData);

            return CartDao.createOrderWithTransaction(connection, orderData);
          })
          .then((newOrderId) => {
            if (!newOrderId) {
              throw new Error("Failed to create order");
            }
            orderId = newOrderId;
            console.log('Order created with ID:', orderId);

            // Step 4: Create order address only for home delivery
            if (deliveryMethod === 'home') {
              const addressData = {
                buildingNo,
                buildingName,
                unitNo: flatNumber,
                floorNo: floorNumber,
                houseNo,
                streetName: street,
                city: cityName
              };

              return CartDao.createOrderAddressWithTransaction(connection, orderId, addressData, buildingType);
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

            // Step 5: Create process order entry
            const processOrderData = {
              orderId,
              paymentMethod,
              amount: parseFloat(grandTotal),
              status: 'Ordered',
              isPaid: 0
            };

            return CartDao.createProcessOrderWithTransaction(connection, processOrderData);
          })
          .then((processOrderResult) => {
            processOrderId = processOrderResult.insertId;
            console.log('Process order created with ID:', processOrderId);

            // Step 6: Save order items
            return CartDao.saveOrderItemsWithTransaction(connection, orderId, processOrderId, cartItems);
          })
          .then(() => {
            console.log('Order items saved successfully');

            // Step 7: Clear the cart (outside transaction as it's not critical)
            // We'll do this after commit to avoid including it in rollback

            // Commit transaction
            connection.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                connection.rollback(() => {
                  console.log('Transaction rolled back due to commit error');
                  connection.release();
                  res.status(500).json({
                    error: "Transaction commit failed"
                  });
                });
                return;
              }

              console.log('Transaction committed successfully');

              // Now clear the cart (outside transaction)
              CartDao.clearCart(cartId)
                .then((cartCleared) => {
                  if (cartCleared) {
                    console.log(`Cart ${cartId} cleared successfully`);
                  } else {
                    console.warn(`Cart ${cartId} was not found or already cleared`);
                  }
                })
                .catch((cartError) => {
                  // Cart clearing error shouldn't affect the order creation
                  console.warn('Warning: Could not clear cart after successful order creation:', cartError);
                })
                .finally(() => {
                  connection.release();

                  console.log("Order creation success", { orderId, processOrderId, userId });
                  res.status(201).json({
                    status: true,
                    message: "Order created successfully",
                    orderId: orderId,
                    processOrderId: processOrderId,
                    data: {
                      orderId,
                      processOrderId,
                      total: grandTotal,
                      status: 'Ordered'
                    }
                  });
                  resolve();
                });
            });
          })
          .catch((error) => {
            console.error("Error in createOrder transaction:", error);

            // Rollback transaction
            connection.rollback(() => {
              console.log('Transaction rolled back due to error');
              connection.release();

              // Handle different types of errors
              if (error.message === "Cart not found or doesn't belong to user") {
                res.status(404).json({ error: error.message });
              } else if (error.message === "Cart is empty. Cannot create order.") {
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