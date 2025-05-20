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
        SELECT pd.id, pd.packageId, pd.quantity, pd.quantityType, mpi.displayName, pd.mpItemId
        FROM packagedetails pd
        LEFT JOIN marketplaceitems mpi ON pd.mpItemId = mpi.id
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

exports.packageAddToCartDao = (packageItems, userId) => {
  return new Promise(async (resolve, reject) => {
    // Get a connection from the pool
    marketPlace.getConnection(async (err, connection) => {
      if (err) {
        return reject(err);
      }

      try {
        // Begin transaction
        await new Promise((resolve, reject) => {
          connection.beginTransaction((err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        // Prepare SQL statement
        const sql = `
          INSERT INTO retailcart (userId, packageId, packageItemId, productId, unit, qty)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Execute all inserts as part of the transaction
        const insertPromises = packageItems.map((item) => {
          return new Promise((resolveInsert, rejectInsert) => {
            connection.query(
              sql,
              [
                userId,
                item.packageId,
                item.id, // packageItemId
                item.mpItemId, // productId
                item.quantityType,
                item.quantity,
              ],
              (err, results) => {
                if (err) {
                  rejectInsert(err);
                } else {
                  resolveInsert(results);
                }
              }
            );
          });
        });

        // Wait for all inserts to complete
        await Promise.all(insertPromises);

        // Commit transaction
        await new Promise((resolve, reject) => {
          connection.commit((err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });

        // Release connection back to the pool
        connection.release();

        resolve({
          success: true,
          message: "All items added to cart successfully",
        });
      } catch (error) {
        // Rollback on any error
        await new Promise((resolve) => {
          connection.rollback(() => {
            connection.release();
            resolve();
          });
        });
        reject(error);
      }
    });
  });
};

exports.chackPackageCartDao = (packageId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id
        FROM retailcart
        WHERE userId = ? AND packageId = ?
        `;
    marketPlace.query(sql, [userId, packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.chackProductCartDao = (productId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id
        FROM retailcart
        WHERE userId = ? AND productId = ?
        `;
    marketPlace.query(sql, [userId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.addProductCartDao = (product, cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
          INSERT INTO retailadditionalitems (cartId, productId, unit, qty)
          VALUES (?, ?, ?, ?)
        `;
    marketPlace.query(
      sql,
      [cartId, product.mpItemId, product.quantityType, product.quantity],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
};

// exports.addProductCartDao = (product, userId) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//           INSERT INTO retailcart (userId, isPackage, isAditional)
//           VALUES (?, ?, ?)
//         `;
//     const isPackage = product.isPackage || 0;
//     const isAditional = product.isAditional || 1;

//     marketPlace.query(sql, [userId, isPackage, isAditional], (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(results);
//       }
//     });
//   });
// };

exports.getProductTypeCountDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS total, CG.category
        FROM marketplaceitems MPI, plant_care.cropvariety CV, plant_care.cropgroup CG
        WHERE MPI.varietyId = CV.id AND CV.cropGroupId = CG.id
        GROUP BY CG.category
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

exports.getCategoryCountsDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.category,
        COUNT(m.id) as itemCount
      FROM marketplaceitems m
      JOIN plant_care.cropvariety v ON m.varietyId = v.id
      JOIN plant_care.cropgroup c ON v.cropGroupId = c.id
      WHERE m.category = 'Retail'
      GROUP BY c.category
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

exports.getAllSlidesDao = () => {
  return new Promise((resolve, reject) => {
    marketPlace.query(
      "SELECT * FROM banners WHERE type = 'retail' ORDER BY createdAt DESC",
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

exports.addSlideDao = (slide) => {
  return new Promise((resolve, reject) => {
    const sql =
      "INSERT INTO banners (imageUrl, title, description) VALUES (?, ?, ?)";
    marketPlace.query(
      sql,
      [slide.imageUrl, slide.title, slide.description],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

exports.deleteSlideDao = (id) => {
  return new Promise((resolve, reject) => {
    marketPlace.query(
      "DELETE FROM banners WHERE id = ?",
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

exports.getUserCartIdDao = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id
        FROM retailcart
        WHERE userId = ?
        `;
    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.updateAditionalItemsUserCartDao = (cartId, isAditional) => {
  return new Promise((resolve, reject) => {
    console.log(cartId, isAditional);

    const sql = `
        UPDATE retailcart 
        SET isAditional  = ? 
        WHERE id = ?
        `;
    marketPlace.query(sql, [isAditional, cartId], (err, results) => {
      if (err) {
        console.log(err);

        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.createCartDao = (userId, isPackage, isAditional) => {
  return new Promise((resolve, reject) => {
    const sql = `
        INSERT INTO retailcart (userId, isPackage, isAditional) 
        VALUES (?, ?, ?)
        `;
    marketPlace.query(sql, [userId, isPackage, isAditional], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
