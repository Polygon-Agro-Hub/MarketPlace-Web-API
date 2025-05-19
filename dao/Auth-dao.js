const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');
const bcrypt = require("bcryptjs");
const { uploadFileToS3 } = require('../middlewares/s3upload'); // adjust path as needed
const{ deleteFromS3} = require('../middlewares/s3delete');



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


exports.getUserProfileDao = (id) => {
  return new Promise((resolve, reject) => {
      // const sql = "SELECT * FROM marketplaceusers WHERE id = ?";
       const sql = "SELECT title, firstName, lastName, email, phoneNumber,phoneCode,image FROM marketplaceusers WHERE id = ?";
      marketPlace.query(sql, [id], (err, results) => {
          if (err) {
              reject(err);
          } else {
              resolve(results[0]);
          }
      });
  });
};

exports.updatePasswordDao = (id, currentPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    const getPasswordSql = "SELECT password FROM marketplaceusers WHERE id = ?";
    marketPlace.query(getPasswordSql, [id], async (err, results) => {
      try {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error("User not found"));

        const storedHashedPassword = results[0].password;

        const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
        if (!isMatch) return reject(new Error("Current password is incorrect"));

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateSql = "UPDATE marketplaceusers SET password = ? WHERE id = ?";
        marketPlace.query(updateSql, [hashedNewPassword, id], (err, result) => {
          if (err) return reject(err);
          resolve("Password updated successfully");
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};



exports.editUserProfileDao = (id, user) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE marketplaceusers 
      SET title = ?, firstName = ?, lastName = ?, email = ?, phoneCode = ?, phoneNumber = ?, image = ?
      WHERE id = ?`;

    marketPlace.query(
      sql,
      [
        user.title,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneCode,
        user.phoneNumber,
        user.profilePicture,
        id,
      ],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE id = ?";
    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

exports.getBillingDetails = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM billing_details WHERE userId = ?";
    marketPlace.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

exports.saveOrUpdateBillingDetails = (userId, details) => {
  return new Promise((resolve, reject) => {
    const checkSql = "SELECT id FROM billing_details WHERE userId = ?";
    marketPlace.query(checkSql, [userId], (err, results) => {
      if (err) return reject(err);

      const isUpdate = results.length > 0;
      const sql = isUpdate
        ? `UPDATE billing_details SET title=?, firstName=?, buildingNo=?, streetName=?, buildingType=?, city=?, 
           phoneCode1=?, phoneNumber1=?, phoneCode2=?, phoneNumber2=? WHERE userId=?`
        : `INSERT INTO billing_details 
           (title, firstName, buildingNo, streetName, buildingType, city, phoneCode1, phoneNumber1, phoneCode2, phoneNumber2, userId) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        details.title,
        details.firstName,
        details.buildingNo,
        details.streetName,
        details.buildingType,
        details.city,
        details.phoneCode1,
        details.phoneNumber1,
        details.phoneCode2,
        details.phoneNumber2,
        userId
      ];

      marketPlace.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
};
