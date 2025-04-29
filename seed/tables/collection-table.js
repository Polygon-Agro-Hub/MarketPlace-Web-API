const { plantcare, collectionofficer } = require('../../startup/database');


const createCollectionCenter = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS collectioncenter (
      id INT AUTO_INCREMENT PRIMARY KEY,
      regCode VARCHAR(30) DEFAULT NULL,
      centerName VARCHAR(30) DEFAULT NULL,
      code1 VARCHAR(5) DEFAULT NULL,
      contact01 VARCHAR(13) DEFAULT NULL,
      code2 VARCHAR(5) DEFAULT NULL,
      contact02 VARCHAR(13) DEFAULT NULL,
      buildingNumber VARCHAR(50) DEFAULT NULL,
      street VARCHAR(50) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL,
      district VARCHAR(30) DEFAULT NULL,
      province VARCHAR(30) DEFAULT NULL,
      country VARCHAR(30) DEFAULT NULL,
      companies VARCHAR(30) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating collection center table: ' + err);
            } else {
                resolve('collection center table created successfully.');
            }
        });
    });
};


const createXlsxHistoryTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS xlsxhistory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      xlName VARCHAR(50) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating xlsx history table: ' + err);
            } else {
                resolve('xlsx history table created successfully.');
            }
        });
    });
};






const createMarketPriceTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketprice (
      id INT AUTO_INCREMENT PRIMARY KEY,
      varietyId INT(11) DEFAULT NULL,
      xlindex INT(11) DEFAULT NULL,
      grade VARCHAR(1) DEFAULT NULL,
      price DECIMAL(15,2) DEFAULT NULL,
      averagePrice DECIMAL(15,2) DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (varietyId) REFERENCES plant_care.cropvariety(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (xlindex) REFERENCES xlsxhistory(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market-price table: ' + err);
            } else {
                resolve('market-price table created successfully.');
            }
        });
    });
};





const createMarketPriceServeTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketpriceserve (
      id INT AUTO_INCREMENT PRIMARY KEY,
      marketPriceId INT(11) DEFAULT NULL,
      companyCenterId INT(11) DEFAULT NULL,
      xlindex INT(11) DEFAULT NULL,
      price DECIMAL(15,2) DEFAULT NULL,
      updatedPrice DECIMAL(15,2) DEFAULT NULL,
      updateAt TIMESTAMP DEFAULT NULL,
      FOREIGN KEY (marketPriceId) REFERENCES marketprice(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (companyCenterId) REFERENCES companycenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market price serve table: ' + err);
            } else {
                resolve('mmarket price serve table created successfully.');
            }
        });
    });
};





const createCompany = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS company (
      id INT AUTO_INCREMENT PRIMARY KEY,
      regNumber VARCHAR(50) DEFAULT NULL,
      companyNameEnglish VARCHAR(50) DEFAULT NULL,
      companyNameSinhala VARCHAR(50) DEFAULT NULL,
      companyNameTamil VARCHAR(50) DEFAULT NULL,
      email VARCHAR(50) DEFAULT NULL,
      oicName VARCHAR(50) DEFAULT NULL,
      oicEmail VARCHAR(50) DEFAULT NULL,
      oicConCode1 VARCHAR(5) DEFAULT NULL,
      oicConNum1 VARCHAR(12) DEFAULT NULL,
      oicConCode2 VARCHAR(5) DEFAULT NULL,
      oicConNum2 VARCHAR(12) DEFAULT NULL,
      accHolderName VARCHAR(50) DEFAULT NULL,
      accNumber VARCHAR(30) DEFAULT NULL,
      bankName VARCHAR(30) DEFAULT NULL,
      branchName VARCHAR(30) DEFAULT NULL,
      foName VARCHAR(50) DEFAULT NULL,
      foConCode VARCHAR(5) DEFAULT NULL,
      foConNum VARCHAR(12) DEFAULT NULL,
      foEmail VARCHAR(50) DEFAULT NULL,
      status BOOLEAN DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ccompany: ' + err);
            } else {
                resolve('company table created successfully.');
            }
        });
    });
};



