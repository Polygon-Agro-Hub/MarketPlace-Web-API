const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllProductDao = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id, displayName, image,total AS subTotal
        FROM marketplacepackages
        `;
    marketPlace.query(sql, [email], (err, results) => {
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