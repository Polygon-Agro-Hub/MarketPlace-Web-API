const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");

// Reset password with token
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { uploadFileToS3 } = require("../middlewares/s3upload"); // adjust path as needed
const { deleteFromS3 } = require("../middlewares/s3delete");

// DAO function for email login
exports.userLoginByEmail = (email, buyerType) => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT * FROM marketplaceusers WHERE email = ? AND buyerType = ?";

    console.log("Email Login Query:", sql);
    console.log("Email Login Parameters:", [email, buyerType]);

    marketPlace.query(sql, [email, buyerType], (err, results) => {
      if (err) {
        console.error("Database query error (email):", err);
        reject(err);
      } else {
        console.log("Email login results count:", results.length);
        resolve(results && results.length > 0 ? results[0] : null);
      }
    });
  });
};

// DAO function for phone number login
exports.userLoginByPhone = (phoneNumber, buyerType) => {
  return new Promise((resolve, reject) => {
    // First try to find by phone number
    const sql =
      "SELECT * FROM marketplaceusers WHERE CONCAT(phoneCode, phoneNumber) = ? AND buyerType = ?";

    console.log("Phone Login Query:", sql);
    console.log("Phone Login Parameters:", [phoneNumber, buyerType]);

    marketPlace.query(sql, [phoneNumber, buyerType], (err, results) => {
      if (err) {
        console.error("Database query error (phone):", err);
        reject(err);
      } else {
        console.log("Phone login results count:", results.length);

        if (results && results.length > 0) {
          const user = results[0];
          console.log("Found user by phone:", {
            id: user.id,
            email: user.email,
            phoneCode: user.phoneCode,
            phoneNumber: user.phoneNumber,
            hasPassword: user.password !== null,
          });

          // If this user has no password but has an email, try to find the email record
          if (!user.password && user.email) {
            console.log("Phone user has no password, checking email record...");

            const emailSql =
              "SELECT * FROM marketplaceusers WHERE email = ? AND buyerType = ? AND password IS NOT NULL";
            marketPlace.query(
              emailSql,
              [user.email, buyerType],
              (emailErr, emailResults) => {
                if (emailErr) {
                  reject(emailErr);
                } else if (emailResults && emailResults.length > 0) {
                  console.log(
                    "Found email record with password, using that instead",
                  );
                  resolve(emailResults[0]);
                } else {
                  console.log("No email record found with password");
                  resolve(user);
                }
              },
            );
          } else {
            resolve(user);
          }
        } else {
          resolve(null);
        }
      }
    });
  });
};