//Collection officer tables

const createCollectionOfficer = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS collectionofficer (
      id INT AUTO_INCREMENT PRIMARY KEY,
      centerId INT DEFAULT NULL,
      companyId INT DEFAULT NULL,
      irmId INT DEFAULT NULL,
      firstNameEnglish VARCHAR(50) DEFAULT NULL,
      firstNameSinhala VARCHAR(50) DEFAULT NULL,
      firstNameTamil VARCHAR(50) DEFAULT NULL,
      lastNameEnglish VARCHAR(50) DEFAULT NULL,
      lastNameSinhala VARCHAR(50) DEFAULT NULL,
      lastNameTamil VARCHAR(50) DEFAULT NULL,
      jobRole VARCHAR(50) DEFAULT NULL,
      empId VARCHAR(10) DEFAULT NULL,
      empType VARCHAR(10) DEFAULT NULL,
      phoneCode01 VARCHAR(5) DEFAULT NULL,
      phoneNumber01 VARCHAR(12) DEFAULT NULL,
      phoneCode02 VARCHAR(5) DEFAULT NULL,
      phoneNumber02 VARCHAR(12) DEFAULT NULL,
      nic VARCHAR(12) DEFAULT NULL,
      email VARCHAR(50) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      passwordUpdated BOOLEAN DEFAULT NULL,
      houseNumber VARCHAR(10) DEFAULT NULL,
      streetName VARCHAR(50) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL,
      district VARCHAR(25) DEFAULT NULL,
      province VARCHAR(25) DEFAULT NULL,
      country VARCHAR(25) DEFAULT NULL,
      languages VARCHAR(255) DEFAULT NULL,
      accHolderName VARCHAR(75) DEFAULT NULL,
      accNumber VARCHAR(25) DEFAULT NULL,
      bankName VARCHAR(25) DEFAULT NULL,
      branchName VARCHAR(25) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      QRcode TEXT DEFAULT NULL,
      status VARCHAR(25) DEFAULT NULL,
      claimStatus BOOLEAN DEFAULT 1,
      onlineStatus BOOLEAN DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (centerId) REFERENCES collectioncenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (companyId) REFERENCES company(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (irmId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating collection officer table: ' + err);
            } else {
                resolve('collection officer table created successfully.');
            }
        });
    });
};





const createRegisteredFarmerPayments = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS registeredfarmerpayments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      collectionOfficerId INT DEFAULT NULL,
      invNo VARCHAR(255) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES plant_care.users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (collectionOfficerId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
      
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating registeredfarmerpayments table: ' + err);
            } else {
                resolve('registeredfarmerpayments table created successfully.');
            }
        });
    });
};


const createFarmerPaymensCrops = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS farmerpaymentscrops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      registerFarmerId INT DEFAULT NULL,
      cropId INT DEFAULT NULL,
      gradeAprice DECIMAL(15, 2) DEFAULT NULL,
      gradeBprice DECIMAL(15, 2) DEFAULT NULL,
      gradeCprice DECIMAL(15, 2) DEFAULT NULL,
      gradeAquan DECIMAL(15, 2) DEFAULT NULL,
      gradeBquan DECIMAL(15, 2) DEFAULT NULL,
      gradeCquan DECIMAL(15, 2) DEFAULT NULL,
      imageA TEXT DEFAULT NULL,
      imageB TEXT DEFAULT NULL,
      imageC TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registerFarmerId) REFERENCES registeredfarmerpayments(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (cropId) REFERENCES plant_care.cropvariety(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating farmerpaymentscrops table: ' + err);
            } else {
                resolve('farmerpaymentscrops table created successfully.');
            }
        });
    });
};



