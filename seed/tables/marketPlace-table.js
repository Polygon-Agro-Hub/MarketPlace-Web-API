const { db, plantcare, collectionofficer, marketPlace } = require('../../startup/database');


const createSalesAgentTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS salesagent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) DEFAULT NULL,
    lastName VARCHAR(100) DEFAULT NULL,
    empType VARCHAR(50) DEFAULT NULL,
    empId VARCHAR(50) DEFAULT NULL,
    phoneCode1 VARCHAR(10) DEFAULT NULL,
    phoneNumber1 VARCHAR(15) DEFAULT NULL,
    phoneCode2 VARCHAR(10) DEFAULT NULL,
    phoneNumber2 VARCHAR(15) DEFAULT NULL,
    nic VARCHAR(50) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    houseNumber VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    district VARCHAR(100) DEFAULT NULL,
    province VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    accHolderName VARCHAR(100) DEFAULT NULL,
    accNumber VARCHAR(50) DEFAULT NULL,
    bankName VARCHAR(100) DEFAULT NULL,
    branchName VARCHAR(100) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    password VARCHAR(255),
    passwordUpdate BOOLEAN DEFAULT 0,
    image TEXT DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating salesagent table: ' + err);
            } else {
                resolve('salesagent table created request successfully.');
            }
        });
    });
};

const createSalesAgentStarTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS salesagentstars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salesagentId INT DEFAULT NULL,
    date DATE DEFAULT NULL,
    target INT DEFAULT NULL,
    completed INT DEFAULT NULL,
    numOfStars BOOLEAN NOT NULL DEFAULT 0, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salesagentId) REFERENCES salesagent(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating salesagentstars table: ' + err);
            } else {
                resolve('ssalesagentstars table created request successfully.');
            }
        });
    });
};


const createMarketPlaceUsersTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketplaceusers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      salesAgent INT DEFAULT NULL,
      googleId VARCHAR(255) DEFAULT NULL,
      cusId VARCHAR(15) DEFAULT NULL,
      title VARCHAR(5) DEFAULT NULL,
      firstName VARCHAR(50) DEFAULT NULL,
      lastName VARCHAR(50) DEFAULT NULL,
      phoneCode VARCHAR(5) DEFAULT NULL,
      phoneCode2 VARCHAR(5) DEFAULT NULL,
      phoneNumber VARCHAR(12) DEFAULT NULL,      
      phoneNumber2 VARCHAR(12) DEFAULT NULL,      
      buyerType VARCHAR(12) DEFAULT NULL,
      email VARCHAR(50) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      isDashUser BOOLEAN DEFAULT 0,
      buildingType VARCHAR(20) DEFAULT NULL,
      billingTitle VARCHAR(5) DEFAULT NULL,
      billingName VARCHAR(255) DEFAULT NULL,
      isSubscribe BOOLEAN DEFAULT 0,
      firstTimeUser BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesAgent) REFERENCES salesagent(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market place users table: ' + err);
            } else {
                resolve('market place users table created successfully.');
            }
        });
    });
};


const createHouseTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS house (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT DEFAULT NULL,
    houseNo VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (customerId) REFERENCES marketplaceusers(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating house table: ' + err);
            } else {
                resolve('house table created request successfully.');
            }
        });
    });
};


const createApartmentTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS apartment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT DEFAULT NULL,
    buildingNo VARCHAR(50) DEFAULT NULL,
    buildingName VARCHAR(100) DEFAULT NULL,
    unitNo VARCHAR(50) DEFAULT NULL,
    floorNo VARCHAR(10) DEFAULT NULL,
    houseNo VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (customerId) REFERENCES marketplaceusers(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating apartment table: ' + err);
            } else {
                resolve('apartment table created request successfully.');
            }
        });
    });
};


const createtargetTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS target (
    id INT AUTO_INCREMENT PRIMARY KEY,
    createdBy INT DEFAULT NULL,
    targetValue DECIMAL(10,2) DEFAULT NULL,
    startDate TIMESTAMP DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES agro_world_admin.adminusers(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating target table: ' + err);
            } else {
                resolve('target table created successfully.');
            }
        });
    });
};


const createProductTypes = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS producttypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      typeName VARCHAR(50) DEFAULT NULL,
      shortCode VARCHAR(5) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market place product types: ' + err);
            } else {
                resolve('market place product types table created successfully.');
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
      productPrice DECIMAL(15, 2) DEFAULT NULL,
      packingFee DECIMAL(15, 2) DEFAULT NULL,
      serviceFee DECIMAL(15, 2) DEFAULT NULL,
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

const createPackageDetails = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS packagedetails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      packageId INT DEFAULT NULL,
      productTypeId INT DEFAULT NULL,
      qty INT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productTypeId) REFERENCES producttypes(id)
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




