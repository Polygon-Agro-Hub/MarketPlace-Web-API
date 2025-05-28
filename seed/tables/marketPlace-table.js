const { db, plantcare, collectionofficer, marketPlace } = require('../../startup/database');




const createMarketPlaceUsersTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketplaceusers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      googleId VARCHAR(255) DEFAULT NULL,
      title VARCHAR(5) DEFAULT NULL,
      firstName VARCHAR(50) DEFAULT NULL,
      lastName VARCHAR(50) DEFAULT NULL,
      phoneCode VARCHAR(5) DEFAULT NULL,
      phoneNumber VARCHAR(12) DEFAULT NULL,
      buyerType VARCHAR(12) DEFAULT NULL,
      email VARCHAR(50) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      image TEXT DEFAULT NULL,
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




const createUserAddressItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS useraddress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      title VARCHAR(5) DEFAULT NULL,
      fullName VARCHAR(255) DEFAULT NULL,
      buildingType VARCHAR(25) DEFAULT NULL,
      houseNo VARCHAR(25) DEFAULT NULL,
      street VARCHAR(50) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL,
      phonecode1 VARCHAR(5) DEFAULT NULL,
      phone1 VARCHAR(15) DEFAULT NULL,
      phonecode2 VARCHAR(5) DEFAULT NULL,
      phone2 VARCHAR(15) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating user address table: ' + err);
            } else {
                resolve('user address table created successfully.');
            }
        });
    });
};



const createRetailCart = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS retailcart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      packageId INT DEFAULT NULL,
      packageItemId INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      unit VARCHAR(5) DEFAULT NULL,
      qty DECIMAL(6, 2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageItemId) REFERENCES packagedetails(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productId) REFERENCES marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating retail cart table: ' + err);
            } else {
                resolve('retail cart table created successfully.');
            }
        });
    });
};




const createHomeDeliveryDetails = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS homedeliverydetails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buildingType VARCHAR(25) DEFAULT NULL,
      houseNo VARCHAR(25) DEFAULT NULL,
      street VARCHAR(50) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL      
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating home delivery table: ' + err);
            } else {
                resolve('home delivery table created successfully.');
            }
        });
    });
};


const createRetailOrder = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS retailorder (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      delivaryMethod VARCHAR(25) DEFAULT NULL,
      centerId INT DEFAULT NULL,
      homedeliveryId INT DEFAULT NULL,
      title VARCHAR(5) DEFAULT NULL,
      phonecode1 VARCHAR(5) DEFAULT NULL,
      phone1 VARCHAR(15) DEFAULT NULL,
      phonecode2 VARCHAR(5) DEFAULT NULL,
      phone2 VARCHAR(15) DEFAULT NULL,
      isCoupon BOOLEAN DEFAULT FALSE,
      couponValue DECIMAL(15, 2) DEFAULT 0,
      total DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      sheduleType VARCHAR(25) DEFAULT NULL,
      sheduleDate TIMESTAMP DEFAULT NULL,
      sheduleTime DATETIME DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (homedeliveryId) REFERENCES homedeliverydetails(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (centerId) REFERENCES collection_officer.collectioncenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating retail order table: ' + err);
            } else {
                resolve('retail order table created successfully.');
            }
        });
    });
};


const createRetailOrderItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS retailorderitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      packageId INT DEFAULT NULL,
      packageItemId INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      unit VARCHAR(5) DEFAULT NULL,
      qty DECIMAL(6, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      price DECIMAL(15, 2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES retailorder(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageItemId) REFERENCES packagedetails(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productId) REFERENCES marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating retail order items table: ' + err);
            } else {
                resolve('retail order items table created successfully.');
            }
        });
    });
};

const createProcessRetailOrders = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS processretailorders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      transactionId VARCHAR(50) DEFAULT NULL,
      paymentMethod VARCHAR(25) DEFAULT NULL,
      isPaid BOOLEAN DEFAULT FALSE,
      amount DECIMAL(15, 2) DEFAULT NULL,
      status VARCHAR(25) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES retailorder(id)
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


const createBanners = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indexId INT DEFAULT NULL,
      details VARCHAR(50) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      type VARCHAR(25) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating banners table: ' + err);
            } else {
                resolve('banners table created successfully.');
            }
        });
    });
};





module.exports = {
    createMarketPlaceUsersTable,
    createMarketPlacePackages,
    createCoupon,
    createMarketPlaceItems,
    createPackageDetails,
    createPromoItems,
    // createCart,
    // createCartItems,
    createUserAddressItems,
    createRetailCart,
    createHomeDeliveryDetails,
    createRetailOrder,
    createRetailOrderItems,
    createProcessRetailOrders,
    createBanners
};