const createFarmerComplains  = () => {
    const sql = `
   CREATE TABLE IF NOT EXISTS farmercomplains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmerId INT DEFAULT NULL,
    coId INT DEFAULT NULL,
    complainCategory INT DEFAULT NULL,
    refNo VARCHAR(20) DEFAULT NULL,
    language VARCHAR(50) DEFAULT NULL,
    complain TEXT DEFAULT NULL,
    reply TEXT DEFAULT NULL,
    status VARCHAR(20) DEFAULT NULL,
    adminStatus VARCHAR(20) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmerId) REFERENCES plant_care.users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (coId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (complainCategory) REFERENCES agro_world_admin.complaincategory(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating farmercomplains table: ' + err);
            } else {
                resolve('farmercomplains table created successfully.');
            }
        });
    });
};






const createMarketPriceRequestTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS marketpricerequest (
      id INT AUTO_INCREMENT PRIMARY KEY,
      marketPriceId INT(11) DEFAULT NULL,
      centerId INT(11) DEFAULT NULL,
      requestPrice DECIMAL(10,2) DEFAULT NULL,
      status VARCHAR(20) DEFAULT NULL,
      empId INT(11) DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marketPriceId) REFERENCES marketprice(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (centerId) REFERENCES collectioncenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (empId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating market-price request table: ' + err);
            } else {
                resolve('market-price table created request successfully.');
            }
        });
    });
};





const createOfficerComplainsTable  = () => {
    const sql = `
   CREATE TABLE IF NOT EXISTS officercomplains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    officerId INT DEFAULT NULL,
    complainCategory INT DEFAULT NULL,
    refNo VARCHAR(20) DEFAULT NULL,
    language VARCHAR(50) DEFAULT NULL,
    complain TEXT DEFAULT NULL,
    reply TEXT DEFAULT NULL,
    COOStatus VARCHAR(20) DEFAULT NULL,
    CCMStatus VARCHAR(20) DEFAULT NULL,
    CCHstatus VARCHAR(20) DEFAULT NULL,
    AdminStatus VARCHAR(20) DEFAULT NULL,
    complainAssign VARCHAR(20) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officerId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (complainCategory) REFERENCES agro_world_admin.complaincategory(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating officercomplains table: ' + err);
            } else {
                resolve('officercomplains table created successfully.');
            }
        });
    });
};








