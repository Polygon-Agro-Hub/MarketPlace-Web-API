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


// exports.signupUser = (user, hashedPassword) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       INSERT INTO marketplaceusers 
//       (title, firstName, lastName, phoneCode, phoneNumber, buyerType, email, password) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       user.title,
//       user.firstName,
//       user.lastName,
//       user.phoneCode,
//       user.phoneNumber,
//       user.buyerType,  // ← make sure this aligns with frontend `accountType`
//       user.email,
//       hashedPassword
//     ];

//     marketPlace.query(sql, values, (err, results) => {
//       if (err) {
//         reject({
//           status: false,
//           message: 'Database error during user signup.',
//           error: err
//         });
//       } else if (results.affectedRows === 1) {
//         resolve({
//           status: true,
//           message: 'User registered successfully.',
//           data: { userId: results.insertId }
//         });
//       } else {
//         reject({
//           status: false,
//           message: 'User registration failed, no rows affected.'
//         });
//       }
//     });
//   });
// };

exports.signupUser = (user, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (title, firstName, lastName, phoneCode, phoneNumber, buyerType, email, password, isSubscribe) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.title,
      user.firstName,
      user.lastName,
      user.phoneCode,
      user.phoneNumber,
      user.buyerType,
      user.email,
      hashedPassword,
      user.agreeToMarketing ? 1 : 0 // Maps agreeToMarketing to isMarketPlaceUser
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject({
          status: false,
          message: 'Database error during user signup.',
          error: err
        });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: 'User registered successfully.',
          data: { userId: results.insertId }
        });
      } else {
        reject({
          status: false,
          message: 'User registration failed, no rows affected.'
        });
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

// Get user by Google ID
exports.getUserByGoogleId = (googleId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE googleId = ?";
    marketPlace.query(sql, [googleId], (err, results) => {
      if (err) {
        console.error('Error getting user by Google ID:', err);
        reject({ status: false, message: 'Database error', error: err });
      } else {
        resolve(results.length > 0 ? results[0] : null);
      }
    });
  });
};

