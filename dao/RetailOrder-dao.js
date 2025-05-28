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



const getRetailOrderHistoryDao = async (userId) => {
 return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ro.id AS orderId,
        ro.sheduleDate,
        ro.sheduleTime,
        ro.delivaryMethod,
        ro.total,
        ro.createdAt AS orderPlacedTime,
        pro.status
      FROM retailorder ro
      LEFT JOIN processretailorders pro ON ro.id = pro.orderId
      WHERE ro.userId = ?
      ORDER BY ro.createdAt DESC
    `;

    marketPlace.query(sql, [userId], (err, results) => {
      if (err) {
        reject("Error fetching retail order history: " + err);
      } else {
        resolve(results);
      }
    });
  });
};



// const getRetailOrderByIdDao = async (orderId, userId) => {
//   return new Promise((resolve, reject) => {
//     // Define SQL queries
//     const orderSql = `
//       SELECT 
//         ro.*,
//         CASE
//           WHEN ro.centerId IS NOT NULL THEN 'PICKUP'
//           WHEN ro.homedeliveryId IS NOT NULL THEN 'DELIVERY'
//           ELSE 'UNKNOWN'
//         END AS deliveryType
//       FROM retailorder ro
//       WHERE ro.id = ? AND ro.userId = ?
//     `;

//     const itemsSql = `
//       SELECT *,
//              CASE
//                WHEN packageId IS NOT NULL AND packageItemId IS NOT NULL THEN 'Family Pack'
//                ELSE 'additional'
//              END AS itemType
//       FROM retailorderitems
//       WHERE orderId = ?
//       ORDER BY packageId
//     `;

//     const itemDetailsSql = `SELECT * FROM marketplaceitems WHERE id IN (?)`;

//     const centerSql = `SELECT * FROM collectioncenter WHERE id = ?`;

//     const deliverySql = `SELECT * FROM homedeliverydetails WHERE id = ?`;

//     // Input validation
//     if (!orderId || !userId) {
//       return reject('Invalid orderId or userId');
//     }

//     // Fetch the order
//     marketPlace.query(orderSql, [orderId, userId], async (err, orders) => {
//       if (err) return reject(`Error fetching retail order: ${err}`);
//       if (!orders || orders.length === 0) return reject('Order not found or unauthorized');

//       const order = orders[0];

//       // Fetch order items
//       marketPlace.query(itemsSql, [orderId], async (err, items) => {
//         if (err) return reject(`Error fetching retail order items: ${err}`);

//         // Fetch item details in batch
//         const productIds = [...new Set(items.filter(item => item.productId).map(item => item.productId))];
//         let itemDetailsMap = {};
//         if (productIds.length > 0) {
//           marketPlace.query(itemDetailsSql, [productIds], (err, results) => {
//             if (err) return reject(`Error fetching marketplace item details: ${err}`);
//             itemDetailsMap = results.reduce((map, detail) => {
//               map[detail.id] = detail;
//               return map;
//             }, {});
//           });
//         }

//         // Group and normalize items
//         const { packages, additionalItems } = items.reduce(
//           (acc, item) => {
//             const itemDetails = item.productId ? itemDetailsMap[item.productId] || null : null;
//             const itemEntry = {
//               id: item.id,
//               productId: item.productId,
//               quantity: item.quantity,
//               price: item.price,
//               packageItemId: item.packageItemId,
//               itemType: item.itemType,
//               itemDetails: itemDetails ? {
//                 displayName: itemDetails.displayName,
//                 normalPrice: itemDetails.normalPrice,
//                 discountedPrice: itemDetails.discountedPrice,
//                 discount: itemDetails.discount,
//                 startValue: itemDetails.startValue,
//                 changeby: itemDetails.changeby,
//                 displayType: itemDetails.displayType,
//                 tags: itemDetails.tags,
//                 createdAt: itemDetails.createdAt
//               } : null
//             };

//             if (item.itemType === 'package' && item.packageId) {
//               if (!acc.packages[item.packageId]) {
//                 acc.packages[item.packageId] = {
//                   packageId: item.packageId,
//                   category: itemDetails?.category || null,
//                   unitType: itemDetails?.unitType || null,
//                   promo: itemDetails?.promo || null,
//                   items: []
//                 };
//               }
//               if (!acc.packages[item.packageId].category && itemDetails?.category) {
//                 acc.packages[item.packageId].category = itemDetails.category;
//                 acc.packages[item.packageId].unitType = itemDetails.unitType;
//                 acc.packages[item.packageId].promo = itemDetails.promo;
//               }
//               acc.packages[item.packageId].items.push(itemEntry);
//             } else {
//               acc.additionalItems.push({
//                 ...itemEntry,
//                 packageId: item.packageId,
//                 packageItemId: item.packageItemId
//               });
//             }
//             return acc;
//           },
//           { packages: {}, additionalItems: [] }
//         );

//         // Attach packages and additional items to order
//         order.packages = Object.values(packages);
//         order.additionalItems = additionalItems;

//         // Enrich with pickup or delivery details
//         if (order.deliveryType === 'PICKUP') {
//           collectionofficer.query(centerSql, [order.centerId], (err, result) => {
//             if (err) return reject(`Error fetching collection center: ${err}`);
//             if (!result || result.length === 0) return reject('Collection center not found');

//             // Format all available details from the collection center
//             order.pickupInfo = {
//               id: result[0].id,
//               name: result[0].name || 'Unknown',
//               contact: {
//                 name: result[0].contactName || 'Unknown',
//                 phone: result[0].contactPhone || 'Unknown'
//               },
//               address: {
//                 street: result[0].address || 'Unknown',
//                 city: result[0].city || 'Unknown',
//                 state: result[0].state || 'Unknown',
//                 zipCode: result[0].zipCode || 'Unknown'
//               },
//               operatingHours: result[0].operatingHours || 'Unknown',
//               // Include any additional fields dynamically
//               ...Object.fromEntries(
//                 Object.entries(result[0]).filter(([key]) => ![
//                   'id', 'name', 'contactName', 'contactPhone', 
//                   'address', 'city', 'state', 'zipCode', 'operatingHours'
//                 ].includes(key))
//               )
//             };
//             resolve(order);
//           });
//         } else if (order.deliveryType === 'DELIVERY') {
//           marketPlace.query(deliverySql, [order.homedeliveryId], (err, result) => {
//             if (err) return reject(`Error fetching delivery address: ${err}`);
//             order.deliveryAddress = result[0] || null;
//             resolve(order);
//           });
//         } else {
//           resolve(order);
//         }
//       });
//     });
//   });
// };

const getRetailOrderByIdDao = async (orderId, userId) => {
  return new Promise((resolve, reject) => {
    // Define SQL queries
    const orderSql = `
      SELECT 
        ro.*,
        mu.phoneCode AS userPhoneCode,
        mu.phoneNumber AS userPhoneNumber,
        CASE
          WHEN ro.centerId IS NOT NULL THEN 'PICKUP'
          WHEN ro.homedeliveryId IS NOT NULL THEN 'DELIVERY'
          ELSE 'UNKNOWN'
        END AS deliveryType
      FROM retailorder ro
      LEFT JOIN marketplaceusers mu ON ro.userId = mu.id
      WHERE ro.id = ? AND ro.userId = ?
    `;

    // Modified items query to fetch displayName directly from marketplaceitems
    const itemsSql = `
      SELECT 
        roi.*,
        mi.displayName AS name,
        mi.unitType AS weight,
        roi.qty AS quantity,
        CASE
          WHEN roi.packageId IS NOT NULL AND roi.packageItemId IS NOT NULL THEN 'Family Pack'
          ELSE 'additional'
        END AS itemType
      FROM retailorderitems roi
      LEFT JOIN marketplaceitems mi ON roi.productId = mi.id
      WHERE roi.orderId = ?
      ORDER BY roi.packageId
    `;

    const centerSql = `SELECT * FROM collectioncenter WHERE id = ?`;

    const deliverySql = `SELECT * FROM homedeliverydetails WHERE id = ?`;

    // Input validation
    if (!orderId || !userId) {
      return reject('Invalid orderId or userId');
    }

    // Fetch the order
    marketPlace.query(orderSql, [orderId, userId], (err, orders) => {
      if (err) {
        console.error(`Error fetching retail order at 03:40 PM +0530, May 27, 2025: ${err}`);
        return reject(`Error fetching retail order: ${err}`);
      }
      if (!orders || orders.length === 0) {
        return reject('Order not found or unauthorized');
      }

      const order = orders[0];
      // Debug log to check raw values from retailorder and marketplaceusers
      console.log('Raw order data at 03:40 PM +0530, May 27, 2025:', {
        fullName: order.fullName,
        phonecode1: order.phonecode1,
        phone1: order.phone1,
        userPhoneCode: order.userPhoneCode,
        userPhoneNumber: order.userPhoneNumber,
        homedeliveryId: order.homedeliveryId,
      });

      // Fetch order items with names directly
      marketPlace.query(itemsSql, [orderId], (err, items) => {
        if (err) {
          console.error(`Error fetching retail order items at 03:40 PM +0530, May 27, 2025: ${err}`);
          return reject(`Error fetching retail order items: ${err}`);
        }

        // Group and normalize items
        const { packages, additionalItems } = items.reduce(
          (acc, item) => {
            const itemEntry = {
              id: item.id,
              productId: item.productId,
              name: item.name || `Item ${item.productId || 'Unknown'}`, // Use displayName directly
              weight: item.weight || '1 kg', // Use unitType as weight
              quantity: item.quantity || 1,
              price: item.price ? `Rs. ${parseFloat(item.price || '0').toFixed(2)}` : 'Rs. 0.00',
              packageItemId: item.packageItemId,
              itemType: item.itemType,
            };

            if (item.itemType === 'Family Pack' && item.packageId) {
              if (!acc.packages[item.packageId]) {
                acc.packages[item.packageId] = {
                  packageId: item.packageId,
                  name: 'Family Pack', // Can be dynamic if needed
                  unitType: item.weight || '1 kg',
                  items: [],
                };
              }
              acc.packages[item.packageId].items.push(itemEntry);
            } else {
              acc.additionalItems.push(itemEntry);
            }
            return acc;
          },
          { packages: {}, additionalItems: [] }
        );

        // Attach packages and additional items to order
        order.packages = Object.values(packages);
        order.additionalItems = additionalItems;

        // Enrich with pickup or delivery details
        if (order.deliveryType === 'PICKUP') {
          collectionofficer.query(centerSql, [order.centerId], (err, result) => {
            if (err) {
              console.error(`Error fetching collection center at 03:40 PM +0530, May 27, 2025: ${err}`);
              return reject(`Error fetching collection center: ${err}`);
            }
            if (!result || result.length === 0) {
              return reject('Collection center not found');
            }

            const centerDetails = result[0] || {};

            // Structure pickupInfo to include address and person information
            order.pickupInfo = {
              id: centerDetails.id,
              centerName: centerDetails.centerName || 'Unknown',
              contact01: centerDetails.contact01 || 'Unknown',
              fullName: order.fullName || 'N/A', // Pickup person name from retailorder
              phone: order.phone1
                ? `+${order.phonecode1 || ''} ${order.phone1}`
                : order.userPhoneNumber
                ? `+${order.userPhoneCode || ''} ${order.userPhoneNumber}`
                : 'N/A', // Use retailorder phone, fallback to marketplaceusers
              buildingNumber: centerDetails.buildingNumber || 'N/A',
              street: centerDetails.street || 'N/A',
              city: centerDetails.city || 'N/A',
              district: centerDetails.district || 'N/A',
              province: centerDetails.province || 'N/A',
              country: centerDetails.country || 'N/A',
              zipCode: centerDetails.zipCode || 'N/A',
              contact02: centerDetails.contact02 || 'N/A',
              code1: centerDetails.code1 || 'N/A',
              code2: centerDetails.code2 || 'N/A',
              regCode: centerDetails.regCode || 'N/A',
              operatingHours: centerDetails.operatingHours || 'N/A',
              createdAt: centerDetails.createdAt || 'N/A',
            };
            // Debug log to check pickupInfo
            console.log('pickupInfo at 03:40 PM +0530, May 27, 2025:', order.pickupInfo);
            resolve(order);
          });
        } else if (order.deliveryType === 'DELIVERY') {
          marketPlace.query(deliverySql, [order.homedeliveryId], (err, result) => {
            if (err) {
              console.error(`Error fetching delivery address at 03:40 PM +0530, May 27, 2025: ${err}`);
              return reject(`Error fetching delivery address: ${err}`);
            }
            const deliveryDetails = result[0] || {};
            // Debug log to check raw delivery details
            console.log('Raw delivery details at 03:40 PM +0530, May 27, 2025:', deliveryDetails);

            // Structure deliveryInfo to include address and person information
            order.deliveryInfo = {
              // Delivery address from homedeliverydetails
              buildingType: deliveryDetails.buildingType || 'N/A',
              houseNo: deliveryDetails.houseNo || 'N/A',
              street: deliveryDetails.street || 'N/A',
              city: deliveryDetails.city || 'N/A',
              buildingNo: deliveryDetails.buildingNo || 'N/A',
              buildingName: deliveryDetails.buildingName || 'N/A',
              flatNo: deliveryDetails.flatNo || 'N/A',
              floorNo: deliveryDetails.floorNo || 'N/A',
              // Receiving person information from retailorder
              fullName: order.fullName || 'N/A',
              phone: order.phone1
                ? `+${order.phonecode1 || ''} ${order.phone1}`
                : order.userPhoneNumber
                ? `+${order.userPhoneCode || ''} ${order.userPhoneNumber}`
                : 'N/A', // Use retailorder phone, fallback to marketplaceusers
            };
            // Debug log to check deliveryInfo
            console.log('deliveryInfo at 03:40 PM +0530, May 27, 2025:', order.deliveryInfo);
            // Remove the old deliveryAddress field to avoid redundancy
            delete order.deliveryAddress;
            resolve(order);
          });
        } else {
          resolve(order);
        }
      });
    });
  });
};
const getRetailOrderInvoiceByIdDao = async (orderId, userId) => {
  return new Promise((resolve, reject) => {
    // Main invoice details query
    const invoiceQuery = 
      `SELECT 
        ro.id AS orderId,
        CONCAT('INV-', YEAR(ro.createdAt), '-', LPAD(ro.id, 3, '0')) AS invoiceNumber,
        ro.createdAt AS invoiceDate,
        ro.sheduleDate AS scheduledDate,
        ro.delivaryMethod AS deliveryMethod,
        pro.paymentMethod,
        ro.total AS amountDue,
        ro.total AS grandTotal
      FROM retailorder ro
      LEFT JOIN processretailorders pro ON ro.id = pro.orderId
      WHERE ro.id = ? AND ro.userId = ?`;

    // Query for family pack items (via retailorderitems linked to marketplacepackages)
    const familyPackItemsQuery = 
      `SELECT 
        roi.id,
        pd.mpItemId AS productId,
        mi.displayName AS name,
        roi.price AS unitPrice,
        roi.qty AS quantity,
        (roi.price * roi.qty) AS amount
      FROM retailorderitems roi
      JOIN marketplacepackages mp ON roi.packageId = mp.id
      JOIN packagedetails pd ON roi.packageItemId = pd.id
      JOIN marketplaceitems mi ON roi.productId = mi.id
      WHERE roi.orderId = ? AND roi.packageId IS NOT NULL`;

    // Query for additional items (via productId)
    const additionalItemsQuery = 
      `SELECT 
        roi.id,
        roi.productId,
        mi.displayName AS name,
        roi.price AS unitPrice,
        roi.qty AS quantity,
        (roi.price * roi.qty) AS amount
      FROM retailorderitems roi
      JOIN marketplaceitems mi ON roi.productId = mi.id
      WHERE roi.orderId = ? AND roi.productId IS NOT NULL AND roi.packageId IS NULL`;

    // Updated query for billing information to include fullname
    const billingQuery = 
      `SELECT 
        ro.title,
        ro.fullname, -- Added fullname from retailorder
        ro.phonecode1,
        ro.phone1,
        hdd.buildingType,
        hdd.houseNo,
        hdd.street,
        hdd.city
      FROM retailorder ro
      LEFT JOIN homedeliverydetails hdd ON ro.homedeliveryId = hdd.id
      WHERE ro.id = ? AND ro.userId = ?
      LIMIT 1`;

    // Execute main invoice query
    marketPlace.query(invoiceQuery, [orderId, userId], (err, invoiceResult) => {
      if (err) {
        return reject("Error fetching invoice: " + err);
      }
      if (!invoiceResult || invoiceResult.length === 0) {
        return resolve(null); // No invoice found
      }

      const invoice = invoiceResult[0];

      // Fetch family pack items
      marketPlace.query(familyPackItemsQuery, [orderId], (err, familyPackItems) => {
        if (err) {
          return reject("Error fetching family pack items: " + err);
        }

        // Fetch additional items
        marketPlace.query(additionalItemsQuery, [orderId], (err, additionalItems) => {
          if (err) {
            return reject("Error fetching additional items: " + err);
          }

          // Fetch billing information
          marketPlace.query(billingQuery, [orderId, userId], (err, billingResult) => {
            if (err) {
              return reject("Error fetching billing information: " + err);
            }

            const billingInfo = billingResult[0] || {};

            // Calculate totals
            const familyPackTotal = familyPackItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2);
            const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toFixed(2);
            const deliveryFee = invoice.deliveryMethod.toLowerCase() === 'delivery' ? '50.00' : '0.00';
            const grandTotal = (parseFloat(familyPackTotal) + parseFloat(additionalItemsTotal) + parseFloat(deliveryFee)).toFixed(2);

            // Construct the invoice object
            const invoiceData = {
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.invoiceDate,
              scheduledDate: invoice.scheduledDate,
              deliveryMethod: invoice.deliveryMethod,
              paymentMethod: invoice.paymentMethod || 'N/A',
              amountDue: invoice.amountDue,
              familyPackItems,
              additionalItems,
              familyPackTotal: familyPackTotal || '0.00',
              additionalItemsTotal: additionalItemsTotal || '0.00',
              deliveryFee,
              grandTotal,
              billingInfo: {
                title: billingInfo.title || 'N/A',
                fullName: billingInfo.fullname || 'N/A', // Map fullname to fullName
                buildingType: billingInfo.buildingType || 'N/A',
                houseNo: billingInfo.houseNo || 'N/A',
                street: billingInfo.street || 'N/A',
                city: billingInfo.city || 'N/A',
                phone: billingInfo.phone1 ? `+${billingInfo.phonecode1 || ''} ${billingInfo.phone1}` : 'N/A',
              },
            };

            resolve(invoiceData);
          });
        });
      });
    });
  });
};


// Export the DAO
module.exports = {
  getRetailOrderByIdDao,
   getRetailOrderHistoryDao,
   getRetailOrderInvoiceByIdDao, // Include the existing function
};