//cart table
const createCart = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      buyerType VARCHAR(12) DEFAULT NULL,
      isCoupon BOOLEAN DEFAULT 0,
      couponValue DECIMAL(15, 2) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
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

//cart items table
const createCartAdditionalItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cartadditionalitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cartId INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      qty DECIMAL(15,2) DEFAULT NULL,
      unit VARCHAR(5) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cartId) REFERENCES cart(id)
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
                reject('Error creating Cart Additional items table: ' + err);
            } else {
                resolve('Cart Additional items table created successfully.');
            }
        });
    });
};

//cart package items table
const createCartpackage = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cartpackage (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cartId INT DEFAULT NULL,
      packageId INT DEFAULT NULL,
      qty INT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cartId) REFERENCES cart(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating package cart table: ' + err);
            } else {
                resolve('package cart table created successfully.');
            }
        });
    });
};




const createOrder = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      orderApp VARCHAR(25) DEFAULT NULL,
      delivaryMethod VARCHAR(25) DEFAULT NULL,
      centerId INT DEFAULT NULL,
      buildingType VARCHAR(50) DEFAULT NULL,
      title VARCHAR(5) DEFAULT NULL,
      fullName VARCHAR(255) DEFAULT NULL,
      phonecode1 VARCHAR(5) DEFAULT NULL,
      phone1 VARCHAR(15) DEFAULT NULL,
      phonecode2 VARCHAR(5) DEFAULT NULL,
      phone2 VARCHAR(15) DEFAULT NULL,
      isCoupon BOOLEAN DEFAULT FALSE,
      couponValue DECIMAL(15, 2) DEFAULT 0,
      total DECIMAL(15, 2) DEFAULT NULL,
      fullTotal DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      sheduleType VARCHAR(25) DEFAULT NULL,
      sheduleDate TIMESTAMP DEFAULT NULL,
      sheduleTime VARCHAR(15) DEFAULT NULL,
      isPackage BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (centerId) REFERENCES collection_officer.distributedcenter(id)
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


const createOrderHouseTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderhouse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    houseNo VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating order house table: ' + err);
            } else {
                resolve('order house table created request successfully.');
            }
        });
    });
};







const createOrderApartmentTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderapartment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    buildingNo VARCHAR(50) DEFAULT NULL,
    buildingName VARCHAR(100) DEFAULT NULL,
    unitNo VARCHAR(50) DEFAULT NULL,
    floorNo VARCHAR(10) DEFAULT NULL,
    houseNo VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating order apartment table: ' + err);
            } else {
                resolve('order apartment table created request successfully.');
            }
        });
    });
};


const createOrderAdditionalItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderadditionalitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      qty DECIMAL(15,2) DEFAULT NULL,
      unit VARCHAR(5) DEFAULT NULL,
      price DECIMAL(15,2) DEFAULT NULL,
      discount DECIMAL(15,2) DEFAULT NULL,
      isPacked BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
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
                reject('Error creating Order Additional items table: ' + err);
            } else {
                resolve('Order Additional items table created successfully.');
            }
        });
    });
};


const createOrderpackage = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderpackage (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      packageId INT DEFAULT NULL,
      packingStatus VARCHAR(10) DEFAULT 'Todo',
      isLock BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES processorders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating package orderpackage  table: ' + err);
            } else {
                resolve('package orderpackage table created successfully.');
            }
        });
    });
};


const createOrderpackageItems = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderpackageitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderPackageId INT DEFAULT NULL,
      productType INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      qty DECIMAL(8,3) DEFAULT NULL,
      price DECIMAL(8,2) DEFAULT NULL,
      isPacked BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderPackageId) REFERENCES orderpackage(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productType) REFERENCES producttypes(id)
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
                reject('Error creating order package items table: ' + err);
            } else {
                resolve('order package items table created successfully.');
            }
        });
    });
};



const createProcessRetailOrders = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS processorders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      invNo VARCHAR(13) DEFAULT NULL,
      transactionId VARCHAR(50) DEFAULT NULL,
      paymentMethod VARCHAR(25) DEFAULT NULL,
      isPaid BOOLEAN DEFAULT FALSE,
      amount DECIMAL(15, 2) DEFAULT NULL,
      status VARCHAR(25) DEFAULT NULL,
      reportStatus VARCHAR(25) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
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


