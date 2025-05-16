const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");

exports.getProductsByCategoryDao = (category) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        m.id,
        m.displayName,
        m.normalPrice,
        m.discountedPrice,
        m.discount,
        m.promo,
        m.unitType,
        m.startValue,
        m.changeby,
        m.displayType,
        m.tags,
        v.varietyNameEnglish,
        v.varietyNameSinhala,
        v.varietyNameTamil,
        v.image,
        c.cropNameEnglish,
        c.cropNameSinhala,
        c.cropNameTamil,
        c.category
      FROM marketplaceitems m
      JOIN plant_care.cropvariety v ON m.varietyId = v.id
      JOIN plant_care.cropgroup c ON v.cropGroupId = c.id
      WHERE c.category = ? AND m.category = 'Retail'
    `;
    marketPlace.query(sql, [category], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Existing function
exports.getAllProductDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id, displayName, image, total AS subTotal
        FROM marketplacepackages
        `;
    marketPlace.query(sql, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.getAllPackageItemsDao = (packageId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT pd.id, pd.packageId, pd.quantity, pd.quantityType, mpi.displayName, mpi.id
        FROM market_place.packagedetails pd
        LEFT JOIN market_place.marketplaceitems mpi ON pd.mpItemId = mpi.id
        WHERE pd.packageId = ?;
        `;
    marketPlace.query(sql, [packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