exports.signupUser = (user, hashedPassword, nextId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (title, firstName, lastName, phoneCode, phoneNumber, phoneCode2, phoneNumber2, buyerType, email, password, isMarketPlaceUser, isSubscribe, companyName, companyPhoneCode, companyPhone, cusId, nearesCity) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      nextId,
      user.city || null, 
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject({
          status: false,
          message: "Database error during user signup.",
          error: err,
        });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: "User registered successfully.",
          data: { userId: results.insertId },
        });
      } else {
        reject({
          status: false,
          message: "User registration failed, no rows affected.",
        });
      }
    });
  });
};

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
        console.error("Error getting user by Google ID:", err);
        reject({ status: false, message: "Database error", error: err });
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
      "regular",
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error("Error creating Google user:", err);
        reject({ status: false, message: "Database error", error: err });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: "User registered successfully with Google",
          data: { userId: results.insertId },
        });
      } else {
        resolve({
          status: false,
          message: "Failed to register user with Google",
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
        const resetToken = crypto.randomBytes(32).toString("hex");
        console.log("Generated token:", resetToken);
        // Set token expiry (3 minutes from now)
        const resetTokenExpiry = new Date(Date.now() + 180000); // 3 minutes = 180000 milliseconds

        // Hash the token for security before storing it
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        console.log("Hashed token when creating :", hashedToken);

        if (tokenResults.length > 0) {
          // Token exists - update it
          const updateSql = `
            UPDATE resetpasswordtoken 
            SET resetPasswordToken = ?, resetPasswordExpires = ?
            WHERE userId = ?
          `;

          marketPlace.query(
            updateSql,
            [hashedToken, resetTokenExpiry, userId],
            (err) => {
              if (err) {
                return reject(err);
              }
              resolve(resetToken);
            },
          );
        } else {
          // No token exists - insert new one
          const insertSql = `
            INSERT INTO resetpasswordtoken 
            (userId, resetPasswordToken, resetPasswordExpires) 
            VALUES (?, ?, ?)
          `;

          marketPlace.query(
            insertSql,
            [userId, hashedToken, resetTokenExpiry],
            (err) => {
              if (err) {
                return reject(err);
              }
              resolve(resetToken);
            },
          );
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
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("Hashed token when verifying:", hashedToken);

    // First check if token exists
    const checkTokenSql = `
      SELECT r.userId, u.email, r.resetPasswordExpires
      FROM resetpasswordtoken r
      JOIN marketplaceusers u ON r.userId = u.id
      WHERE r.resetPasswordToken = ?
    `;

    marketPlace.query(checkTokenSql, [hashedToken], (err, results) => {
      if (err) {
        return reject(err);
      }
      
      if (results.length === 0) {
        // Token doesn't exist at all
        return resolve(null);
      }

      // Token exists, now check if it's expired
      const tokenData = results[0];
      const expiryDate = new Date(tokenData.resetPasswordExpires);
      const now = new Date();

      if (expiryDate <= now) {
        // Token exists but is expired
        return reject(new Error("EXPIRED_TOKEN"));
      }

      // Token is valid and not expired
      resolve({
        userId: tokenData.userId,
        email: tokenData.email,
      });
    });
  });
};

// Reset password
exports.resetPassword = (token, newPassword) => {
  return new Promise((resolve, reject) => {
    marketPlace.getConnection((err, connection) => {
      if (err) return reject(err);

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return reject(err);
        }

        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

        // First check if token exists
        const checkTokenSql = `
          SELECT userId, resetPasswordExpires 
          FROM resetpasswordtoken
          WHERE resetPasswordToken = ?
        `;

        connection.query(checkTokenSql, [hashedToken], (err, tokenResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              reject(err);
            });
          }

          if (tokenResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              reject(new Error("Invalid token"));
            });
          }

          // Token exists, now check if it's expired
          const tokenData = tokenResults[0];
          const expiryDate = new Date(tokenData.resetPasswordExpires);
          const now = new Date();

          if (expiryDate <= now) {
            return connection.rollback(() => {
              connection.release();
              reject(new Error("EXPIRED_TOKEN"));
            });
          }

          const userId = tokenData.userId;

          const getUserSql =
            "SELECT password FROM marketplaceusers WHERE id = ?";

          connection.query(getUserSql, [userId], (err, userResults) => {
            if (err || userResults.length === 0) {
              return connection.rollback(() => {
                connection.release();
                reject(err || new Error("User not found"));
              });
            }

            const currentHashedPassword = userResults[0].password;

            bcrypt.compare(
              newPassword,
              currentHashedPassword,
              (err, isMatch) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                }

                if (isMatch) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(
                      new Error(
                        "New password cannot be the same as current password",
                      ),
                    );
                  });
                }

                bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(err);
                    });
                  }

                  const updatePasswordSql =
                    "UPDATE marketplaceusers SET password = ? WHERE id = ?";

                  connection.query(
                    updatePasswordSql,
                    [hashedPassword, userId],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          reject(err);
                        });
                      }

                      const clearTokenSql =
                        "DELETE FROM resetpasswordtoken WHERE userId = ?";

                      connection.query(clearTokenSql, [userId], (err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            reject(err);
                          });
                        }

                        connection.commit((err) => {
                          connection.release();

                          if (err) {
                            return connection.rollback(() => reject(err));
                          }

                          resolve({
                            success: true,
                            message: "Password updated successfully",
                          });
                        });
                      });
                    },
                  );
                });
              },
            );
          });
        });
      });
    });
  });
};

// Add this method to your athDao file
exports.getUserByPhoneNumber = (phoneNumber, phoneCode) => {
  console.log(
    "Checking for user with phone number:",
    phoneNumber,
    "and phone code:",
    phoneCode,
  );
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT * FROM marketplaceusers WHERE phoneNumber = ? AND phoneCode = ?";
    marketPlace.query(sql, [phoneNumber, phoneCode], (err, results) => {
      if (err) {
        console.error("Database error in getUserByPhoneNumber:", err);
        reject({
          status: false,
          message: "Database error while checking phone number",
          error: err.message,
        });
      } else {
        console.log("Phone number query results:", results);
        resolve(results[0] || null);
      }
    });
  });
};

