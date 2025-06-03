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
