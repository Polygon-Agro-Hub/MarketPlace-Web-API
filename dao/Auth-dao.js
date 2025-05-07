const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');


exports.userLogin = (email) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE email = ?";
    marketPlace.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};


exports.signupUser = (user, password) => {
  return new Promise((resolve, reject) => {
      const sql = "INSERT INTO marketplaceusers (title, firstName, lastName, phoneCode, phoneNumber, buyerType, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      marketPlace.query(sql, [
          user.title,
          user.firstName,
          user.lastName,
          user.phoneCode,
          user.phoneNumber,
          user.buyerType,
          user.email,
          password
      ], (err, results) => {
          if (err) {
              reject(err);
          } else {
              resolve(results);
          }
      });
  });
};

// Optionally, add a function to check if the email already exists
exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM marketplaceusers WHERE email = ?";
      marketPlace.query(sql, [email], (err, results) => {
          if (err) {
              reject(err);
          } else {
              resolve(results[0]);
          }
      });
  });
};