exports.updatePasswordByPhoneNumber = (phoneNumber, newPassword) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT password FROM marketplaceusers WHERE phoneNumber = ?";

    marketPlace.query(sql, [phoneNumber], async (err, results) => {
      try {
        if (err) return reject(err);

        if (results.length === 0) {
          return resolve({
            status: false,
            message: "User not found",
          });
        }

        const currentHashedPassword = results[0].password;

        const isSame = await bcrypt.compare(newPassword, currentHashedPassword);

        if (isSame) {
          return resolve({
            status: false,
            message: "New password cannot be the same as current password",
          });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateSql =
          "UPDATE marketplaceusers SET password=? WHERE phoneNumber=?";

        marketPlace.query(
          updateSql,
          [hashedPassword, phoneNumber],
          (err, result) => {
            if (err) return reject(err);

            resolve({
              status: true,
              message: "Password reset successfully",
            });
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  });
};

exports.getUserByPhoneNumberAuth = (phoneNumber) => {
  console.log("Checking for user with phone number:", phoneNumber);
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE phoneNumber = ?";
    marketPlace.query(sql, [phoneNumber], (err, results) => {
      if (err) {
        console.error("Database error in getUserByPhoneNumber:", err);
        reject({
          status: false,
          message: "Database error while checking phone number",
          error: err.message,
        });
      } else {
        console.log("Phone number query results:", results);
        resolve(results[0] || null);
      }
    });
  });
};

exports.getUserProfileDao = (id) => {
  return new Promise((resolve, reject) => {
    // const sql = "SELECT * FROM marketplaceusers WHERE id = ?";
    const sql =
      "SELECT title, firstName, lastName, email, phoneNumber,phoneCode,buyerType,companyName,phoneCode2,phoneNumber2,companyPhoneCode,companyPhone,image FROM marketplaceusers WHERE id = ?";
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

        const isMatch = await bcrypt.compare(
          currentPassword,
          storedHashedPassword,
        );
        if (!isMatch) return reject(new Error("Current password is incorrect"));

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateSql =
          "UPDATE marketplaceusers SET password = ? WHERE id = ?";
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

exports.editUserProfileDao = (id, user, buyerType) => {
  return new Promise((resolve, reject) => {
    let sql, params;

    if (buyerType === "Wholesale") {
      // Update for wholesale users (includes company fields and secondary phone)
      sql = `
        UPDATE marketplaceusers 
        SET title = ?, firstName = ?, lastName = ?, email = ?, phoneCode = ?, phoneNumber = ?, 
            companyName = ?, companyPhoneCode = ?, companyPhone = ?, 
            phoneCode2 = ?, phoneNumber2 = ?, image = ?
        WHERE id = ?`;

      params = [
        user.title,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneCode,
        user.phoneNumber,
        user.companyName,
        user.companyPhoneCode,
        user.companyPhone,
        user.phoneCode2,
        user.phoneNumber2,
        user.image,
        id,
      ];
    } else {
      // Update for retail users (basic fields only)
      sql = `
        UPDATE marketplaceusers 
        SET title = ?, firstName = ?, lastName = ?, email = ?, phoneCode = ?, phoneNumber = ?, image = ?
        WHERE id = ?`;

      params = [
        user.title,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneCode,
        user.phoneNumber,
        user.image,
        id,
      ];
    }

    marketPlace.query(sql, params, (err, result) => {
      if (err) {
        console.error("Database Error:", err.message, err.stack);
        reject(err);
      } else {
        resolve(result);
      }
    });
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
    const userSql = `SELECT id, title, firstName, lastName, billingPhoneCode1 as phoneCode, billingPhone1 as phoneNumber, billingPhoneCode2 as phoneCode2, billingPhone2 as phoneNumber2, buildingType, billingTitle, billingName, longitude, latitude
                     FROM marketplaceusers WHERE id = ?`;

    marketPlace.query(userSql, [userId], (err, userResults) => {
      if (err) return reject(err);
      if (userResults.length === 0) return resolve(null);

      const user = userResults[0];
      const buildingType = user.buildingType;
      const userData = {
        ...user,
        geoLatitude: user.latitude,
        geoLongitude: user.longitude,
      };

      if (buildingType === "House") {
        const houseSql = `SELECT houseNo, streetName, city FROM house WHERE customerId = ?`;
        marketPlace.query(houseSql, [userId], (err, houseResults) => {
          if (err) return reject(err);
          resolve({
            ...userData,
            address: {
              ...(houseResults[0] || {}),
              geoLatitude: user.latitude,
              geoLongitude: user.longitude,
            },
          });
        });
      } else if (buildingType === "Apartment") {
        const aptSql = `SELECT buildingNo, buildingName, unitNo, floorNo, houseNo, streetName, city 
                        FROM apartment WHERE customerId = ?`;
        marketPlace.query(aptSql, [userId], (err, aptResults) => {
          if (err) return reject(err);
          resolve({
            ...userData,
            address: {
              ...(aptResults[0] || {}),
              geoLatitude: user.latitude,
              geoLongitude: user.longitude,
            },
          });
        });
      } else {
        resolve(userData);
      }
    });
  });
};

exports.getAllCities = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT d.city
      FROM centerowncity c
      JOIN deliverycharge d ON c.cityId = d.id
      ORDER BY d.city ASC;`;
    collectionofficer.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results.map((row) => row.city)); // return only city names
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
      return reject(new Error("Required fields are missing"));
    }

    const newPhone1 = details.phoneNumber;
    const newPhone2 = details.phoneNumber2 || "";

    // Step 1: Get current user's phones
    const getUserSql = `SELECT billingPhone1 as phoneNumber, billingPhone2 as phoneNumber2, buildingType FROM marketplaceusers WHERE id = ?`;
    marketPlace.query(getUserSql, [userId], (err, userResults) => {
      if (err) return reject(err);
      if (userResults.length === 0) return reject(new Error("User not found"));

      const current = userResults[0];
      const currentPhone1 = current.phoneNumber;
      const currentPhone2 = current.phoneNumber2 || "";
      const buildingTypeBefore = current.buildingType || "";

      // Normalize building type to capitalized first letter format
      const buildingTypeNow =
        details.buildingType.toLowerCase() === "house"
          ? "House"
          : details.buildingType.toLowerCase() === "apartment"
            ? "Apartment"
            : details.buildingType;

      // Self-conflict check
      if (newPhone1 && newPhone2 && newPhone1 === newPhone2) {
        return reject(
          new Error("Primary and secondary phone numbers must be different"),
        );
      }

      // Prevent swapping own phone fields
      if (
        (newPhone1 !== currentPhone1 && newPhone1 === currentPhone2) ||
        (newPhone2 !== currentPhone2 && newPhone2 === currentPhone1)
      ) {
        return reject(new Error("Cannot reuse your own other phone number"));
      }

      // Build query only if numbers changed
      const conditions = [];
      const values = [];

      if (newPhone1 !== currentPhone1) {
        conditions.push("(billingPhone1 = ? OR billingPhone2 = ?)");
        values.push(newPhone1, newPhone1);
      }
      if (newPhone2 && newPhone2 !== currentPhone2) {
        conditions.push("(billingPhone1 = ? OR billingPhone2 = ?)");
        values.push(newPhone2, newPhone2);
      }

      // Define helpers BEFORE use
      const handleAddress = (type) => {
        if (type === "House") {
          const check = `SELECT id FROM house WHERE customerId = ?`;
          marketPlace.query(check, [userId], (err, results) => {
            if (err) return reject(err);
            const values = [
              details.address.houseNo || "",
              details.address.streetName || "",
              details.address.city || "",
              userId,
            ];
            const sql =
              results.length > 0
                ? `UPDATE house SET houseNo=?, streetName=?, city=? WHERE customerId=?`
                : `INSERT INTO house (houseNo, streetName, city, customerId) VALUES (?, ?, ?, ?)`;
            marketPlace.query(sql, values, (err) => {
              if (err) return reject(err);
              return resolve({
                status: true,
                message: "Billing details saved successfully",
              });
            });
          });
        } else if (type === "Apartment") {
          const check = `SELECT id FROM apartment WHERE customerId = ?`;
          marketPlace.query(check, [userId], (err, results) => {
            if (err) return reject(err);
            const values = [
              details.address.buildingNo || "",
              details.address.buildingName || "",
              details.address.unitNo || "",
              details.address.floorNo || null,
              details.address.houseNo || "",
              details.address.streetName || "",
              details.address.city || "",
              userId,
            ];
            const sql =
              results.length > 0
                ? `UPDATE apartment SET buildingNo=?, buildingName=?, unitNo=?, floorNo=?, houseNo=?, streetName=?, city=? WHERE customerId=?`
                : `INSERT INTO apartment (buildingNo, buildingName, unitNo, floorNo, houseNo, streetName, city, customerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            marketPlace.query(sql, values, (err) => {
              if (err) return reject(err);
              return resolve({
                status: true,
                message: "Billing details saved successfully",
              });
            });
          });
        } else {
          const delHouse = `DELETE FROM house WHERE customerId = ?`;
          const delApt = `DELETE FROM apartment WHERE customerId = ?`;
          marketPlace.query(delHouse, [userId], (err) => {
            if (err) return reject(err);
            marketPlace.query(delApt, [userId], (err) => {
              if (err) return reject(err);
              return resolve({
                status: true,
                message:
                  "User updated, but no address saved due to unknown building type",
              });
            });
          });
        }
      };

      const updateUser = () => {
        const updateSql = `
          UPDATE marketplaceusers 
          SET billingTitle=?, billingName=?, title=?, firstName=?, lastName=?, billingPhoneCode1=?, billingPhone1=?, billingPhoneCode2=?, billingPhone2=?, buildingType=?, latitude=?, longitude=? 
          WHERE id=?`;
        const updateValues = [
          details.billingTitle,
          details.billingName,
          details.title,
          details.firstName,
          details.lastName || "",
          details.phoneCode,
          newPhone1,
          details.phoneCode2 || "",
          newPhone2,
          buildingTypeNow,
          details.address.geoLatitude || null,
          details.address.geoLongitude || null,
          userId,
        ];

        marketPlace.query(updateSql, updateValues, (err) => {
          if (err) return reject(err);

          if (buildingTypeBefore && buildingTypeBefore !== buildingTypeNow) {
            const delSql =
              buildingTypeBefore === "House"
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

      // Only check phones if one or both changed
      if (conditions.length === 0) {
        return updateUser(); // No phone changes
      }

      const sql = `
        SELECT id FROM marketplaceusers
        WHERE id != ? AND (${conditions.join(" OR ")})
      `;
      marketPlace.query(sql, [userId, ...values], (err, results) => {
        if (err) return reject(err);
        if (results.length > 0) {
          return reject(
            new Error("Phone number(s) already in use by another user"),
          );
        }
        return updateUser();
      });
    });
  });
};

