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



exports.createDeliveryAddress = async (
    buildingType,
    houseNo,
    street,
    cityName,
    buildingNo,
    buildingName,
    flatNumber,
    floorNumber
) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO homedeliverydetails (buildingType  , houseNo, street, city, buildingNo, buildingName, flatNo, floorNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      buildingType,
      houseNo,
      street,
      cityName,
      buildingNo,
      buildingName,
      flatNumber,
      floorNumber
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};



exports.createOrder = async (
      userId,
      deliveryMethod,
      homedeliveryId,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName,
      grandTotal,
      discountAmount
) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO retailorder (userId, delivaryMethod, homedeliveryId, title, phoneCode1, phone1, phoneCode2, phone2, sheduleType, sheduleDate, sheduleTime, fullName, total, discount ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      userId,
      deliveryMethod,
      homedeliveryId,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName,
      grandTotal,
      discountAmount
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};


exports.saveOrderItem = async ({
  orderId,
  productId,
  unit,
  qty,
  discount,
  price,
  packageId = null,
  packageItemId = null
}) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO retailorderitems 
      (orderId, productId, unit, qty, discount, price, packageId, packageItemId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      orderId,
      productId,
      unit,
      qty,
      discount,
      price,
      packageId,
      packageItemId
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};




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

exports.createOrder = (orderData) => {
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

    // Capitalize first letter of delivaryMethod and buildingType
    const formattedDelivaryMethod = delivaryMethod.charAt(0).toUpperCase() + delivaryMethod.slice(1).toLowerCase();
    const formattedBuildingType = buildingType.charAt(0).toUpperCase() + buildingType.slice(1).toLowerCase();

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
      orderApp,
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

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error creating order:', err);
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};

// Create order address based on building type
exports.createOrderAddress = (orderId, addressData, buildingType) => {
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

      marketPlace.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error creating order apartment address:', err);
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

      marketPlace.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error creating order house address:', err);
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
exports.saveOrderItems = (orderId, items) => {
  return new Promise((resolve, reject) => {
    const savePromises = items.map(item => {
      if (item.itemType === 'additional') {
        return exports.saveOrderAdditionalItem(orderId, item);
      } else if (item.itemType === 'package') {
        return exports.saveOrderPackage(orderId, item);
      }
    });

    Promise.all(savePromises)
      .then(() => resolve())
      .catch(reject);
  });
};

exports.saveOrderAdditionalItem = (orderId, itemData) => {
  return new Promise((resolve, reject) => {
    const { productId, qty, unit } = itemData;

    const sql = `
      INSERT INTO orderadditionalitems (orderId, productId, qty, unit) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [orderId, productId, qty, unit];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error saving order additional item:', err);
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
  });
};

exports.saveOrderPackage = (orderId, packageData) => {
  return new Promise((resolve, reject) => {
    const { packageId, qty } = packageData;

    const sql = `
      INSERT INTO orderpackage (orderId, packageId) 
      VALUES (?, ?)
    `;
    const values = [orderId, packageId];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error saving order package:', err);
        reject(err);
      } else {
        // If there are package items to save, we would need additional logic here
        resolve(results.insertId);
      }
    });
  });
};

exports.createProcessOrder = (processOrderData) => {
  return new Promise((resolve, reject) => {
    const {
      orderId,
      invNo,
      transactionId,
      paymentMethod,
      isPaid,
      amount,
      status,
      reportStatus
    } = processOrderData;

    const sql = `
      INSERT INTO processorders (
        orderId, invNo, transactionId, paymentMethod, 
        isPaid, amount, status, reportStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      orderId,
      invNo || null,
      transactionId || null,
      paymentMethod,
      isPaid || 0,
      amount,
      status || 'pending',
      reportStatus || null
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error creating process order:', err);
        reject(err);
      } else {
        resolve(results.insertId);
      }
    });
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
