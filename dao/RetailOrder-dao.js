const {
  plantcare,
  collectionofficer,
  marketPlace,
  dash,
} = require("../startup/database");


exports.getRetailCartDao = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT 
            RC.packageId,
            RC.packageItemId,
            RC.productId,
            RC.unit,
            RC.qty,
            RC.isPackage,
            MP.displayName AS packageName,
            MPI.displayName AS productName,
            MPI.normalPrice AS productPrice,
            MPI.discountedPrice AS productDiscountedPrice,
            MPI.discount as productDiscount,
            PD.quantity AS packageQuantity,
            PD.quantityType AS packageQuantityType,
            PD.price AS packagePrice,
            PD.discount AS packageDiscount,
            PD.discountedPrice AS packageDiscountedPrice
        FROM retailcart RC
        LEFT JOIN marketplacepackages MP ON RC.packageId = MP.id
        LEFT JOIN packagedetails PD ON RC.packageItemId = PD.id
        LEFT JOIN marketplaceitems MPI ON RC.productId = MPI.id
        WHERE RC.userId = ?
    `;

    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        console.log("getRetailCartDao raw results", results);

        // Transform the results into the desired format
        const formattedResults = [];
        const additionalItems = {
          packageName: "Additional Items",
          amountPackage: 0,
          Items: []
        };

        // First process packages
        const packageMap = new Map();

        results.forEach(item => {
          if (item.isPackage === 1) {
            if (!packageMap.has(item.packageId)) {
              // Calculate package amount based on your rules
              let packageAmount = 0;

              if (item.qty == item.packageQuantity) {
                // If quantity matches package quantity, use package price minus discount
                packageAmount = (item.packagePrice - (item.packageDiscount || 0));
              } else {
                // Otherwise calculate based on product prices
                const pricePerUnit = (item.productDiscountedPrice || item.productPrice);
                packageAmount = item.qty * pricePerUnit;
              }

              packageMap.set(item.packageId, {
                packageName: item.packageName,
                packageId: item.packageId,
                amountPackage: packageAmount,
                Items: []
              });
            }

            const packageObj = packageMap.get(item.packageId);
            packageObj.Items.push({
              packageItemId: item.packageItemId,
              productId: item.productId,
              unit: item.unit,
              qty: item.qty,
              productName: item.productName,
              productPrice: item.productPrice,
              productDiscountedPrice: item.productDiscountedPrice,
              productDiscount: item.productDiscount,
              packageQuantity: item.packageQuantity,
              packageQuantityType: item.packageQuantityType,
              packagePrice: item.packagePrice,
              packageDiscount: item.packageDiscount,
              packageDiscountedPrice: item.packageDiscountedPrice
            });
          } else {
            // Calculate amount for additional items
            const itemAmount = item.qty * (item.productDiscountedPrice || item.productPrice);

            additionalItems.Items.push({
              productId: item.productId,
              unit: item.unit,
              qty: item.qty,
              productName: item.productName,
              productPrice: item.productPrice,
              productDiscountedPrice: item.productDiscountedPrice,
              productDiscount: item.productDiscount
            });

            additionalItems.amountPackage += itemAmount;
          }
        });

        // Add packages to formatted results
        packageMap.forEach(pkg => {
          formattedResults.push(pkg);
        });

        // Add additional items if any
        if (additionalItems.Items.length > 0) {
          formattedResults.push(additionalItems);
        }

        console.log("Formatted cart data:", JSON.stringify(formattedResults, null, 2));
        resolve(formattedResults);
      }
    });
  });
};


exports.insertHomeDeliveryDetails = (addressData) => {
  return new Promise((resolve, reject) => {
    const sql = `
          INSERT INTO homedeliverydetails (buildingType, houseNo, street, city, buildingName, buildingNo, flatNo, floorNo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
    const values = [
      addressData.buildingType,
      addressData.houseNo,
      addressData.street,
      addressData.city,
      addressData.buildingName,
      addressData.buildingNo,
      addressData.flatNo,
      addressData.floorNo
    ];
    marketPlace.query(sql, values, (err, result) => {
      if (err) return reject(err);
      resolve(result); // result.insertId contains the new ID
    });
  });
};

exports.insertRetailOrder = (data) => {
  return new Promise((resolve, reject) => {
    const sql = `
          INSERT INTO retailorder (
              userId, fullName, delivaryMethod, centerId, homedeliveryId,
              title, phonecode1, phone1, phonecode2, phone2,
              isCoupon, couponValue, total, discount,
              sheduleType, sheduleDate, sheduleTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    const values = [
      data.userId,
      data.fullName,
      data.deliveryMethod,
      data.centerId,
      data.homedeliveryId,
      data.title,
      data.phonecode1,
      data.phone1,
      data.phonecode2,
      data.phone2,
      data.isCoupon,
      data.couponValue,
      data.total,
      data.discount,
      data.scheduleType,
      data.scheduleDate,
      data.scheduleTime,
    ];
    marketPlace.query(sql, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};


exports.getCheckOutDao = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        hdd.buildingType, 
        hdd.houseNo, 
        hdd.street, 
        hdd.city, 
        hdd.buildingNo,
        hdd.buildingName, 
        hdd.flatNo, 
        hdd.floorNo, 
        ro.title, 
        ro.phone1, 
        ro.phone2, 
        ro.phonecode1, 
        ro.phonecode2, 
        ro.title,
        ro.delivaryMethod,
        ro.sheduleDate,
        ro.sheduleTime,
        ro.fullName
      FROM market_place.homedeliverydetails hdd
      LEFT JOIN market_place.retailorder ro ON hdd.id = ro.homedeliveryId
      ORDER BY hdd.id DESC
      LIMIT 1
    `;

    marketPlace.query(sql, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]); // return just the latest record
      }
    });
  });
};