exports.unsubscribeUser = (email, action) => {
  return new Promise((resolve, reject) => {
    if (!["unsubscribe", "stay"].includes(action)) {
      return reject({
        status: false,
        message: 'Invalid action. Must be "unsubscribe" or "stay".',
      });
    }

    const isSubscribe = action === "unsubscribe" ? 0 : 1;
    const sql = `
      UPDATE marketplaceusers 
      SET isSubscribe = ?
      WHERE email = ?
    `;

    marketPlace.query(sql, [isSubscribe, email], (err, results) => {
      if (err) {
        return reject({
          status: false,
          message: "Database error during subscription update.",
          error: err,
        });
      }

      if (results.affectedRows === 0) {
        return reject({
          status: false,
          message: "No user found with this email.",
        });
      }

      resolve({
        status: true,
        message:
          action === "unsubscribe"
            ? "Successfully unsubscribed from promotional emails."
            : "Successfully maintained subscription.",
      });
    });
  });
};

exports.createComplaint = async (
  userId,
  complaicategoryId,
  complain,
  images,
  refId,
) => {
  return new Promise((resolve, reject) => {
    if (!userId || !complaicategoryId || !complain) {
      return reject({
        status: false,
        message:
          "Missing required fields: userId, complaintCategoryId, or complaint.",
      });
    }

    const insertComplaintSql = `
      INSERT INTO marcketplacecomplain (userId, complaicategoryId, complain, refId, status)
      VALUES (?, ?, ?, ?, 'Opened')
    `;

    marketPlace.query(
      insertComplaintSql,
      [userId, complaicategoryId, complain, refId],
      (err, result) => {
        if (err) {
          return reject({
            status: false,
            message: "Database error during complaint creation.",
            error: err.message,
          });
        }

        const complainId = result.insertId;

        if (!images || images.length === 0) {
          return resolve({
            status: true,
            message: "Complaint created successfully without images.",
            complainId,
          });
        }

        const imageUrls = images.map((imageUrl) => [complainId, imageUrl]);

        const insertImagesSql = `
        INSERT INTO marcketplacecomplainimages (complainId, image)
        VALUES ?
      `;

        marketPlace.query(insertImagesSql, [imageUrls], (err) => {
          if (err) {
            return reject({
              status: false,
              message: "Database error during image insertion.",
              error: err.message,
            });
          }

          resolve({
            status: true,
            message: "Complaint and images created successfully.",
            complainId,
          });
        });
      },
    );
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
        console.error("Database query error:", err);
        return reject({
          status: false,
          message: "Database error during complaint retrieval.",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return resolve({
          status: false,
          message: "No complaint found for the given ID.",
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
        images: results.map((row) => row.image).filter(Boolean),
      };

      resolve({
        status: true,
        message: "Complaint retrieved successfully.",
        data: complaintInfo,
      });
    });
  });
};

exports.getComplaintsByUserId = async (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        refId AS complainId,
        c.id,
        c.userId,
        c.complaiCategoryId,
        cc.categoryEnglish AS categoryName,
        c.complain,
        c.createdAt,
        c.reply,
        c.status,
        ci.image,
        c.replyTime,
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
        console.error("Database query error:", err);
        return reject({
          status: false,
          message: "Database error during complaints retrieval.",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return resolve({
          status: false,
          message: "No complaints found for the given user ID.",
        });
      }

      // Group results by complaint ID (actual DB id) to handle multiple images
      const complaintsMap = {};
      results.forEach((row) => {
        if (!complaintsMap[row.id]) {
          complaintsMap[row.id] = {
            complainId: row.complainId,
            userId: row.userId,
            complaiCategoryId: row.complaiCategoryId,
            categoryName: row.categoryName,
            complain: row.complain,
            createdAt: row.createdAt,
            reply: row.reply,
            replyTime: row.replyTime,
            status: row.status,
            images: [],
            customerName: row.customerName,
          };
        }
        if (row.image) {
          complaintsMap[row.id].images.push(row.image);
        }
      });

      const complaints = Object.values(complaintsMap);

      resolve({
        status: true,
        message: "Complaints retrieved successfully.",
        data: complaints,
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
        console.error("SQL error in getCategoryEnglishByAppId:", err);
        return reject({
          status: false,
          message: "Database error during fetching categoryEnglish by appId.",
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
      SELECT 
        SUM((MP.productPrice + MP.packingFee + MP.serviceFee) * CP.qty) AS price, 
        SUM(CP.qty) AS count
      FROM cart C, cartpackage CP, marketplacepackages MP
      WHERE C.userId = ? AND C.id = CP.cartId AND CP.packageId = MP.id
    `;
    marketPlace.query(sql, [id], (err, results) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        let packObj = {
          price: 0.0,
          count: 0,
        };
        if (results.length !== 0) {
          if (results[0].price === null) {
            results[0].price = 0.0;
          }
          packObj.price = results[0].price;
          packObj.count = results[0].count;
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
        COALESCE(SUM(
          CASE 
            WHEN AI.unit = 'g' THEN MPI.discountedPrice * (AI.qty / 1000)
            ELSE MPI.discountedPrice * AI.qty
          END
        ), 0) AS price, 
        COALESCE(COUNT(AI.id), 0) AS count
      FROM cart C
      LEFT JOIN cartadditionalitems AI ON C.id = AI.cartId
      LEFT JOIN marketplaceitems MPI ON AI.productId = MPI.id
      WHERE C.userId = ?
    `;
    marketPlace.query(sql, [id], (err, results) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        let itemObj = {
          price: 0.0,
          count: 0,
        };
        if (results.length !== 0) {
          itemObj.price = Number(results[0].price) || 0.0;
          itemObj.count = Number(results[0].count) || 0;
        }
        console.log("itemObj", itemObj);
        resolve(itemObj);
      }
    });
  });
};

exports.getUserCreditBalanceDao = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT creditBalance FROM marketplaceusers WHERE id = ? LIMIT 1';
    marketPlace.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || { creditBalance: 0 });
      console.log('User credit balance for userId', userId, ':', results[0] || { creditBalance: 0 });
    });
  });
};

