// postinvoice-dao.js
// NOTE: adjust the require path below to wherever your `collectionofficer`
// connection is exported in your project.
const { collectionofficer } = require("../startup/database");

exports.getInvoiceDetailsDAO = (processOrderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        o.id AS orderId,
        o.centerId,
        o.orderApp,
        o.delivaryMethod AS deliveryMethod,
        po.discount AS orderDiscount,
        o.createdAt AS invoiceDate,
        po.sheduleDate AS scheduledDate,
        o.buildingType,
        o.title,
        o.fullName,
        o.phonecode1,
        o.phone1,
        po.isCoupon,
        po.couponType,
        po.couponValue,
        po.invNo AS invoiceNumber,
        po.paymentMethod AS paymentMethod,
        po.fullTotal AS grandTotal,
        mu.email AS userEmail,
        po.isPaid,
        po.creditPaid,
        po.moneyPaid,
        po.status AS orderStatus,
        CASE
          WHEN o.buildingType = 'House' THEN oh.houseNo
          WHEN o.buildingType = 'Apartment' THEN oa.houseNo
          ELSE NULL
        END AS houseNo,
        CASE
          WHEN o.buildingType = 'House' THEN oh.streetName
          WHEN o.buildingType = 'Apartment' THEN oa.streetName
          ELSE NULL
        END AS streetName,
        CASE
          WHEN o.buildingType = 'House' THEN oh.city
          WHEN o.buildingType = 'Apartment' THEN oa.city
          ELSE NULL
        END AS city,
        oa.buildingNo,
        oa.buildingName,
        oa.unitNo,
        oa.floorNo,
        po.deliveryCharge AS deliveryFee
      FROM orders o
      LEFT JOIN processorders po ON o.id = po.orderId
      LEFT JOIN orderhouse oh ON o.id = oh.orderId AND o.buildingType = 'House'
      LEFT JOIN orderapartment oa ON o.id = oa.orderId AND o.buildingType = 'Apartment'
      LEFT JOIN marketplaceusers mu ON o.userId = mu.id
      WHERE po.id = ?
    `;

    collectionofficer.query(sql, [processOrderId], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0] || null);
    });
  });
};

exports.getFamilyPackItemsDAO = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        op.id,
        op.qty,
        mp.id AS packageId,
        mp.displayName AS name,
        mp.packingFee,
        mp.serviceFee,
        op.reviewValue,
        (mp.productPrice + mp.packingFee + mp.serviceFee) AS amount
      FROM orderpackage op
      JOIN marketplacepackages mp ON op.packageId = mp.id
      WHERE op.orderId = ?
    `;

    collectionofficer.query(sql, [orderId], (err, results) => {
      if (err) return reject(err);

      // One entry per purchased quantity of each package
      const expanded = [];
      results.forEach((row) => {
        for (let i = 0; i < row.qty; i++) {
          expanded.push({ ...row });
        }
      });

      resolve(expanded);
    });
  });
};

exports.getAdditionalItemsDAO = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        oai.id,
        mi.displayName AS name,
        oai.unit, 
        mi.normalprice AS unitPrice,
        oai.qty AS quantity,
        oai.normalPrice,
        oai.price AS amount,
        oai.discount AS itemDiscount,
        cv.image AS image
      FROM orderadditionalitems oai
      JOIN marketplaceitems mi ON oai.productId = mi.id
      JOIN plant_care.cropvariety cv ON mi.varietyId = cv.id
      WHERE oai.proOrderId = ?
    `;

    collectionofficer.query(sql, [id], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

exports.getBillingDetailsDAO = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        o.title,
        o.fullName,
        o.phoneCode1,
        o.phone1,
        o.buildingType,
        po.couponValue,
        COALESCE(oh.houseNo, oa.houseNo) AS houseNo,
        COALESCE(oh.streetName, oa.streetName) AS street,
        COALESCE(oh.city, oa.city) AS city
      FROM orders o
      LEFT JOIN processorders po ON o.id = po.orderId
      LEFT JOIN orderhouse oh ON o.id = oh.orderId
      LEFT JOIN orderapartment oa ON o.id = oa.orderId
      WHERE o.id = ?
      LIMIT 1
    `;

    collectionofficer.query(sql, [orderId], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0] || null);
    });
  });
};

exports.getPickupCenterDetailsDAO = (centerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM collection_officer.distributedcenter WHERE id = ?
    `;

    collectionofficer.query(sql, [centerId], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0] || null);
    });
  });
};

exports.getDeliveryChargeByCityDAO = (city) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        city,
        charge
      FROM deliverycharge
      WHERE city = ?
      LIMIT 1
    `;

    collectionofficer.query(sql, [city], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0] || null);
    });
  });
};

exports.getPosPackageDetailsDAO = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT                                           
        mp.id AS packageId,
        mp.displayName AS packageName,               
        mp.productPrice AS packagePrice,             
        op.qty AS packageCount,                      
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'typeName', pt.typeName,
            'productName', mpi.displayName,
            'unit', mpi.unitType,
            'price', opi.price,
            'qty', opi.qty,
            'displayQty', CASE
                WHEN mpi.unitType = 'g' THEN ROUND(opi.qty * 1000)
                ELSE opi.qty
              END
          )
        ) AS items                               
      FROM orderpackage op
      LEFT JOIN marketplacepackages mp ON op.packageId = mp.id
      LEFT JOIN orderpackageitems opi ON op.id = opi.orderPackageId
      LEFT JOIN producttypes pt ON opi.productType = pt.id
      LEFT JOIN marketplaceitems mpi ON opi.productId = mpi.id
      WHERE op.orderId = ?                                
      GROUP BY mp.id, mp.displayName, mp.productPrice, op.qty;
    `;

    collectionofficer.query(sql, [orderId], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};