const marketPlace = require('../startup/database'); // Assuming you have this database connection

/**
 * 
 * @param {number} userId 
 * @returns {Promise} 
 */
exports.getBillingDetailsByUserIdDao = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        userId,
        title,
        fullName,
        buildingType,
        houseNo,
        street,
        city,
        phonecode1,
        phone1,
        phonecode2,
        phone2,
        createdAt
      FROM useraddress
      WHERE userId = ?
    `;
    marketPlace.marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

/**
 * 
 * @param {number} userId 
 * @param {object} billingData 
 * @returns {Promise} 
 */

exports.updateBillingDetailsByUserIdDao = (userId, billingData) => {
  return new Promise((resolve, reject) => {
    // Check if user has an existing address record
    const checkSql = `SELECT id FROM useraddress WHERE userId = ? LIMIT 1`;
    
    marketPlace.marketPlace.query(checkSql, [userId], (checkErr, checkResults) => {
      if (checkErr) {
        return reject(checkErr);
      }
      
      // If there's an existing record, update it
      if (checkResults && checkResults.length > 0) {
        const addressId = checkResults[0].id;
        const updateSql = `
          UPDATE useraddress
          SET 
            title = ?,
            fullName = ?,
            buildingType = ?,
            houseNo = ?,
            street = ?,
            city = ?,
            phonecode1 = ?,
            phone1 = ?,
            phonecode2 = ?,
            phone2 = ?
          WHERE id = ? AND userId = ?
        `;
        
        const updateParams = [
          billingData.title,
          billingData.fullName,
          billingData.buildingType,
          billingData.houseNo,
          billingData.street,
          billingData.city,
          billingData.phonecode1,
          billingData.phone1,
          billingData.phonecode2 || null,
          billingData.phone2 || null,
          addressId,
          userId
        ];
        
        marketPlace.marketPlace.query(updateSql, updateParams, (updateErr, updateResults) => {
          if (updateErr) {
            reject(updateErr);
          } else {
            resolve({
              id: addressId,
              updated: true,
              affectedRows: updateResults.affectedRows
            });
          }
        });
      } 
      // If no existing record, insert a new one
      else {
        const insertSql = `
          INSERT INTO useraddress (
            userId,
            title,
            fullName,
            buildingType,
            houseNo,
            street,
            city,
            phonecode1,
            phone1,
            phonecode2,
            phone2
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [
          userId,
          billingData.title,
          billingData.fullName,
          billingData.buildingType,
          billingData.houseNo,
          billingData.street,
          billingData.city,
          billingData.phonecode1,
          billingData.phone1,
          billingData.phonecode2 || null,
          billingData.phone2 || null
        ];
        
        marketPlace.marketPlace.query(insertSql, insertParams, (insertErr, insertResults) => {
          if (insertErr) {
            reject(insertErr);
          } else {
            resolve({
              id: insertResults.insertId,
              created: true,
              affectedRows: insertResults.affectedRows
            });
          }
        });
      }
    });
  });
};