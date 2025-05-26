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
    mi.displayName
    FROM packagedetails pd
    JOIN marketplaceitems mi ON mi.id = pd.mpItemId
    WHERE pd.packageId = ?`, [packageId]);

  return rows.map(row => ({
    id: row.id,
    mpItemId: row.mpItemId,
    displayName: row.displayName,
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