exports.searchCitiesDao = (searchTerm) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        d.id,
        d.city,
        d.district,
        d.province,
        CASE WHEN MAX(c.id) IS NOT NULL THEN 1 ELSE 0 END AS isAvailable
      FROM deliverycharge d
      LEFT JOIN centerowncity c ON c.cityId = d.id
      WHERE d.city LIKE ?
      GROUP BY d.id, d.city, d.district, d.province
      ORDER BY isAvailable DESC, d.city ASC
      LIMIT 20
    `;
 
    const likeTerm = `%${searchTerm}%`;
 
    collectionofficer.query(sql, [likeTerm], (err, results) => {
      if (err) {
        console.error("Database error in searchCitiesDao:", err);
        return reject({
          status: false,
          message: "Database error while searching cities",
          error: err.message,
        });
      }
      resolve(results);
    });
  });
};
 

exports.getAllCitiesDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        d.id,
        d.city,
        d.district,
        d.province,
        CASE WHEN MAX(c.id) IS NOT NULL THEN 1 ELSE 0 END AS isAvailable
      FROM deliverycharge d
      LEFT JOIN centerowncity c ON c.cityId = d.id
      GROUP BY d.id, d.city, d.district, d.province
      ORDER BY d.city ASC
    `;
 
    collectionofficer.query(sql, (err, results) => {
      if (err) {
        console.error("Database error in getAllCitiesDao:", err);
        return reject({
          status: false,
          message: "Database error while fetching all cities",
          error: err.message,
        });
      }
      resolve(results);
    });
  });
};
 

