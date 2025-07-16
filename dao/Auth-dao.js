const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

// Reset password with token
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const { uploadFileToS3 } = require('../middlewares/s3upload'); // adjust path as needed
const { deleteFromS3 } = require('../middlewares/s3delete');





exports.userLogin = (emailOrPhone, buyerType) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE  (email = ? OR CONCAT(phoneCode, phoneNumber) = ?) AND buyerType = ?";
    marketPlace.query(sql, [emailOrPhone, emailOrPhone, buyerType], (err, results) => {
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

exports.signupUser = (user, hashedPassword, nextId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (title, firstName, lastName, phoneCode, phoneNumber, phoneCode2, phoneNumber2, buyerType, email, password, isMarketPlaceUser, isSubscribe, companyName, companyPhoneCode, companyPhone, cusId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.title,
      user.firstName,
      user.lastName,
      user.phoneCode,
      user.phoneNumber,
      user.phoneCode2 || null,          
      user.phoneNumber2 || null,        
      user.buyerType,
      user.email,
      hashedPassword,
      1,
      user.agreeToMarketing ? 1 : 0,
      user.companyName || null,
      user.companyPhoneCode || null,     
      user.companyPhoneNumber || null,   
      nextId
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
  console.log("Checking for user with email:", email);
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE email = ?";
    marketPlace.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
    console.log("Query executed for email:", email);
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



// Create password reset token
exports.createPasswordResetToken = (email) => {
  return new Promise((resolve, reject) => {
    // First get the user ID from the email
    const getUserSql = "SELECT id FROM marketplaceusers WHERE email = ?";

    marketPlace.query(getUserSql, [email], (err, userResults) => {
      if (err) {
        return reject(err);
      }

      if (userResults.length === 0) {
        return reject(new Error("User not found"));
      }

      const userId = userResults[0].id;

      // Check if token already exists for this user
      const checkTokenSql = "SELECT * FROM resetpasswordtoken WHERE userId = ?";

      marketPlace.query(checkTokenSql, [userId], (err, tokenResults) => {
        if (err) {
          return reject(err);
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log("Generated token:", resetToken);
        // Set token expiry (1 hour from now)
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        // Hash the token for security before storing it
        const hashedToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');

        console.log("Hashed token when creating :", hashedToken);

        if (tokenResults.length > 0) {
          // Token exists - update it
          const updateSql = `
            UPDATE resetpasswordtoken 
            SET resetPasswordToken = ?, resetPasswordExpires = ?
            WHERE userId = ?
          `;

          marketPlace.query(updateSql, [hashedToken, resetTokenExpiry, userId], (err) => {
            if (err) {
              return reject(err);
            }
            resolve(resetToken);
          });
        } else {
          // No token exists - insert new one
          const insertSql = `
            INSERT INTO resetpasswordtoken 
            (userId, resetPasswordToken, resetPasswordExpires) 
            VALUES (?, ?, ?)
          `;

          marketPlace.query(insertSql, [userId, hashedToken, resetTokenExpiry], (err) => {
            if (err) {
              return reject(err);
            }
            resolve(resetToken);
          });
        }
      });
    });
  });
};

// Verify password reset token
exports.verifyResetToken = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error("Token is required"));
    }

    // Hash the provided token for comparison
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("Hashed token when verifying:", hashedToken);

    const sql = `
      SELECT r.userId, u.email 
      FROM resetpasswordtoken r
      JOIN marketplaceusers u ON r.userId = u.id
      WHERE r.resetPasswordToken = ? 
      AND r.resetPasswordExpires > NOW()
    `;

    marketPlace.query(sql, [hashedToken], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length === 0) {
        return resolve(null);
      }
      resolve({
        userId: results[0].userId,
        email: results[0].email
      });
    });
  });
};

