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