const createmarketPlaceNotificationTable = () => {
    const sql = `
    CREATE TABLE marketPlacenotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    title VARCHAR(50) DEFAULT NULL,
    readStatus BOOLEAN NOT NULL DEFAULT 0, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES processorders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating marketPlacenotification table: ' + err);
            } else {
                resolve('marketPlacenotification table created successfully.');
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


const createResetPasswordTokenTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS resetpasswordtoken (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT DEFAULT NULL,
    resetPasswordToken VARCHAR(255) DEFAULT NULL,
    resetPasswordExpires TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating reset password token table: ' + err);
            } else {
                resolve('reset password token table created successfully.');
            }
        });
    });
};


const createDashcomplainTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS dashcomplain (
        id INT(11) NOT NULL AUTO_INCREMENT,
        saId INT(11) NOT NULL,  
        refNo VARCHAR(20) NOT NULL,
        language VARCHAR(50) NOT NULL,
        complainCategory INT DEFAULT NULL,
        complain TEXT NOT NULL,
        reply TEXT,
        status VARCHAR(20) NOT NULL,
        adminStatus VARCHAR(20) NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),  
        FOREIGN KEY (saId) REFERENCES salesagent(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (complainCategory) REFERENCES agro_world_admin.complaincategory(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating dashcomplain table: ' + err);
            } else {
                resolve('dashcomplain table created request successfully.');
            }
        });
    });
};


const createDashNotificationTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS dashnotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    title VARCHAR(50) DEFAULT NULL,
    readStatus BOOLEAN NOT NULL DEFAULT 0, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES processorders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating dashnotification table: ' + err);
            } else {
                resolve('dashnotification table created successfully.');
            }
        });
    });
};


const createMarketPlaceComplainTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marcketplacecomplain (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      complaicategoryId INT DEFAULT NULL,
      complain TEXT DEFAULT NULL,
      reply TEXT DEFAULT NULL,
      status VARCHAR(25) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (complaicategoryId) REFERENCES agro_world_admin.complaincategory(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating marcketplace complain table: ' + err);
            } else {
                resolve('marcketplace complain table created successfully.');
            }
        });
    });
};

const createMarketPlaceComplainImagesTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marcketplacecomplainimages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complainId INT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complainId) REFERENCES marcketplacecomplain(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating marcketplace complain items table: ' + err);
            } else {
                resolve('marcketplace complain items table created successfully.');
            }
        });
    });
};


const createExcludeList = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS excludelist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      mpItemId INT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES marketplaceusers(id)
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
                reject('Error creating promo items table: ' + err);
            } else {
                resolve('promo items table created successfully.');
            }
        });
    });
};


const createReplaceRequests = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS replacerequest (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderPackageId INT DEFAULT NULL,
      replceId INT DEFAULT NULL,
      productType INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      qty DECIMAL(8,3) DEFAULT NULL,
      price DECIMAL(8,2) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderPackageId) REFERENCES orderpackage(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (replceId) REFERENCES orderpackageitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productType) REFERENCES producttypes(id)
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
                reject('Error creating order package items table: ' + err);
            } else {
                resolve('order package items table created successfully.');
            }
        });
    });
};


const createDefinePackageTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS definePackage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    packageId INT DEFAULT NULL,
    price DECIMAL(15, 2) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        marketPlace.query(sql, (err, result) => {
            if (err) {
                reject('Error creating definePackage table: ' + err);
            } else {
                resolve('definePackage table created successfully.');
            }
        });
    });
};

const createDefinePackageItemsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS definepackageitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      definePackageId INT DEFAULT NULL,
      productType INT DEFAULT NULL,
      productId INT DEFAULT NULL,
      qty DECIMAL(8,3) DEFAULT NULL,
      price DECIMAL(8,2) DEFAULT NULL,
      FOREIGN KEY (definePackageId) REFERENCES definePackage(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productType) REFERENCES producttypes(id)
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
                reject('Error creating definePackage table: ' + err);
            } else {
                resolve('definePackage table created successfully.');
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
    createProcessRetailOrders,
    createBanners,
    createHouseTable,
    createApartmentTable,
    createProductTypes,
    createCart,
    createCartAdditionalItems,
    createCartpackage,
    createOrder,
    createOrderHouseTable,
    createOrderApartmentTable,
    createOrderAdditionalItems,
    createOrderpackage,
    createOrderpackageItems,
    createResetPasswordTokenTable,

    //marketPlace tables
    createSalesAgentTable,
    createSalesAgentStarTable,
    createtargetTable,
    createmarketPlaceNotificationTable,
    createDashcomplainTable,
    createDashNotificationTable,
    createMarketPlaceComplainTable,
    createMarketPlaceComplainImagesTable,
    createReplaceRequests,
    createDefinePackageTable,
    createDefinePackageItemsTable,
    createExcludeList
};