// Reset password
exports.resetPassword = (token, newPassword) => {
  return new Promise((resolve, reject) => {
    marketPlace.getConnection((err, connection) => {
      if (err) return reject(err);
      console.log("token--------", token);


      connection.beginTransaction(err => {
        if (err) {
          connection.release();
          return reject(err);
        }

        // First verify the token and get user info
        const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');

        console.log("Hashed token when resetting:", hashedToken);

        const getTokenSql = `
          SELECT userId FROM resetpasswordtoken 
          WHERE resetPasswordToken = ? 
          AND resetPasswordExpires > NOW()
        `;

        console.log("has", hashedToken);

        connection.query(getTokenSql, [hashedToken], (err, tokenResults) => {
          if (err || tokenResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              reject(err || new Error("Invalid or expired token"));
            });
          }

          const userId = tokenResults[0].userId;

          // Hash the new password
          bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                reject(err);
              });
            }

            // Update user password
            const updatePasswordSql = "UPDATE marketplaceusers SET password = ? WHERE id = ?";
            connection.query(updatePasswordSql, [hashedPassword, userId], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  reject(err);
                });
              }

              // Clear the reset token
              const clearTokenSql = `
                DELETE FROM resetpasswordtoken 
                WHERE userId = ?
              `;
              connection.query(clearTokenSql, [userId], (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                }

                connection.commit(err => {
                  connection.release();
                  if (err) {
                    return connection.rollback(() => {
                      reject(err);
                    });
                  }

                  resolve({
                    success: true,
                    message: "Password updated successfully"
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};


exports.getUserByPhoneNumber = (phoneNumber) => {
  console.log("Checking for user with phone number:", phoneNumber);
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE phoneNumber = ?";
    marketPlace.query(sql, [phoneNumber], (err, results) => {
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
    const sql = "SELECT title, firstName, lastName, email, phoneNumber,phoneCode,buyerType,companyName,phoneCode2,phoneNumber2,image FROM marketplaceusers WHERE id = ?";
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



// exports.editUserProfileDao = (id, user) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       UPDATE marketplaceusers 
//       SET title = ?, firstName = ?, lastName = ?, email = ?, phoneCode = ?, phoneNumber = ?, image = ?
//       WHERE id = ?`;

//     marketPlace.query(
//       sql,
//       [
//         user.title,
//         user.firstName,
//         user.lastName,
//         user.email,
//         user.phoneCode,
//         user.phoneNumber,
//         user.profilePicture,
//         id,
//       ],
//       (err, result) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//   });
// };
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
          console.error('Database Error:', err.message, err.stack); // Added for debugging
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

exports.checkEmailExists = (email, excludeUserId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM marketplaceusers WHERE email = ? AND id != ? LIMIT 1`;
    marketPlace.query(sql, [email, excludeUserId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};



exports.checkPhoneExists = (phoneCode, phoneNumber, excludeUserId = null) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT id FROM marketplaceusers WHERE phoneCode = ? AND phoneNumber = ?`;
    const params = [phoneCode, phoneNumber];

    if (excludeUserId) {
      sql += ` AND id != ?`;
      params.push(excludeUserId);
    }

    marketPlace.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};






// get billing details
exports.getBillingDetails = (userId) => {
  return new Promise((resolve, reject) => {
    const userSql = `SELECT id, title, firstName, lastName, phoneCode, phoneNumber, phoneCode2, phoneNumber2,buildingType,billingTitle,billingName
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

exports.getAllCities = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT DISTINCT city FROM deliverycharge ORDER BY city ASC`;
    collectionofficer.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results.map(row => row.city)); // return only city names
    });
  });
};





exports.saveOrUpdateBillingDetails = (userId, details) => {
  return new Promise((resolve, reject) => {
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

    const newPhone1 = details.phoneNumber;
    const newPhone2 = details.phoneNumber2 || '';

    // Step 1: Get current user's phones
    const getUserSql = `SELECT phoneNumber, phoneNumber2, buildingType FROM marketplaceusers WHERE id = ?`;
    marketPlace.query(getUserSql, [userId], (err, userResults) => {
      if (err) return reject(err);
      if (userResults.length === 0) return reject(new Error('User not found'));

      const current = userResults[0];
      const currentPhone1 = current.phoneNumber;
      const currentPhone2 = current.phoneNumber2;
      const buildingTypeBefore = current.buildingType?.toLowerCase() || '';
      const buildingTypeNow = details.buildingType.toLowerCase();

      // ✅ Self-conflict check
      if (newPhone1 && newPhone2 && newPhone1 === newPhone2) {
        return reject(new Error('Primary and secondary phone numbers must be different'));
      }

      // ✅ Prevent swapping own phone fields
      if (
        (newPhone1 !== currentPhone1 && newPhone1 === currentPhone2) ||
        (newPhone2 !== currentPhone2 && newPhone2 === currentPhone1)
      ) {
        return reject(new Error('Cannot reuse your own other phone number'));
      }

      // ✅ Build query only if numbers changed
      const conditions = [];
      const values = [];

      if (newPhone1 !== currentPhone1) {
        conditions.push('(phoneNumber = ? OR phoneNumber2 = ?)');
        values.push(newPhone1, newPhone1);
      }
      if (newPhone2 && newPhone2 !== currentPhone2) {
        conditions.push('(phoneNumber = ? OR phoneNumber2 = ?)');
        values.push(newPhone2, newPhone2);
      }

      // ✅ Define helpers BEFORE use
      const handleAddress = (type) => {
        if (type === 'house') {
          const check = `SELECT id FROM house WHERE customerId = ?`;
          marketPlace.query(check, [userId], (err, results) => {
            if (err) return reject(err);
            const values = [
              details.address.houseNo || '',
              details.address.streetName || '',
              details.address.city || '',
              userId,
            ];
            const sql = results.length > 0
              ? `UPDATE house SET houseNo=?, streetName=?, city=? WHERE customerId=?`
              : `INSERT INTO house (houseNo, streetName, city, customerId) VALUES (?, ?, ?, ?)`;
            marketPlace.query(sql, values, (err) => {
              if (err) return reject(err);
              return resolve({ status: true, message: 'Billing details saved successfully' });
            });
          });
        } else if (type === 'apartment') {
          const check = `SELECT id FROM apartment WHERE customerId = ?`;
          marketPlace.query(check, [userId], (err, results) => {
            if (err) return reject(err);
            const values = [
              details.address.buildingNo || '',
              details.address.buildingName || '',
              details.address.unitNo || '',
              details.address.floorNo || null,
              details.address.houseNo || '',
              details.address.streetName || '',
              details.address.city || '',
              userId,
            ];
            const sql = results.length > 0
              ? `UPDATE apartment SET buildingNo=?, buildingName=?, unitNo=?, floorNo=?, houseNo=?, streetName=?, city=? WHERE customerId=?`
              : `INSERT INTO apartment (buildingNo, buildingName, unitNo, floorNo, houseNo, streetName, city, customerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            marketPlace.query(sql, values, (err) => {
              if (err) return reject(err);
              return resolve({ status: true, message: 'Billing details saved successfully' });
            });
          });
        } else {
          const delHouse = `DELETE FROM house WHERE customerId = ?`;
          const delApt = `DELETE FROM apartment WHERE customerId = ?`;
          marketPlace.query(delHouse, [userId], (err) => {
            if (err) return reject(err);
            marketPlace.query(delApt, [userId], (err) => {
              if (err) return reject(err);
              return resolve({ status: true, message: 'User updated, but no address saved due to unknown building type' });
            });
          });
        }
      };

      const updateUser = () => {
        const updateSql = `
          UPDATE marketplaceusers 
          SET billingTitle=?, billingName=?, title=?, firstName=?, lastName=?, phoneCode=?, phoneNumber=?, phoneCode2=?, phoneNumber2=?, buildingType=? 
          WHERE id=?`;
        const updateValues = [
          details.billingTitle,
          details.billingName,
          details.title,
          details.firstName,
          details.lastName || '',
          details.phoneCode,
          newPhone1,
          details.phoneCode2 || '',
          newPhone2,
          buildingTypeNow,
          userId,
        ];

        marketPlace.query(updateSql, updateValues, (err) => {
          if (err) return reject(err);

          if (buildingTypeBefore && buildingTypeBefore !== buildingTypeNow) {
            const delSql =
              buildingTypeBefore === 'house'
                ? `DELETE FROM house WHERE customerId = ?`
                : `DELETE FROM apartment WHERE customerId = ?`;
            marketPlace.query(delSql, [userId], (err) => {
              if (err) return reject(err);
              return handleAddress(buildingTypeNow);
            });
          } else {
            return handleAddress(buildingTypeNow);
          }
        });
      };

      // 🔍 Only check phones if one or both changed
      if (conditions.length === 0) {
        return updateUser(); // No phone changes
      }

      const sql = `
        SELECT id FROM marketplaceusers
        WHERE id != ? AND (${conditions.join(' OR ')})
      `;
      marketPlace.query(sql, [userId, ...values], (err, results) => {
        if (err) return reject(err);
        if (results.length > 0) {
          return reject(new Error('Phone number(s) already in use by another user'));
        }
        return updateUser();
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



exports.createComplaint = async (userId, complaicategoryId, complain, images, refId) => {
  return new Promise((resolve, reject) => {
    if (!userId || !complaicategoryId || !complain) {
      return reject({
        status: false,
        message: 'Missing required fields: userId, complaintCategoryId, or complaint.'
      });
    }

    const insertComplaintSql = `
      INSERT INTO marcketplacecomplain (userId, complaicategoryId, complain, refId, status)
      VALUES (?, ?, ?, ?, 'Opened')
    `;

    marketPlace.query(insertComplaintSql, [userId, complaicategoryId, complain, refId], (err, result) => {
      if (err) {
        return reject({
          status: false,
          message: 'Database error during complaint creation.',
          error: err.message
        });
      }

      const complainId = result.insertId;

      if (!images || images.length === 0) {
        return resolve({
          status: true,
          message: 'Complaint created successfully without images.',
          complainId
        });
      }

      const imageUrls = images.map(imageUrl => [complainId, imageUrl]);

      const insertImagesSql = `
        INSERT INTO marcketplacecomplainimages (complainId, image)
        VALUES ?
      `;

      marketPlace.query(insertImagesSql, [imageUrls], (err) => {
        if (err) {
          return reject({
            status: false,
            message: 'Database error during image insertion.',
            error: err.message
          });
        }

        resolve({
          status: true,
          message: 'Complaint and images created successfully.',
          complainId
        });
      });
    });
  });
};


exports.getComplaintById = async (complainId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.id,
        c.userId,
        c.complaiCategoryId, 
        cc.categoryEnglish AS categoryName,
        c.complain,
        c.createdAt,
        c.reply,
        c.status,
        ci.image
      FROM 
        marcketplacecomplain c 
      LEFT JOIN 
        marcketplacecomplainimages ci 
      ON 
        c.id = ci.complainId
      LEFT JOIN 
        agro_world_admin.complaincategory cc 
      ON 
        c.complaiCategoryId = cc.id
      WHERE 
        c.id = ?
    `;

    marketPlace.query(sql, [complainId], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return reject({
          status: false,
          message: 'Database error during complaint retrieval.',
          error: err.message,
        });
      }

      if (results.length === 0) {
        return resolve({
          status: false,
          message: 'No complaint found for the given ID.',
        });
      }

      const complaintInfo = {
        id: results[0].id,
        userId: results[0].userId,
        complaiCategoryId: results[0].complaiCategoryId,
        categoryName: results[0].categoryName,
        complain: results[0].complain,
        createdAt: results[0].createdAt,
        reply: results[0].reply,
        status: results[0].status,
        images: results.map(row => row.image).filter(Boolean)
      };

      resolve({
        status: true,
        message: 'Complaint retrieved successfully.',
        data: complaintInfo
      });
    });
  });
};



exports.getComplaintsByUserId = async (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        refId AS complainId,  -- Concatenated complainId
        c.id,
        c.userId,
        c.complaiCategoryId,
        cc.categoryEnglish AS categoryName,
        c.complain,
        c.createdAt,
        c.reply,
        c.status,
        ci.image,
        u.firstName AS customerName
      FROM 
        marcketplacecomplain c 
      LEFT JOIN 
        marcketplacecomplainimages ci 
      ON 
        c.id = ci.complainId
      LEFT JOIN 
        marketplaceusers u 
      ON 
        c.userId = u.id
      LEFT JOIN 
        agro_world_admin.complaincategory cc 
      ON 
        c.complaiCategoryId = cc.id
      WHERE 
        c.userId = ?
      ORDER BY 
        c.id
    `;

    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return reject({
          status: false,
          message: 'Database error during complaints retrieval.',
          error: err.message,
        });
      }

      if (results.length === 0) {
        return resolve({
          status: false,
          message: 'No complaints found for the given user ID.',
        });
      }

      // Group results by complaint ID (actual DB id) to handle multiple images
      const complaintsMap = {};
      results.forEach(row => {
        if (!complaintsMap[row.id]) {
          complaintsMap[row.id] = {
            complainId: row.complainId, // This now has refId + id
            userId: row.userId,
            complaiCategoryId: row.complaiCategoryId,
            categoryName: row.categoryName,
            complain: row.complain,
            createdAt: row.createdAt,
            reply: row.reply,
            status: row.status,
            images: [],
            customerName: row.customerName
          };
        }
        if (row.image) {
          complaintsMap[row.id].images.push(row.image);
        }
      });

      const complaints = Object.values(complaintsMap);

      resolve({
        status: true,
        message: 'Complaints retrieved successfully.',
        data: complaints
      });
    });
  });
};


exports.getCategoryEnglishByAppId = (appId = 3) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT cc.id, cc.categoryEnglish
      FROM agro_world_admin.complaincategory cc
      JOIN agro_world_admin.systemapplications sa ON cc.appId = sa.id
      WHERE sa.id = ?
    `;

    marketPlace.query(sql, [appId], (err, results) => {
      if (err) {
        console.error('SQL error in getCategoryEnglishByAppId:', err);
        return reject({
          status: false,
          message: 'Database error during fetching categoryEnglish by appId.',
          error: err.message,
        });
      }

      resolve({
        status: true,
        data: results,
      });
    });
  });
};


exports.getMarketPlaceUserLastCusIdDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT cusId
      FROM marketplaceusers
      WHERE cusId LIKE 'MAR-%'
      ORDER BY CAST(SUBSTRING(cusId, 5) AS UNSIGNED) DESC
      LIMIT 1
    `;
    marketPlace.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].cusId : null);
    });
  });
};

exports.getComplainLastCusIdDao = (cusId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT refId
      FROM marcketplacecomplain
      WHERE refId LIKE '${cusId}%'
      ORDER BY CAST(SUBSTRING(refId, LENGTH('${cusId}') + 1) AS UNSIGNED) DESC
      LIMIT 1
    `;
    marketPlace.query(sql, (err, results) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        resolve(results[0] ? results[0].refId : null);
      }
    });
  });
};


exports.getCartPackageInfoDao = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(MP.productPrice) + SUM(MP.packingFee) + SUM(MP.serviceFee) AS price, COUNT(MP.id) AS count
      FROM cart C, cartpackage CP, marketplacepackages MP
      WHERE C.userId = ? AND C.id = CP.cartId AND CP.packageId = MP.id
    `;
    marketPlace.query(sql,[id], (err, results) => {
      if (err){
        console.log(err);
        return reject(err);
      }else{
        let packObj = {
          price:0.0,
          count:0
        }
        if(results.length !== 0){
          if(results[0].price === null){
            results[0].price = 0.0;
          }
          packObj.price = results[0].price
          packObj.count = results[0].count
        }
        console.log("packObj", packObj);
             
        resolve(packObj);
      }
      
    });
  });
};

exports.getCartAdditionalInfoDao = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        SUM(
          CASE 
            WHEN AI.unit = 'g' THEN MPI.discountedPrice * (AI.qty / 1000)
            ELSE MPI.discountedPrice * AI.qty
          END
        ) AS price, 
        COUNT(MPI.id) AS count
      FROM cart C, cartadditionalitems AI, marketplaceitems MPI
      WHERE C.userId = ? AND C.id = AI.cartId AND AI.productId = MPI.id
    `;
    marketPlace.query(sql,[id], (err, results) => {
      if (err){
        console.log(err);
        return reject(err);
      }else{
        let itemObj = {
          price:0.0,
          count:0
        }
        if(results.length !== 0){
          if(results[0].price === null){
            results[0].price = 0.0;
          }
          itemObj.price = results[0].price || 0.0;
          itemObj.count = results[0].count;
        }      
        console.log("itemObj", itemObj);
          
        resolve(itemObj);
      }
    });
  });
};