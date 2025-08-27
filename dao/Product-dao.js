

const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");


exports.getProductsByCategoryDao = (category, search) => {
  return new Promise((resolve, reject) => {
    let sql = `
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
    
    const params = [category];
    
    if (search && search.trim() !== '') {
      sql += ` AND (m.displayName LIKE ? OR m.tags LIKE ?)`;
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam);
    }
    
    sql += ` ORDER BY m.displayName ASC`;
    
    marketPlace.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        // Format the results to handle discount price formatting and calculate discount percentage
        const formattedResults = results.map(item => {
          // Calculate discount percentage
          let discountPercentage = null;
          if (item.normalPrice && item.discountedPrice && item.normalPrice > item.discountedPrice) {
            const discount = ((item.normalPrice - item.discountedPrice) / item.normalPrice) * 100;
            // Format percentage: if whole number, show as integer; if decimal, show with decimals
            discountPercentage = discount % 1 === 0 ? Math.round(discount) : Math.round(discount * 100) / 100;
          }
          
          return {
            ...item,
            discountedPrice: item.discountedPrice % 1 === 0 
              ? parseInt(item.discountedPrice) 
              : item.discountedPrice,
            discount: discountPercentage
          };
        });
        resolve(formattedResults);
      }
    });
  });
};

// Updated DAO Function
exports.getProductsByCategoryDaoWholesale = (category, search) => {
  return new Promise((resolve, reject) => {
    let sql = `
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
      WHERE c.category = ? AND m.category = 'Wholesale'
    `;
    
    const params = [category];
    
    if (search && search.trim() !== '') {
      sql += ` AND (m.displayName LIKE ? OR m.tags LIKE ?)`;
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam);
    }
    
    sql += ` ORDER BY m.displayName ASC`;
    
    marketPlace.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.getAllProductDao = (search) => {
  return new Promise((resolve, reject) => {
    let sql = `
        SELECT mp.id, mp.displayName, mp.image, (mp.productPrice + mp.packingFee + mp.serviceFee) AS subTotal
        FROM marketplacepackages mp
        INNER JOIN definepackage dp ON mp.id = dp.packageId
        WHERE mp.status = 'Enabled' 
        AND mp.isValid = 1
        `;
    
    const params = [];
    
    if (search && search.trim() !== '') {
      sql += ` AND mp.displayName LIKE ?`;
      params.push(`%${search.trim()}%`);
    }
    
    sql += ` ORDER BY mp.displayName ASC`;
    
    marketPlace.query(sql, params, (err, results) => {
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
        SELECT 
            pd.id, 
            pd.packageId, 
            pd.qty as quantity, 
            pt.typeName as displayName,
            pt.shortCode,
            pd.productTypeId,
            pd.createdAt
        FROM packagedetails pd
        LEFT JOIN producttypes pt ON pd.productTypeId = pt.id
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

// exports.packageAddToCartDao = (packageItems, userId) => {
//   return new Promise(async (resolve, reject) => {
//     // Get a connection from the pool
//     marketPlace.getConnection(async (err, connection) => {
//       if (err) {
//         return reject(err);
//       }

//       try {
//         // Begin transaction
//         await new Promise((resolve, reject) => {
//           connection.beginTransaction((err) => {
//             if (err) return reject(err);
//             resolve();
//           });
//         });

//         // Prepare SQL statement
//         const sql = `
//           INSERT INTO retailcart (userId, packageId, packageItemId, productId, unit, qty)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `;

//         // Execute all inserts as part of the transaction
//         const insertPromises = packageItems.map((item) => {
//           return new Promise((resolveInsert, rejectInsert) => {
//             connection.query(
//               sql,
//               [
//                 userId,
//                 item.packageId,
//                 item.id, // packageItemId
//                 item.mpItemId, // productId
//                 item.quantityType,
//                 item.quantity,
//               ],
//               (err, results) => {
//                 if (err) {
//                   rejectInsert(err);
//                 } else {
//                   resolveInsert(results);
//                 }
//               }
//             );
//           });
//         });

//         // Wait for all inserts to complete
//         await Promise.all(insertPromises);

//         // Commit transaction
//         await new Promise((resolve, reject) => {
//           connection.commit((err) => {
//             if (err) {
//               return reject(err);
//             }
//             resolve();
//           });
//         });

//         // Release connection back to the pool
//         connection.release();

//         resolve({
//           success: true,
//           message: "All items added to cart successfully",
//         });
//       } catch (error) {
//         // Rollback on any error
//         await new Promise((resolve) => {
//           connection.rollback(() => {
//             connection.release();
//             resolve();
//           });
//         });
//         reject(error);
//       }
//     });
//   });
// };


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

exports.getCategoryCountsWholesaleDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.category,
        COUNT(m.id) as itemCount
      FROM marketplaceitems m
      JOIN plant_care.cropvariety v ON m.varietyId = v.id
      JOIN plant_care.cropgroup c ON v.cropGroupId = c.id
      WHERE m.category = 'Wholesale'
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
        FROM cart
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

exports.createCartDao = (userId, buyerType) => {
  return new Promise((resolve, reject) => {
    const sql = `
        INSERT INTO cart (userId, buyerType) 
        VALUES (?, ?)
        `;
    marketPlace.query(sql, [userId, buyerType], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.checkPackageInCartDao = (cartId, packageId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id, qty
        FROM cartpackage
        WHERE cartId = ? AND packageId = ?
        `;
    marketPlace.query(sql, [cartId, packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


exports.updatePackageQtyInCartDao = (cartId, packageId, qty) => {
  return new Promise((resolve, reject) => {
    const sql = `
        UPDATE cartpackage 
        SET qty = ? 
        WHERE cartId = ? AND packageId = ?
        `;
    marketPlace.query(sql, [qty, cartId, packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.addPackageToCartDao = (cartId, packageId, qty = 1) => {
  return new Promise((resolve, reject) => {
    const sql = `
        INSERT INTO cartpackage (cartId, packageId, qty)
        VALUES (?, ?, ?)
        `;
    marketPlace.query(sql, [cartId, packageId, qty], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

//------------------------------daos for products in cart---------------------------------------


// Check if a specific product exists in the cart
exports.checkProductInCartDao = (cartId, productId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT id, qty, unit
        FROM cartadditionalitems
        WHERE cartId = ? AND productId = ?
        `;
    marketPlace.query(sql, [cartId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Add a new product to the cart
exports.addProductToCartDao = (cartId, productId, qty, unit) => {
  return new Promise((resolve, reject) => {
    const sql = `
        INSERT INTO cartadditionalitems (cartId, productId, qty, unit)
        VALUES (?, ?, ?, ?)
        `;
    marketPlace.query(sql, [cartId, productId, qty, unit], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Update product quantity in cart
exports.updateProductQtyInCartDao = (cartId, productId, qty) => {
  return new Promise((resolve, reject) => {
    const sql = `
        UPDATE cartadditionalitems 
        SET qty = ? 
        WHERE cartId = ? AND productId = ?
        `;
    marketPlace.query(sql, [qty, cartId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Get all products in a user's cart
exports.getCartProductsDao = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.id as cartItemId,
        c.qty,
        c.unit,
        c.createdAt,
        m.id as productId,
        m.displayName,
        m.normalPrice,
        m.discountedPrice,
        m.discount,
        m.promo,
        m.unitType,
        m.startValue,
        m.changeby,
        m.tags,
        v.varietyNameEnglish,
        v.varietyNameSinhala,
        v.varietyNameTamil,
        v.image,
        cr.cropNameEnglish,
        cr.cropNameSinhala,
        cr.cropNameTamil,
        cr.category
      FROM cartadditionalitems c
      JOIN marketplaceitems m ON c.productId = m.id
      JOIN plant_care.cropvariety v ON m.varietyId = v.id
      JOIN plant_care.cropgroup cr ON v.cropGroupId = cr.id
      WHERE c.cartId = ?
      ORDER BY c.createdAt DESC
    `;
    marketPlace.query(sql, [cartId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Remove a product from cart
exports.removeProductFromCartDao = (cartId, productId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        DELETE FROM cartadditionalitems 
        WHERE cartId = ? AND productId = ?
        `;
    marketPlace.query(sql, [cartId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Clear all products from cart
exports.clearCartDao = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        DELETE FROM cartadditionalitems 
        WHERE cartId = ?
        `;
    marketPlace.query(sql, [cartId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Get cart summary (total items, total value)
// exports.getCartSummaryDao  = (cartId) => {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       SELECT 
//         COUNT(*) as totalItems,
//         SUM(COALESCE(m.discountedPrice, m.normalPrice)) as totalValue
//       FROM cartadditionalitems c
//       JOIN marketplaceitems m ON c.productId = m.id
//       WHERE c.cartId = ?
//     `;
//     marketPlace.query(sql, [cartId], (err, results) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(results[0] || { totalItems: 0, totalValue: 0 });
//       }
//     });
//   });
// };

// Get user's cart with all details
exports.getUserCartWithDetailsDao = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.id as cartId,
        c.userId,
        c.buyerType,
        c.isCoupon,
        c.couponValue,
        c.createdAt
      FROM cart c
      WHERE c.userId = ?
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

// Get all packages in user's cart
exports.getCartPackagesDao = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        cp.id as cartItemId,
        cp.qty as quantity,
        cp.createdAt,
        mp.id as packageId,
        mp.displayName as packageName,
        mp.image,
        mp.description,
        (mp.productPrice+mp.packingFee+mp.serviceFee) as price,
        mp.status
      FROM cartpackage cp
      JOIN marketplacepackages mp ON cp.packageId = mp.id
      WHERE cp.cartId = ?
      ORDER BY cp.createdAt DESC
    `;
    
    marketPlace.query(sql, [cartId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        // Expand packages based on quantity
        const expandedPackages = [];
        
        results.forEach(pkg => {
          const quantity = pkg.quantity || 1;
          
          // Create separate entries for each quantity unit
          for (let i = 0; i < quantity; i++) {
            expandedPackages.push({
              ...pkg,
              quantity: 1, // Each expanded package has quantity 1
              // Optional: Add a sequence number to distinguish between same packages
              sequenceNumber: i + 1,
              // Optional: Create unique identifier for each expanded package
              uniqueId: `${pkg.cartItemId}_${i + 1}`
            });
          }
        });
        
        resolve(expandedPackages);
      }
    });
  });
};

// Get package details (items) for a specific package
exports.getPackageDetailsDao = (packageId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        pd.id,
        pd.packageId,
        pd.qty as quantity,
        pd.createdAt,
        pt.id as productTypeId,
        pt.typeName as name,
        pt.shortCode
      FROM packagedetails pd
      JOIN producttypes pt ON pd.productTypeId = pt.id
      WHERE pd.packageId = ?
      ORDER BY pt.typeName
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

// Get all individual products in user's cart
exports.getCartProductsDao = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        cai.id as cartItemId,
        cai.qty as quantity,
        cai.unit,
        cai.createdAt,
        mi.id as productId,
        mi.displayName as name,
        mi.normalPrice,
        mi.discountedPrice,
        mi.discount,
        mi.promo,
        mi.unitType,
        mi.startValue,
        mi.changeby,
        mi.displayType,
        mi.tags,
        cv.varietyNameEnglish,
        cv.varietyNameSinhala,
        cv.varietyNameTamil,
        cv.image,
        cg.cropNameEnglish,
        cg.cropNameSinhala,
        cg.cropNameTamil,
        cg.category
      FROM cartadditionalitems cai
      JOIN marketplaceitems mi ON cai.productId = mi.id
      JOIN plant_care.cropvariety cv ON mi.varietyId = cv.id
      JOIN plant_care.cropgroup cg ON cv.cropGroupId = cg.id
      WHERE cai.cartId = ?
      ORDER BY cai.createdAt DESC
    `;
    marketPlace.query(sql, [cartId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Get cart summary with totals
exports.getCartSummaryDao = (cartId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        (
          SELECT COUNT(*) 
          FROM cartpackage cp 
          WHERE cp.cartId = ?
        ) as totalPackages,
        (
          SELECT COUNT(*) 
          FROM cartadditionalitems cai 
          WHERE cai.cartId = ?
        ) as totalProducts,
        (
          SELECT COALESCE(SUM(mp.productPrice), 0) 
          FROM cartpackage cp 
          JOIN marketplacepackages mp ON cp.packageId = mp.id 
          WHERE cp.cartId = ?
        ) as packageTotal,
        (
          SELECT COALESCE(SUM(COALESCE(mi.discountedPrice, mi.normalPrice)), 0) 
          FROM cartadditionalitems cai 
          JOIN marketplaceitems mi ON cai.productId = mi.id 
          WHERE cai.cartId = ?
        ) as productTotal
    `;
    marketPlace.query(sql, [cartId, cartId, cartId, cartId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        const result = results[0] || {};
        resolve({
          totalPackages: result.totalPackages || 0,
          totalProducts: result.totalProducts || 0,
          packageTotal: parseFloat(result.packageTotal) || 0,
          productTotal: parseFloat(result.productTotal) || 0
        });
      }
    });
  });
};

// Update product quantity in cart
exports.updateCartProductQuantityDao = (cartId, productId, quantity) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE cartadditionalitems 
      SET qty = ? 
      WHERE cartId = ? AND productId = ?
    `;
    marketPlace.query(sql, [quantity, cartId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Update package quantity in cart
exports.updateCartPackageQuantityDao = (cartId, packageId, quantity) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE cartpackage 
      SET qty = ? 
      WHERE cartId = ? AND packageId = ?
    `;
    marketPlace.query(sql, [quantity, cartId, packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Remove product from cart
exports.removeCartProductDao = (cartId, productId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM cartadditionalitems 
      WHERE cartId = ? AND productId = ?
    `;
    marketPlace.query(sql, [cartId, productId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Remove package from cart
exports.removeCartPackageDao = (cartId, packageId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM cartpackage 
      WHERE cartId = ? AND packageId = ?
    `;
    marketPlace.query(sql, [cartId, packageId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


exports.bulkRemoveCartProductsDao = (cartId, productIds) => {
  return new Promise((resolve, reject) => {
    // Check if productIds is an array
    if (!Array.isArray(productIds)) {
      reject(new Error("productIds must be an array"));
      return;
    }

    // Early exit if no valid IDs
    if (productIds.length === 0) {
      resolve({ affectedRows: 0, success: false });
      return;
    }

    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      DELETE FROM cartadditionalitems 
      WHERE cartId = ? AND productId IN (${placeholders})
    `;
    
    const params = [cartId, ...productIds];
    
    marketPlace.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          affectedRows: results.affectedRows || 0,
          success: (results.affectedRows || 0) > 0
        });
      }
    });
  });
};
exports.getSuggestedItemsForNewUserDao = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        mi.displayName,
        pc.image
      FROM 
        marketplaceusers mu
      JOIN 
        marketplaceitems mi
      ON 1 = 1
      JOIN 
        plant_care.cropvariety pc 
      ON mi.varietyId = pc.id
      WHERE 
        mu.id = ? 
        AND mu.firstTimeUser = 0
        AND mu.buyerType = 'retail'
        AND mi.category = 'Retail'
    `;

    marketPlace.query(query, [userId], (err, results) => {
      if (err) {
        return reject(err);
      }

      resolve(results);
    });
  });
};



exports.insertExcludeItemsDao = (userId, displayNames) => {
  return new Promise((resolve, reject) => {
    if (!displayNames || displayNames.length === 0) {
      return resolve({ message: 'No items to insert' });
    }

    const placeholders = displayNames.map(() => '?').join(',');
    const query = `
      INSERT INTO excludelist (userId, mpItemId)
      SELECT ?, mi.id
      FROM marketplaceitems mi
      WHERE mi.displayName IN (${placeholders})
    `;

    const values = [userId, ...displayNames];

    marketPlace.query(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
};

exports.getExcludedItemsDao = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT mi.displayName, cv.image
      FROM excludelist el
      JOIN marketplaceitems mi ON el.mpItemId = mi.id
      JOIN plant_care.cropvariety cv ON el.mpItemId = cv.id
      WHERE el.userId = ?
    `;

    marketPlace.query(query, [userId], (err, items) => {
      if (err) {
        return reject(err);
      }
      resolve(items);
    });
  });
};

exports.deleteExcludedItemsDao = (userId, displayNames) => {
  return new Promise((resolve, reject) => {
    const placeholders = displayNames.map(() => '?').join(',');
    const query = `
      DELETE el FROM excludelist el
      JOIN marketplaceitems mi ON el.mpItemId = mi.id
      WHERE el.userId = ? AND mi.displayName IN (${placeholders})
    `;
    const values = [userId, ...displayNames];

    marketPlace.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};



exports.updateUserStatusDao = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE marketplaceusers
      SET firstTimeUser = 1
      WHERE id = ? AND firstTimeUser = 0
    `;

    marketPlace.query(query, [userId], (err, result) => {
      if (err) {
        return reject(err);
      }

      if (result.affectedRows === 0) {
        return reject(new Error("User not found or already marked as non-first-time user"));
      }

      resolve({ success: true, message: "User status updated successfully" });
    });
  });
};


exports.getSuggestedItemsDao = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        mi.displayName,
        pc.image
      FROM 
        marketplaceusers mu
      JOIN 
        marketplaceitems mi
      ON 1 = 1
      JOIN 
        plant_care.cropvariety pc 
      ON mi.varietyId = pc.id
      WHERE 
        mu.id = ? 
        AND mi.category = 'Retail'
    `;

    marketPlace.query(query, [userId], (err, results) => {
      if (err) {
        return reject(err);
      }

      resolve(results);
    });
  });
};


//global search related dao

exports.searchProductsAndPackagesDao = (searchTerm) => {
  return new Promise((resolve, reject) => {
    const productsQuery = `
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
        c.category,
        'product' as type
      FROM marketplaceitems m
      JOIN plant_care.cropvariety v ON m.varietyId = v.id
      JOIN plant_care.cropgroup c ON v.cropGroupId = c.id
      WHERE m.category = 'Retail' 
      AND (
        m.displayName LIKE ? OR
        v.varietyNameEnglish LIKE ? OR
        v.varietyNameSinhala LIKE ? OR
        v.varietyNameTamil LIKE ? OR
        c.cropNameEnglish LIKE ? OR
        c.cropNameSinhala LIKE ? OR
        c.cropNameTamil LIKE ? OR
        m.tags LIKE ?
      )
      ORDER BY m.displayName ASC
    `;

    const packagesQuery = `
      SELECT 
        mp.id, 
        mp.displayName, 
        mp.image, 
        mp.description,
        mp.productPrice,
        mp.packingFee,
        mp.serviceFee,
        (mp.productPrice + mp.packingFee + mp.serviceFee) AS subTotal,
        'package' as type,
        NULL as normalPrice,
        NULL as discountedPrice,
        NULL as discount,
        NULL as promo,
        NULL as unitType,
        NULL as startValue,
        NULL as changeby,
        NULL as displayType,
        NULL as tags,
        NULL as varietyNameEnglish,
        NULL as varietyNameSinhala,
        NULL as varietyNameTamil,
        NULL as cropNameEnglish,
        NULL as cropNameSinhala,
        NULL as cropNameTamil,
        NULL as category
      FROM marketplacepackages mp
      INNER JOIN definepackage dp ON mp.id = dp.packageId
      WHERE mp.status = 'Enabled' 
      AND mp.isValid = 1
      AND mp.displayName LIKE ?
    `;

    const searchPattern = `%${searchTerm}%`;
    const productsParams = Array(8).fill(searchPattern); // 8 search fields for products
    const packagesParams = [searchPattern]; // 1 search field for packages

    // Execute both queries
    Promise.all([
      new Promise((resolveProducts, rejectProducts) => {
        marketPlace.query(productsQuery, productsParams, (err, results) => {
          if (err) {
            rejectProducts(err);
          } else {
            // Format the products results
            const formattedResults = results.map(item => {
              // Calculate discount percentage
              let discountPercentage = null;
              if (item.normalPrice && item.discountedPrice && item.normalPrice > item.discountedPrice) {
                const discount = ((item.normalPrice - item.discountedPrice) / item.normalPrice) * 100;
                discountPercentage = discount % 1 === 0 ? Math.round(discount) : Math.round(discount * 100) / 100;
              }
              
              return {
                ...item,
                discountedPrice: item.discountedPrice && item.discountedPrice % 1 === 0 
                  ? parseInt(item.discountedPrice) 
                  : item.discountedPrice,
                discount: discountPercentage
              };
            });
            resolveProducts(formattedResults);
          }
        });
      }),
      new Promise((resolvePackages, rejectPackages) => {
        marketPlace.query(packagesQuery, packagesParams, (err, results) => {
          if (err) {
            rejectPackages(err);
          } else {
            resolvePackages(results);
          }
        });
      })
    ])
    .then(([products, packages]) => {
      // Combine both arrays
      const combinedResults = [...products, ...packages];
      resolve(combinedResults);
    })
    .catch((error) => {
      reject(error);
    });
  });
}