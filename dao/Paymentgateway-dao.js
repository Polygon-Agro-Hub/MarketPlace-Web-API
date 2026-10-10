
const {
    collectionofficer
} = require("../startup/database");


exports.test = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id
        FROM cart
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