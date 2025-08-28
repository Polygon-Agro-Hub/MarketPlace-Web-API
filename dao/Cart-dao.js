const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");

exports.getTrueCart = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT * 
    FROM retailcart 
    WHERE userId = ?`;
    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};









  // Getting the cart by user ID

// Getting the cart by user ID
exports.getCartByUserId = async (userId) => {
  const [rows] = await marketPlace.promise().query('SELECT * FROM retailcart WHERE userId = ?', [userId]);
  return rows[0]; // Assuming there is only one cart per user
};

// Getting additional items in the cart
exports.getAdditionalItems = async (cartId) => {
  const [rows] = await marketPlace.promise().query(`
    SELECT rai.*, 
      mi.displayName,
      cv.image,
      CASE 
        WHEN rai.unit = 'g' THEN rai.qty * mi.discount / 1000
        ELSE rai.qty * mi.discount
      END AS totalDiscount, 
      CASE 
        WHEN rai.unit = 'g' THEN rai.qty * mi.normalPrice / 1000
        ELSE rai.qty * mi.normalPrice
      END AS totalPrice
    FROM retailadditionalitems rai
    JOIN marketplaceitems mi ON mi.id = rai.productId
    JOIN plant_care.cropvariety cv ON cv.id = mi.varietyId
    WHERE rai.cartId = ?`, [cartId]);

  return rows;
};

// Getting package items in the cart
exports.getPackageItems = async (cartId) => {
  const [rows] = await marketPlace.promise().query('SELECT * FROM retailpackageitems WHERE cartId = ?', [cartId]);
  return rows;
};

// Getting package details for a specific package
exports.getPackageDetails = async (packageId) => {
  const [rows] = await marketPlace.promise().query(`
    SELECT pd.*,
    mi.displayName,
    cv.image
    FROM packagedetails pd
    JOIN marketplaceitems mi ON mi.id = pd.mpItemId
    JOIN plant_care.cropvariety cv ON cv.id = mi.varietyId
    WHERE pd.packageId = ?`, [packageId]);

  return rows.map(row => ({
    id: row.id,
    mpItemId: row.mpItemId,
    displayName: row.displayName,
    image: row.image,
    quantity: row.quantity,
    discount: row.discount,
    price: row.price,
    discountedPrice: row.discountedPrice,
  }));
};

// Getting the package items that have been subtracted (minus items)
exports.getPackageItemMin = async (retailpackageItemsId) => {
  const [rows] = await marketPlace.promise().query('SELECT * FROM retailpackageitemsMinus WHERE retailpackageItemsId = ?', [retailpackageItemsId]);
  return rows;
};



// Getting the package items that have been added (added items)
exports.getPackageItemAdded = async (retailpackageItemsId) => {
  const [rows] = await marketPlace.promise().query('SELECT * FROM retailpackageitemsadded WHERE retailpackageItemsId = ?', [retailpackageItemsId]);
  return rows;
};





exports.checkCartDetails = async (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM retailcart WHERE id = ?";
    marketPlace.query(sql, [id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};



// exports.createDeliveryAddress = async (
//     buildingType,
//     houseNo,
//     street,
//     cityName,
//     buildingNo,
//     buildingName,
//     flatNumber,
//     floorNumber
// ) => {
//   return new Promise((resolve, reject) => {
//     const sql =
//       "INSERT INTO homedeliverydetails (buildingType  , houseNo, street, city, buildingNo, buildingName, flatNo, floorNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
//     const values = [
//       buildingType,
//       houseNo,
//       street,
//       cityName,
//       buildingNo,
//       buildingName,
//       flatNumber,
//       floorNumber
//     ];

//     marketPlace.query(sql, values, (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(results.insertId);
//       }
//     });
//   });
// };



// exports.createOrder = async (
//       userId,
//       deliveryMethod,
//       homedeliveryId,
//       title,
//       phoneCode1,
//       phone1,
//       phoneCode2,
//       phone2,
//       scheduleType,
//       deliveryDate,
//       timeSlot,
//       fullName,
//       grandTotal,
//       discountAmount
// ) => {
//   return new Promise((resolve, reject) => {
//     const sql =
//       "INSERT INTO retailorder (userId, delivaryMethod, homedeliveryId, title, phoneCode1, phone1, phoneCode2, phone2, sheduleType, sheduleDate, sheduleTime, fullName, total, discount ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//     const values = [
//       userId,
//       deliveryMethod,
//       homedeliveryId,
//       title,
//       phoneCode1,
//       phone1,
//       phoneCode2,
//       phone2,
//       scheduleType,
//       deliveryDate,
//       timeSlot,
//       fullName,
//       grandTotal,
//       discountAmount
//     ];

//     marketPlace.query(sql, values, (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(results.insertId);
//       }
//     });
//   });
// };


// exports.saveOrderItem = async ({
//   orderId,
//   productId,
//   unit,
//   qty,
//   discount,
//   price,
//   packageId = null,
//   packageItemId = null
// }) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       INSERT INTO retailorderitems 
//       (orderId, productId, unit, qty, discount, price, packageId, packageItemId) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//     const values = [
//       orderId,
//       productId,
//       unit,
//       qty,
//       discount,
//       price,
//       packageId,
//       packageItemId
//     ];

//     marketPlace.query(sql, values, (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(results.insertId);
//       }
//     });
//   });
// };




exports.deleteCropTask = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM retailcart WHERE id = ?";
    const values = [cartId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        return reject(err); // Reject promise if an error occurs
      }
      resolve(results); // Resolve the promise with the query results
    });
  });
};


//new order daos 

// Updated DAO functions to handle proper order creation and cart clearing

// Remove the old address functions since we're using order tables directly

exports.validateCart = (cartId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id FROM cart 
      WHERE id = ? AND userId = ?
    `;
    const values = [cartId, userId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error validating cart:', err);
        reject(err);
      } else {
        resolve(results.length > 0);
      }
    });
  });
};