const createCompanyCenterTable = () => {
    const sql = `
  CREATE TABLE IF NOT EXISTS companycenter (
      id INT AUTO_INCREMENT PRIMARY KEY,
      centerId INT(11) DEFAULT NULL,
      companyId INT(11) DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (centerId) REFERENCES collectioncenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (companyId) REFERENCES company(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating companycenter table: ' + err);
            } else {
                resolve('companycenter table created successfully.');
            }
        });
    });
};




const createCenterCropsTable = () => {
  const sql = `
CREATE TABLE IF NOT EXISTS centercrops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    companyCenterId INT(11) DEFAULT NULL,
    varietyId INT(11) DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (companyCenterId) REFERENCES companycenter(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    FOREIGN KEY (varietyId) REFERENCES  plant_care.cropvariety(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  )
`;
  return new Promise((resolve, reject) => {
      collectionofficer.query(sql, (err, result) => {
          if (err) {
              reject('Error creating center crops table: ' + err);
          } else {
              resolve('center crops table created successfully.');
          }
      });
  });
};



const createDailyTargetTable = () => {
  const sql = `
CREATE TABLE IF NOT EXISTS dailytarget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    companyCenterId INT(11) DEFAULT NULL,
    varietyId INT(11) DEFAULT NULL,
    grade VARCHAR(11) DEFAULT NULL,
    date TIMESTAMP DEFAULT NULL,
    assignStatus BOOLEAN DEFAULT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (companyCenterId) REFERENCES companycenter(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    FOREIGN KEY (varietyId) REFERENCES  plant_care.cropvariety(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  )
`;
  return new Promise((resolve, reject) => {
      collectionofficer.query(sql, (err, result) => {
          if (err) {
              reject('Error creating daily target table: ' + err);
          } else {
              resolve('daily target table created successfully.');
          }
      });
  });
};



const createOfficerTargetTable = () => {
  const sql = `
CREATE TABLE IF NOT EXISTS officertarget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dailyTargetId INT(11) DEFAULT NULL,
    officerId INT(11) DEFAULT NULL,
    target VARCHAR(11) DEFAULT NULL,
    complete VARCHAR(11) DEFAULT NULL,
    FOREIGN KEY (dailyTargetId) REFERENCES dailytarget(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    FOREIGN KEY (officerId) REFERENCES collectionofficer(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  )
`;
  return new Promise((resolve, reject) => {
      collectionofficer.query(sql, (err, result) => {
          if (err) {
              reject('Error creating officer target table: ' + err);
          } else {
              resolve('officer target table created successfully.');
          }
      });
  });
};







//new


const createCollectionRequest = () => {
    const sql = `
  CREATE TABLE IF NOT EXISTS collectionrequest (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmerId INT(11) DEFAULT NULL,
      cmId INT(11) DEFAULT NULL,
      centerId INT(11) DEFAULT NULL,
      companyId INT(11) DEFAULT NULL,
      cancelBy INT(11) DEFAULT NULL,
      requestId VARCHAR(30) DEFAULT NULL,
      requestStatus VARCHAR(30) DEFAULT NULL, -- Not Assigned, Assigned
      assignedStatus VARCHAR(30) DEFAULT NULL, -- Collected, On way, Canceled
      cancelStatus BOOLEAN DEFAULT 0,
      scheduleDate DATE DEFAULT NULL,
      cancelReason TEXT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmerId) REFERENCES plant_care.users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (cmId) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (centerId) REFERENCES collectioncenter(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (companyId) REFERENCES company(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (cancelBy) REFERENCES collectionofficer(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        collectionofficer.query(sql, (err, result) => {
            if (err) {
                reject('Error creating collection request table: ' + err);
            } else {
                resolve('collection request table created successfully.');
            }
        });
    });
};



const createCollectionRequestItemsTable = () => {
  const sql = `
CREATE TABLE IF NOT EXISTS collectionrequestitems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestId INT(11) DEFAULT NULL,
    cropId INT(11) DEFAULT NULL,
    varietyId INT(11) DEFAULT NULL,
    loadWeight INT DEFAULT NULL,
    FOREIGN KEY (cropId) REFERENCES plant_care.cropgroup(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    FOREIGN KEY (varietyId) REFERENCES plant_care.cropvariety(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  )
`;
  return new Promise((resolve, reject) => {
      collectionofficer.query(sql, (err, result) => {
          if (err) {
              reject('Error creating collection request items table: ' + err);
          } else {
              resolve('collection request items table created successfully.');
          }
      });
  });
};




const createvehicleRegistrationTable = () => {
  const sql = `
CREATE TABLE IF NOT EXISTS vehicleregistration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coId INT(11) DEFAULT NULL,
    licNo INT(11) DEFAULT NULL,
    insNo INT(11) DEFAULT NULL,
    insExpDate DATE DEFAULT NULL,
    vType VARCHAR(50) DEFAULT NULL,
    vCapacity INT(11) DEFAULT NULL,
    vRegNo VARCHAR(50) DEFAULT NULL,
    licFrontImg TEXT,
    licBackImg TEXT,
    insFrontImg TEXT,
    insBackImg TEXT,
    vehFrontImg TEXT,
    vehBackImg TEXT,
    vehSideImgA TEXT,
    vehSideImgB TEXT,
    FOREIGN KEY (coId) REFERENCES collectionofficer(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
)
`;
  return new Promise((resolve, reject) => {
      collectionofficer.query(sql, (err, result) => {
          if (err) {
              reject('Error creating vehicle registration table: ' + err);
          } else {
              resolve('vehicle registration table created successfully.');
          }
      });
  });
};

module.exports = {
    createXlsxHistoryTable,
    createMarketPriceTable,
    createMarketPriceServeTable,
    createCompany,
    createCollectionOfficer,
    createRegisteredFarmerPayments,
    createFarmerPaymensCrops,
    createCollectionCenter,
    createFarmerComplains,
    createMarketPriceRequestTable,
    createOfficerComplainsTable,
    createCompanyCenterTable,
    createCenterCropsTable,
    createDailyTargetTable,
    createOfficerTargetTable,
    createCollectionRequest,
    createCollectionRequestItemsTable,
    createvehicleRegistrationTable,

};