exports.checkCityAvailabilityDao = (cityId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        d.id,
        d.city,
        d.district,
        d.province,
        CASE WHEN MAX(c.id) IS NOT NULL THEN 1 ELSE 0 END AS isAvailable
      FROM deliverycharge d
      LEFT JOIN centerowncity c ON c.cityId = d.id
      WHERE d.id = ?
      GROUP BY d.id, d.city, d.district, d.province
      LIMIT 1
    `;
 
    collectionofficer.query(sql, [cityId], (err, results) => {
      if (err) {
        console.error("Database error in checkCityAvailabilityDao:", err);
        return reject({
          status: false,
          message: "Database error while checking city availability",
          error: err.message,
        });
      }
 
      if (results.length === 0) {
        return resolve(null);
      }
 
      resolve(results[0]);
    });
  });
};

exports.saveEmailOtp = (referenceId, email, otp, expiresAt) => {
  return new Promise((resolve, reject) => {
    // Store OTP temporarily using a NULL userId (user doesn't exist yet during signup)
    const sql = `
      INSERT INTO resetpasswordtoken (userId, resetPasswordToken, otpCode, otpEmail, otpExpiresAt)
      VALUES (NULL, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        otpCode = VALUES(otpCode),
        otpEmail = VALUES(otpEmail),
        otpExpiresAt = VALUES(otpExpiresAt)
    `;
    marketPlace.query(sql, [referenceId, otp, email, expiresAt], (err, result) => {
      if (err) {
        console.error('saveEmailOtp DB error:', err);
        return reject(err);
      }
      console.log('✅ OTP saved to DB for email:', email, 'referenceId:', referenceId);
      resolve(result);
    });
  });
};

exports.getEmailOtp = (referenceId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT otpCode AS otp, otpExpiresAt AS expiresAt
                 FROM resetpasswordtoken
                 WHERE resetPasswordToken = ? LIMIT 1`;
    marketPlace.query(sql, [referenceId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

exports.deleteEmailOtp = (referenceId) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE resetpasswordtoken
                 SET otpCode = NULL, otpEmail = NULL, otpExpiresAt = NULL
                 WHERE resetPasswordToken = ?`;
    marketPlace.query(sql, [referenceId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

