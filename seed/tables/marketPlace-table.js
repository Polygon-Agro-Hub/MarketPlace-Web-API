const { db, plantcare, collectionofficer, marketPlace } = require('../../startup/database');



// const createMarketPlaceUsersTable = () => {
//     const sql = `
//     CREATE TABLE IF NOT EXISTS marketplaceusers (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       firstName VARCHAR(50) DEFAULT NULL,
//       lastName VARCHAR(50) DEFAULT NULL,
//       phoneNumber VARCHAR(12) DEFAULT NULL,
//       NICnumber VARCHAR(12) DEFAULT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `;
//     return new Promise((resolve, reject) => {
//         marketPlace.query(sql, (err, result) => {
//             if (err) {
//                 reject('Error creating market place users table: ' + err);
//             } else {
//                 resolve('market place users table created successfully.');
//             }
//         });
//     });
// };
const createMarketPlaceUsersTable = () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS marketplaceusers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(10) DEFAULT NULL,
            firstName VARCHAR(50) DEFAULT NULL,
            lastName VARCHAR(50) DEFAULT NULL,
            phoneNumber VARCHAR(15) DEFAULT NULL, -- Adjusted size for phone numbers
            NICnumber VARCHAR(15) DEFAULT NULL, -- Adjusted size for NIC numbers
            email VARCHAR(100) UNIQUE NOT NULL, -- Ensured unique email
            password VARCHAR(255) DEFAULT NULL,
            profilePicture VARCHAR(255) DEFAULT NULL, -- Profile picture file path/filename 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market place users table: ' + err);
            } else {
                resolve('Market place users table created successfully.');
            }
        });
    });
};

const createBillingDetailsTable = () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS billing_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            title VARCHAR(10) DEFAULT NULL,
            firstName VARCHAR(50) DEFAULT NULL,
            buildingNo VARCHAR(50) DEFAULT NULL,
            streetName VARCHAR(100) DEFAULT NULL,
            buildingType VARCHAR(50) DEFAULT NULL,
            city VARCHAR(50) DEFAULT NULL,
            phoneCode1 VARCHAR(10) DEFAULT NULL,
            phoneNumber1 VARCHAR(20) DEFAULT NULL,
            phoneCode2 VARCHAR(10) DEFAULT NULL,
            phoneNumber2 VARCHAR(20) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES marketplaceusers(id) ON DELETE CASCADE
        )
    `;

    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating billing details table: ' + err);
            } else {
                resolve('Billing details table created successfully.');
            }
        });
    });
};



const createMarketPlacePackages = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketplacepackages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      displayName VARCHAR(50) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      status VARCHAR(10) DEFAULT NULL,
      total DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      subTotal DECIMAL(15, 2) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market place users package: ' + err);
            } else {
                resolve('market place package table created successfully.');
            }
        });
    });
};

const createCoupon = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS coupon(
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(25) DEFAULT NULL,
      type VARCHAR(25) DEFAULT NULL,
      percentage DECIMAL(15, 2) DEFAULT NULL,
      status VARCHAR(25) DEFAULT NULL,
      checkLimit Boolean DEFAULT NULL,
      priceLimit DECIMAL(15,2) DEFAULT NULL,
      fixDiscount DECIMAL(15,2) DEFAULT NULL,
      startDate DATETIME DEFAULT NULL,
      endDate DATETIME DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating coupen table: ' + err);
            } else {
                resolve('coupen table created successfully.');
            }
      });
});
};


const createMarketPlaceItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketplaceitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      varietyId INT,
      displayName VARCHAR(50) DEFAULT NULL,
      category VARCHAR(25) DEFAULT NULL,
      normalPrice DECIMAL(15, 2) DEFAULT NULL,
      discountedPrice DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      promo BOOLEAN  DEFAULT NULL,
      unitType VARCHAR(5) DEFAULT NULL,
      startValue DECIMAL(15, 2) DEFAULT NULL,
      changeby DECIMAL(15, 2) DEFAULT NULL,
      displayType VARCHAR(11) DEFAULT NULL,
      tags TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (varietyId) REFERENCES plant_care.cropvariety(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market place items table: ' + err);
            } else {
                resolve('market place items table created successfully.');
            }
        });
    });
};


const createPackageDetails = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS packagedetails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      packageId INT DEFAULT NULL,
      mpItemId INT DEFAULT NULL,
      quantity INT(11) DEFAULT NULL,
      quantityType VARCHAR(5) DEFAULT NULL,
      price DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15,2) DEFAULT NULL,
      discountedPrice DECIMAL(15,2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (mpItemId) REFERENCES marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating package details table: ' + err);
            } else {
                resolve('package details table created successfully.');
            }
        });
    });
};


const createPromoItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS promoitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mpItemId INT DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mpItemId) REFERENCES marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating promo items table: ' + err);
            } else {
                resolve('promo items table created successfully.');
            }
        });
    });
};


const createCart = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      status VARCHAR(13) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES plant_care.users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating cart table: ' + err);
            } else {
                resolve('cart table created successfully.');
            }
        });
    });
};


const createCartItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cartitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cartId INT DEFAULT NULL,
      mpItemId INT DEFAULT NULL,
      quantity DECIMAL(15, 2) DEFAULT NULL,
      total DECIMAL(15, 2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cartId) REFERENCES cart(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (mpItemId) REFERENCES marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating cart table: ' + err);
            } else {
                resolve('cart table created successfully.');
            }
        });
    });
};






module.exports = {
    createMarketPlaceUsersTable,
    createBillingDetailsTable,
    createMarketPlacePackages,
    createCoupon,
    createMarketPlaceItems,
    createPackageDetails,
    createPromoItems,
    createCart,
    createCartItems,
};