exports.createOrderWithTransaction = (connection, orderData) => {
  return new Promise((resolve, reject) => {
    const {
      userId,
      orderApp,
      delivaryMethod,
      centerId,
      buildingType,
      title,
      fullName,
      phonecode1,
      phone1,
      phonecode2,
      phone2,
      isCoupon,
      couponValue,
      total,
      fullTotal,
      discount,
      sheduleType,
      sheduleDate,
      sheduleTime,
      isPackage
    } = orderData;

    // Format delivaryMethod: replace "home" with "Delivery", otherwise capitalize first letter
    const formatDeliveryMethod = (method) => {
      if (!method || typeof method !== 'string') return method;
      if (method.toLowerCase() === 'home') {
        return 'Delivery';
      }
      return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    };

    // Capitalize first letter of buildingType - handle null/undefined values
    const formatBuildingType = (type) => {
      if (!type || typeof type !== 'string') return type;
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };

    const formattedDelivaryMethod = formatDeliveryMethod(delivaryMethod);
    const formattedBuildingType = formatBuildingType(buildingType);

    const sql = `
      INSERT INTO orders (
        userId, orderApp, delivaryMethod, centerId, buildingType,
        title, fullName, phonecode1, phone1, phonecode2, phone2,
        isCoupon, couponValue, total, fullTotal, discount,
        sheduleType, sheduleDate, sheduleTime, isPackage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userId,
      "Marketplace",
      formattedDelivaryMethod,
      centerId,
      formattedBuildingType,
      title,
      fullName,
      phonecode1,
      phone1,
      phonecode2 || null,
      phone2 || null,
      isCoupon,
      couponValue,
      total,
      fullTotal,
      discount,
      sheduleType,
      sheduleDate,
      sheduleTime,
      isPackage
    ];

    console.log('SQL Query:', sql);
    console.log('Values being inserted:', values);

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error creating order in transaction:', err);
        reject(err);
      } else {
        console.log('Order created successfully with ID:', results.insertId);
        resolve(results.insertId);
      }
    });
  });
};

// Create order address based on building type
exports.createOrderAddressWithTransaction = (connection, orderId, addressData, buildingType) => {
  return new Promise((resolve, reject) => {
    if (buildingType === 'apartment') {
      const {
        buildingNo,
        buildingName,
        unitNo,
        floorNo,
        houseNo,
        streetName,
        city
      } = addressData;

      const sql = `
        INSERT INTO orderapartment (
          orderId, buildingNo, buildingName, unitNo, 
          floorNo, houseNo, streetName, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        orderId,
        buildingNo,
        buildingName,
        unitNo,
        floorNo,
        houseNo || null,
        streetName,
        city
      ];

      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error creating order apartment address in transaction:', err);
          reject(err);
        } else {
          resolve(results.insertId);
        }
      });
    } else if (buildingType === 'house') {
      const { houseNo, streetName, city } = addressData;

      const sql = `
        INSERT INTO orderhouse (orderId, houseNo, streetName, city) 
        VALUES (?, ?, ?, ?)
      `;
      const values = [orderId, houseNo, streetName, city];

      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error creating order house address in transaction:', err);
          reject(err);
        } else {
          resolve(results.insertId);
        }
      });
    } else {
      reject(new Error('Invalid building type'));
    }
  });
};


