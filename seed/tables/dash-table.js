const { db, plantcare, dash } = require('../../startup/database');


const createSalesAgentTable = () => {
    const sql = `
    CREATE TABLE salesagent (
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
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
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
    CREATE TABLE salesagentstars (
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
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating salesagentstars table: ' + err);
            } else {
                resolve('ssalesagentstars table created request successfully.');
            }
        });
    });
};






const createCustomerTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cusId VARCHAR(15) UNIQUE DEFAULT NULL,
    salesAgent INT DEFAULT NULL,
    title VARCHAR(10) DEFAULT NULL,
    firstName VARCHAR(50) DEFAULT NULL,
    lastName VARCHAR(50) DEFAULT NULL,
    phoneNumber VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) UNIQUE DEFAULT NULL,
    buildingType VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (salesAgent) REFERENCES salesagent(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE 
)
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating customer table: ' + err);
            } else {
                resolve('customer table created request successfully.');
            }
        });
    });
};





const createHouseTable  = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS house (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT DEFAULT NULL,
    houseNo VARCHAR(50) DEFAULT NULL,
    streetName VARCHAR(100) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (customerId) REFERENCES customer(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
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
    FOREIGN KEY (customerId) REFERENCES customer(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating apartment table: ' + err);
            } else {
                resolve('apartment table created request successfully.');
            }
        });
    });
};



const createDashcomplainTable = () => {
    const sql = `
    CREATE TABLE dashcomplain (
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
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating dashcomplain table: ' + err);
            } else {
                resolve('dashcomplain table created request successfully.');
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
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating target table: ' + err);
            } else {
                resolve('target table created successfully.');
            }
        });
    });
};



const createOrdersTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customerId INT DEFAULT NULL,
      salesAgentId INT DEFAULT NULL,
      invNo VARCHAR(13) DEFAULT NULL,
      customPackage BOOLEAN DEFAULT NULL,
      selectedPackage BOOLEAN DEFAULT NULL,
      deliveryType VARCHAR(13) DEFAULT NULL,
      scheduleDate TIMESTAMP DEFAULT NULL,
      scheduleTimeSlot VARCHAR(25) DEFAULT NULL,
      paymentMethod VARCHAR(25) DEFAULT NULL,
      paymentStatus BOOLEAN DEFAULT NULL,
      orderStatus VARCHAR(25) DEFAULT NULL, -- Placed, Processing, On way, Delivered, Cancelled
      fullTotal DECIMAL(15, 2) DEFAULT NULL,
      fullDiscount DECIMAL(15, 2) DEFAULT NULL,
      fullSubTotal DECIMAL(15, 2) DEFAULT NULL,
      deleteStatus BOOLEAN DEFAULT NULL,
      packageStatus VARCHAR(20) DEFAULT 'Pending',
      addItemStatus VARCHAR(11) DEFAULT 'Pending',
      packItemStatus VARCHAR(11) DEFAULT 'Pending',
      reportStatus VARCHAR(25) DEFAULT NULL, -- Confirmed, Not Confirmed, Not Answerd Cancelled
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES customer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (salesAgentId) REFERENCES salesagent(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating orders table: ' + err);
            } else {
                resolve('orders table created successfully.');
            }
        });
    });
};


const createOrderSelectedItemsTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderselecteditems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      mpItemId INT DEFAULT NULL,
      quantity DECIMAL(15, 2) DEFAULT NULL,
      unitType VARCHAR(5) DEFAULT NULL,
      total DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      subtotal DECIMAL(15, 2) DEFAULT NULL,
      isPacked BOOLEAN DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (mpItemId) REFERENCES market_place.marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating orderselecteditems table: ' + err);
            } else {
                resolve('orderselecteditems table created successfully.');
            }
        });
    });
};

const createOrderPackageItemsTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS orderpackageitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT DEFAULT NULL,
      packageId INT DEFAULT NULL,
      isModifiedPlus BOOLEAN DEFAULT NULL,
      isModifiedMin BOOLEAN DEFAULT NULL,
      isAdditionalItems BOOLEAN DEFAULT NULL,
      packageTotal DECIMAL(15, 2) DEFAULT NULL,
      packageDiscount DECIMAL(15, 2) DEFAULT NULL,
      packageSubTotal DECIMAL(15, 2) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageId) REFERENCES market_place.marketplacepackages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating orderpackageitems table: ' + err);
            } else {
                resolve('orderpackageitems table created successfully.');
            }
        });
    });
};



const createModifiedPlustemsTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS modifiedplusitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderPackageItemsId INT DEFAULT NULL,
      packageDetailsId INT DEFAULT NULL,
      originalQuantity INT(11) DEFAULT NULL,
      modifiedQuantity int DEFAULT NULL,
      originalPrice DECIMAL(15, 2) DEFAULT NULL,
      additionalPrice DECIMAL(15, 2) DEFAULT NULL,
      additionalDiscount DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (orderPackageItemsId) REFERENCES orderpackageitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageDetailsId) REFERENCES market_place.packagedetails(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating modifiedplusitems table: ' + err);
            } else {
                resolve('modifiedplusitems table created successfully.');
            }
        });
    });
};



const createModifiedMintemsTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS modifiedminitems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderPackageItemsId INT DEFAULT NULL,
      packageDetailsId INT DEFAULT NULL,
      originalQuantity INT(11) DEFAULT NULL,
      modifiedQuantity int DEFAULT NULL,
      originalPrice DECIMAL(15, 2) DEFAULT NULL,
      additionalPrice DECIMAL(15, 2) DEFAULT NULL,
      additionalDiscount DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (orderPackageItemsId) REFERENCES orderpackageitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (packageDetailsId) REFERENCES market_place.packagedetails(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating modifiedminitems table: ' + err);
            } else {
                resolve('modifiedminitems table created successfully.');
            }
        });
    });
};



const createAdditionaltemsTable= () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS additionalitem (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderPackageItemsId INT DEFAULT NULL,
      mpItemId int DEFAULT NULL,
      quantity DECIMAL(15, 2) DEFAULT NULL,
      unitType VARCHAR(5) DEFAULT NULL,
      total DECIMAL(15, 2) DEFAULT NULL,
      discount DECIMAL(15, 2) DEFAULT NULL,
      subtotal DECIMAL(15, 2) DEFAULT NULL,
      isPacked BOOLEAN DEFAULT 0,
      FOREIGN KEY (orderPackageItemsId) REFERENCES orderpackageitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (mpItemId) REFERENCES market_place.marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating additional item table: ' + err);
            } else {
                resolve('additional item table created successfully.');
            }
        });
    });
};




const createDashNotificationTable= () => {
    const sql = `
    CREATE TABLE dashnotification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    title VARCHAR(50) DEFAULT NULL,
    readStatus BOOLEAN NOT NULL DEFAULT 0, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating dashnotification table: ' + err);
            } else {
                resolve('dashnotification table created successfully.');
            }
        });
    });
};

const createfinalPackageListTable= () => {
    const sql = `
    CREATE TABLE finalorderpackagelist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT DEFAULT NULL,
    productId INT DEFAULT NULL,
    quantity DECIMAL(15, 2) DEFAULT NULL,
    price DECIMAL(15, 2) DEFAULT NULL,
    isPacking BOOLEAN NOT NULL DEFAULT 0, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (productId) REFERENCES market_place.marketplaceitems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        dash.query(sql, (err, result) => {
            if (err) {
                reject('Error creating finalorderpackagelist table: ' + err);
            } else {
                resolve('finalorderpackagelist table created successfully.');
            }
        });
    });
};




module.exports = {
    createSalesAgentTable,
    createSalesAgentStarTable,
    createCustomerTable,
    createHouseTable,
    createApartmentTable,
    createDashcomplainTable,
    createtargetTable,

    createOrdersTable,
    createOrderSelectedItemsTable,
    createOrderPackageItemsTable,
    createfinalPackageListTable,
    
    createModifiedPlustemsTable,
    createModifiedMintemsTable,
    createAdditionaltemsTable,

    createDashNotificationTable
};