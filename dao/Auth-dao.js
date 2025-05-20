const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');
// Reset password with token
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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


exports.signupUser = (user, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (title, firstName, lastName, phoneCode, phoneNumber, buyerType, email, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.title,
      user.firstName,
      user.lastName,
      user.phoneCode,
      user.phoneNumber,
      user.buyerType,  // ← make sure this aligns with frontend `accountType`
      user.email,
      hashedPassword
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

// Update user password by email
// exports.updateUserPasswordByEmail = (email, hashedPassword) => {
//   return new Promise((resolve, reject) => {
//     const sql = "UPDATE marketplaceusers SET password = ? WHERE email = ?";
//     marketPlace.query(sql, [hashedPassword, email], (err, results) => {
//       if (err) {
//         console.error('Error updating password:', err);
//         reject(err);
//       } else {
//         resolve(results.affectedRows > 0);
//       }
//     });
//   });
// };

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
      console.log("token--------",token);
      

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
        
        console.log("has",hashedToken);
        
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