// Get cart items (both additional items and packages)
exports.getCartItems = (cartId) => {
  return new Promise((resolve, reject) => {
    const getAdditionalItems = () => {
      return new Promise((resolve, reject) => {
        const sql = `
          SELECT productId, qty, unit, 'additional' as itemType
          FROM cartadditionalitems 
          WHERE cartId = ?
        `;
        marketPlace.query(sql, [cartId], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    };

    const getPackageItems = () => {
      return new Promise((resolve, reject) => {
        const sql = `
          SELECT packageId, qty, 'package' as itemType
          FROM cartpackage 
          WHERE cartId = ?
        `;
        marketPlace.query(sql, [cartId], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    };

    Promise.all([getAdditionalItems(), getPackageItems()])
      .then(([additionalItems, packageItems]) => {
        resolve([...additionalItems, ...packageItems]);
      })
      .catch(reject);
  });
};

// Save order items (both additional items and packages)
exports.saveOrderItemsWithTransaction = (connection, orderId, processOrderId, items) => {
  return new Promise((resolve, reject) => {
    const savePromises = items.map(item => {
      if (item.itemType === 'additional') {
        return exports.saveOrderAdditionalItemWithTransaction(connection, orderId, item);
      } else if (item.itemType === 'package') {
        return exports.saveOrderPackageWithTransaction(connection, processOrderId, item);
      }
    });

    Promise.all(savePromises)
      .then(() => resolve())
      .catch(reject);
  });
};


exports.saveOrderAdditionalItemWithTransaction = (connection, orderId, itemData) => {
  return new Promise((resolve, reject) => {
    const { productId, qty, unit } = itemData;

    // Get the normalPrice and discount per 1kg from marketplaceitems table
    const getPriceSQL = `
      SELECT normalPrice, discount, unitType 
      FROM marketplaceitems 
      WHERE id = ?
    `;

    connection.query(getPriceSQL, [productId], (err, priceResults) => {
      if (err) {
        console.error('Error fetching marketplace item price in transaction:', err);
        reject(err);
        return;
      }

      if (priceResults.length === 0) {
        reject(new Error(`Marketplace item with ID ${productId} not found`));
        return;
      }

      const marketplaceItem = priceResults[0];
      const { normalPrice, discount, unitType } = marketplaceItem;

      // Calculate the actual prices and discount based on quantity and unit
      const normalPricePerKg = parseFloat(normalPrice) || 0;
      const discountPerKg = parseFloat(discount) || 0;
      
      let calculatedNormalPrice;
      let calculatedPrice;
      let calculatedDiscount;
      let quantityInKg;

      // Convert quantity to kg based on unit (only kg and g supported)
      if (unit.toLowerCase() === 'kg') {
        quantityInKg = parseFloat(qty);
        calculatedNormalPrice = normalPricePerKg * quantityInKg;
        calculatedDiscount = discountPerKg * quantityInKg;
        calculatedPrice = calculatedNormalPrice - calculatedDiscount;
        console.log(`Normal Price calculation (kg): ${normalPricePerKg}/kg × ${qty}kg = ${calculatedNormalPrice}`);
        console.log(`Discount calculation (kg): ${discountPerKg}/kg × ${qty}kg = ${calculatedDiscount}`);
        console.log(`Final Price calculation (kg): ${calculatedNormalPrice} - ${calculatedDiscount} = ${calculatedPrice}`);
      } else if (unit.toLowerCase() === 'g') {
        quantityInKg = parseFloat(qty) / 1000; // Convert grams to kg
        calculatedNormalPrice = normalPricePerKg * quantityInKg;
        calculatedDiscount = discountPerKg * quantityInKg;
        calculatedPrice = calculatedNormalPrice - calculatedDiscount;
        console.log(`Normal Price calculation (grams): ${normalPricePerKg}/kg × ${qty}g (${quantityInKg}kg) = ${calculatedNormalPrice}`);
        console.log(`Discount calculation (grams): ${discountPerKg}/kg × ${qty}g (${quantityInKg}kg) = ${calculatedDiscount}`);
        console.log(`Final Price calculation (grams): ${calculatedNormalPrice} - ${calculatedDiscount} = ${calculatedPrice}`);
      } else {
        reject(new Error(`Unsupported unit: ${unit}. Only 'kg' and 'g' are supported.`));
        return;
      }

      // Insert the order additional item with calculated normalPrice, price and discount
      const insertSQL = `
        INSERT INTO orderadditionalitems (orderId, productId, qty, unit, normalPrice, price, discount) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [orderId, productId, qty, unit, calculatedNormalPrice, calculatedPrice, calculatedDiscount];

      connection.query(insertSQL, values, (err, results) => {
        if (err) {
          console.error('Error saving order additional item in transaction:', err);
          reject(err);
        } else {
          console.log(`Order additional item saved in transaction: ProductID=${productId}, Qty=${qty}, Unit=${unit}, NormalPrice=${calculatedNormalPrice}, Price=${calculatedPrice}, Discount=${calculatedDiscount}`);
          resolve(results.insertId);
        }
      });
    });
  });
};

exports.saveOrderPackageWithTransaction = (connection, processOrderId, packageData) => {
  return new Promise((resolve, reject) => {
    const { packageId, qty } = packageData;

    const sql = `
      INSERT INTO orderpackage (orderId, packageId, qty) 
      VALUES (?, ?, ?)
    `;
    const values = [processOrderId, packageId, qty || 1]; // Include qty with default fallback

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error saving order package in transaction:', err);
        reject(err);
      } else {
        console.log(`Order package saved in transaction: ProcessOrderID=${processOrderId}, PackageID=${packageId}, Qty=${qty || 1}`);
        resolve(results.insertId);
      }
    });
  });
};

exports.createProcessOrderWithTransaction = (connection, processOrderData) => {
  return new Promise((resolve, reject) => {
    const {
      orderId,
      transactionId,
      paymentMethod,
      isPaid,
      amount,
      status,
      reportStatus
    } = processOrderData;

    // Capitalize first letter of payment method
    const formatPaymentMethod = (method) => {
      if (!method || typeof method !== 'string') return method;
      return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    };

    // Generate invoice number
    const generateInvoiceNumber = () => {
      return new Promise((resolveInv, rejectInv) => {
        const today = new Date();
        // Fixed: Get YYMMDD format correctly
        const year = today.getFullYear().toString().slice(-2); // Last 2 digits of year
        const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
        const day = today.getDate().toString().padStart(2, '0'); // Day with leading zero
        const datePrefix = `${year}${month}${day}`; // YYMMDD format
        
        // Get the last invoice number by highest ID
        const checkSql = `
          SELECT invNo FROM processorders 
          ORDER BY id DESC 
          LIMIT 1
        `;
        
        connection.query(checkSql, [], (err, results) => {
          if (err) {
            rejectInv(err);
            return;
          }
          
          let nextSequence = 1;
          
          if (results.length > 0) {
            const lastInvNo = results[0].invNo;
            
            // Check if the last invoice is from today
            if (lastInvNo && lastInvNo.startsWith(datePrefix)) {
              // Extract the sequence number from the last invoice (last 4 digits)
              const sequencePart = lastInvNo.slice(-4);
              const lastSequence = parseInt(sequencePart, 10);
              
              if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
              }
            }
            // If last invoice is not from today, start with sequence 1
          }
          
          // Format sequence number with leading zeros (4 digits)
          const sequenceStr = nextSequence.toString().padStart(4, '0');
          const invNo = `${datePrefix}${sequenceStr}`;
          
          resolveInv(invNo);
        });
      });
    };

    // Generate invoice number first, then insert the record
    generateInvoiceNumber()
      .then(invNo => {
        const formattedPaymentMethod = formatPaymentMethod(paymentMethod);
        
        // Set isPaid and amount based on payment method
        let finalIsPaid = isPaid || 0;
        let finalAmount = amount;
        
        if (formattedPaymentMethod && formattedPaymentMethod.toLowerCase() === 'cash') {
          finalIsPaid = 0;
          finalAmount = 0;
        } else if (formattedPaymentMethod && formattedPaymentMethod.toLowerCase() === 'card') {
          finalIsPaid = 1;
          // Keep the original amount for card payments
        }
        
        const sql = `
          INSERT INTO processorders (
            orderId, invNo, transactionId, paymentMethod, 
            isPaid, amount, status, reportStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          orderId,
          invNo,
          transactionId || null,
          formattedPaymentMethod,
          finalIsPaid,
          finalAmount,
          status || 'pending',
          reportStatus || null
        ];

        connection.query(sql, values, (err, results) => {
          if (err) {
            // Check if it's a duplicate key error (race condition)
            if (err.code === 'ER_DUP_ENTRY' && err.message.includes('invNo')) {
              // Retry with a new invoice number
              exports.createProcessOrderWithTransaction(connection, processOrderData)
                .then(resolve)
                .catch(reject);
            } else {
              console.error('Error creating process order in transaction:', err);
              reject(err);
            }
          } else {
            resolve({
              insertId: results.insertId,
              invNo: invNo
            });
          }
        });
      })
      .catch(reject);
  });
};


// Updated clearCart function to handle all cart-related tables
exports.clearCart = (cartId) => {
  return new Promise((resolve, reject) => {
    // Delete cart additional items
    const deleteAdditionalItemsSql = `DELETE FROM cartadditionalitems WHERE cartId = ?`;
    marketPlace.query(deleteAdditionalItemsSql, [cartId], (err) => {
      if (err) {
        console.error('Error deleting cart additional items:', err);
        reject(err);
        return;
      }

      // Delete cart packages
      const deletePackagesSql = `DELETE FROM cartpackage WHERE cartId = ?`;
      marketPlace.query(deletePackagesSql, [cartId], (err) => {
        if (err) {
          console.error('Error deleting cart packages:', err);
          reject(err);
          return;
        }

        // Finally delete the cart itself
        const deleteCartSql = `DELETE FROM cart WHERE id = ?`;
        marketPlace.query(deleteCartSql, [cartId], (err, results) => {
          if (err) {
            console.error('Error deleting cart:', err);
            reject(err);
          } else {
            resolve(results.affectedRows > 0);
          }
        });
      });
    });
  });
};

exports.getOrderById = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT o.*, po.paymentMethod, po.status as paymentStatus, po.isPaid
      FROM orders o
      LEFT JOIN processorders po ON o.id = po.orderId
      WHERE o.id = ?
    `;
    const values = [orderId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error getting order by ID:', err);
        reject(err);
      } else {
        resolve(results[0] || null);
      }
    });
  });
};

exports.getOrdersByUserId = (userId, limit = 10, offset = 0) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT o.*, po.paymentMethod, po.status as paymentStatus, po.isPaid
      FROM orders o
      LEFT JOIN processorders po ON o.id = po.orderId
      WHERE o.userId = ?
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    const values = [userId, limit, offset];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error getting orders by user ID:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.updateOrderStatus = (orderId, status) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE processorders 
      SET status = ? 
      WHERE orderId = ?
    `;
    const values = [status, orderId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error updating order status:', err);
        reject(err);
      } else {
        resolve(results.affectedRows > 0);
      }
    });
  });
};

exports.updatePaymentStatus = (orderId, isPaid, transactionId = null) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE processorders 
      SET isPaid = ?, transactionId = ? 
      WHERE orderId = ?
    `;
    const values = [isPaid, transactionId, orderId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error updating payment status:', err);
        reject(err);
      } else {
        resolve(results.affectedRows > 0);
      }
    });
  });
};


exports.getPickupCenters = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id as centerId,
        centerName,
        longitude,
        latitude,
        city,
        district
      FROM distributedcenter 
      WHERE longitude IS NOT NULL 
        AND latitude IS NOT NULL 
        AND centerName IS NOT NULL
      ORDER BY centerName ASC
    `;

    collectionofficer.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching pickup centers:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.getNearestCitiesDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        dc.id,
        dc.city,
        dc.charge,
        dc.createdAt
      FROM deliverycharge dc
      INNER JOIN centerowncity coc ON dc.id = coc.cityId
      ORDER BY dc.city ASC
    `;
    
    collectionofficer.query(sql, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};