// Create user with Google authentication (consistent Promise wrapper)
exports.createGoogleUser = (userData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (email, firstName, lastName, googleId, image, buyerType) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.googleId,
      userData.imageUrl || null,
      'regular'
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error creating Google user:', err);
        reject({ status: false, message: 'Database error', error: err });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: 'User registered successfully with Google',
          data: { userId: results.insertId }
        });
      } else {
        resolve({
          status: false,
          message: 'Failed to register user with Google'
        });
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





// get billing details
exports.getBillingDetails = (userId) => {
  return new Promise((resolve, reject) => {
    const userSql = `SELECT id, title, firstName, lastName, phoneCode, phoneNumber, buildingType,billingTitle,billingName
                     FROM marketplaceusers WHERE id = ?`;

    marketPlace.query(userSql, [userId], (err, userResults) => {
      if (err) return reject(err);
      if (userResults.length === 0) return resolve(null);

      const user = userResults[0];
      const buildingType = user.buildingType;

      if (buildingType === 'house') {
        const houseSql = `SELECT houseNo, streetName, city FROM house WHERE customerId = ?`;
        marketPlace.query(houseSql, [userId], (err, houseResults) => {
          if (err) return reject(err);
          resolve({
            ...user,
            address: houseResults[0] || {}
          });
        });
      } else if (buildingType === 'apartment') {
        const aptSql = `SELECT buildingNo, buildingName, unitNo, floorNo, houseNo, streetName, city 
                        FROM apartment WHERE customerId = ?`;
        marketPlace.query(aptSql, [userId], (err, aptResults) => {
          if (err) return reject(err);
          resolve({
            ...user,
            address: aptResults[0] || {}
          });
        });
      } else {
        // No buildingType or unknown - just return user without address
        resolve(user);
      }
    });
  });
};




exports.saveOrUpdateBillingDetails = (userId, details) => {
  return new Promise((resolve, reject) => {
    // Validate input to prevent null/undefined
    if (
      !details.billingTitle ||
      !details.billingName ||
      !details.title ||
      !details.firstName ||
      !details.phoneCode ||
      !details.phoneNumber ||
      !details.buildingType
    ) {
      return reject(new Error('Required fields are missing'));
    }

    // Get current buildingType to detect changes
    const getUserSql = `SELECT buildingType FROM marketplaceusers WHERE id = ?`;
    marketPlace.query(getUserSql, [userId], (err, userResults) => {
      if (err) return reject(err);
      if (userResults.length === 0) return reject(new Error('User not found'));

      const currentBuildingType = userResults[0].buildingType ? userResults[0].buildingType.toLowerCase() : null;
      const newBuildingType = details.buildingType.toLowerCase();

      // Update marketplaceusers with billingTitle, billingName, and other fields
      const userUpdateSql = `UPDATE marketplaceusers SET billingTitle=?, billingName=?, title=?, firstName=?, lastName=?, phoneCode=?, phoneNumber=?, buildingType=? WHERE id=?`;
      const userValues = [
        details.billingTitle,
        details.billingName,
        details.title,
        details.firstName,
        details.lastName || '',
        details.phoneCode,
        details.phoneNumber,
        newBuildingType,
        userId,
      ];

      marketPlace.query(userUpdateSql, userValues, (err) => {
        if (err) return reject(err);

        // Delete old address record if buildingType changed
        if (currentBuildingType && currentBuildingType !== newBuildingType) {
          const deleteSql =
            currentBuildingType === 'house'
              ? `DELETE FROM house WHERE customerId = ?`
              : `DELETE FROM apartment WHERE customerId = ?`;
          marketPlace.query(deleteSql, [userId], (err) => {
            if (err) return reject(err);
          });
        }

        // Handle address updates based on buildingType
        if (newBuildingType === 'house') {
          const checkHouseSql = `SELECT id FROM house WHERE customerId = ?`;
          marketPlace.query(checkHouseSql, [userId], (err, houseResults) => {
            if (err) return reject(err);

            if (houseResults.length > 0) {
              // Update house
              const updateHouseSql = `UPDATE house SET houseNo=?, streetName=?, city=? WHERE customerId=?`;
              const houseValues = [
                details.address.houseNo || '',
                details.address.streetName || '',
                details.address.city || '',
                userId,
              ];
              marketPlace.query(updateHouseSql, houseValues, (err) => {
                if (err) return reject(err);
                resolve({ status: true, message: 'Billing details updated successfully' });
              });
            } else {
              // Insert house
              const insertHouseSql = `INSERT INTO house (customerId, houseNo, streetName, city) VALUES (?, ?, ?, ?)`;
              const houseValues = [
                userId,
                details.address.houseNo || '',
                details.address.streetName || '',
                details.address.city || '',
              ];
              marketPlace.query(insertHouseSql, houseValues, (err) => {
                if (err) return reject(err);
                resolve({ status: true, message: 'Billing details saved successfully' });
              });
            }
          });
        } else if (newBuildingType === 'apartment') {
          const checkAptSql = `SELECT id FROM apartment WHERE customerId = ?`;
          marketPlace.query(checkAptSql, [userId], (err, aptResults) => {
            if (err) return reject(err);

            if (aptResults.length > 0) {
              // Update apartment
              const updateAptSql = `UPDATE apartment SET buildingNo=?, buildingName=?, unitNo=?, floorNo=?, houseNo=?, streetName=?, city=? WHERE customerId=?`;
              const aptValues = [
                details.address.buildingNo || '',
                details.address.buildingName || '',
                details.address.unitNo || '',
                details.address.floorNo || null,
                details.address.houseNo || '',
                details.address.streetName || '',
                details.address.city || '',
                userId,
              ];
              marketPlace.query(updateAptSql, aptValues, (err) => {
                if (err) return reject(err);
                resolve({ status: true, message: 'Billing details updated successfully' });
              });
            } else {
              // Insert apartment
              const insertAptSql = `INSERT INTO apartment (customerId, buildingNo, buildingName, unitNo, floorNo, houseNo, streetName, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
              const aptValues = [
                userId,
                details.address.buildingNo || '',
                details.address.buildingName || '',
                details.address.unitNo || '',
                details.address.floorNo || null,
                details.address.houseNo || '',
                details.address.streetName || '',
                details.address.city || '',
              ];
              marketPlace.query(insertAptSql, aptValues, (err) => {
                if (err) return reject(err);
                resolve({ status: true, message: 'Billing details saved successfully' });
              });
            }
          });
        } else {
          // Delete any existing address records for unknown buildingType
          const deleteHouseSql = `DELETE FROM house WHERE customerId = ?`;
          const deleteAptSql = `DELETE FROM apartment WHERE customerId = ?`;
          marketPlace.query(deleteHouseSql, [userId], (err) => {
            if (err) return reject(err);
            marketPlace.query(deleteAptSql, [userId], (err) => {
              if (err) return reject(err);
              resolve({ status: true, message: 'User info updated, no address updated due to unknown buildingType' });
            });
          });
        }
      });
    });
  });
};

exports.unsubscribeUser = (email, action) => {
  return new Promise((resolve, reject) => {
    if (!['unsubscribe', 'stay'].includes(action)) {
      return reject({
        status: false,
        message: 'Invalid action. Must be "unsubscribe" or "stay".'
      });
    }

    const isSubscribe = action === 'unsubscribe' ? 0 : 1;
    const sql = `
      UPDATE marketplaceusers 
      SET isSubscribe = ?
      WHERE email = ?
    `;

    marketPlace.query(sql, [isSubscribe, email], (err, results) => {
      if (err) {
        return reject({
          status: false,
          message: 'Database error during subscription update.',
          error: err
        });
      }

      if (results.affectedRows === 0) {
        return reject({
          status: false,
          message: 'No user found with this email.'
        });
      }

      resolve({
        status: true,
        message: action === 'unsubscribe' 
          ? 'Successfully unsubscribed from promotional emails.' 
          : 'Successfully maintained subscription.'
      });
    });
  });
};