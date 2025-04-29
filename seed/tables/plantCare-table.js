

const { db, plantcare, collectionofficer } = require('../../startup/database');

const createUsersTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firstName VARCHAR(50) DEFAULT NULL,
      lastName VARCHAR(50) DEFAULT NULL,
      phoneNumber VARCHAR(12) DEFAULT NULL,
      NICnumber VARCHAR(12) DEFAULT NULL,
      profileImage TEXT DEFAULT NULL,
      farmerQr TEXT DEFAULT NULL,
      membership VARCHAR(25) DEFAULT NULL,
      activeStatus VARCHAR(25) DEFAULT NULL,
      houseNo VARCHAR(10) DEFAULT NULL,
      streetName VARCHAR(25) DEFAULT NULL,
      city VARCHAR(25) DEFAULT NULL,
      district VARCHAR(25) DEFAULT NULL,
      route VARCHAR(25) DEFAULT NULL,
      language VARCHAR(10) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating users table: ' + err);
            } else {
                resolve('Users table created successfully.');
            }
        });
    });
};



const createContentTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titleEnglish TEXT DEFAULT NULL,
      titleSinhala TEXT DEFAULT NULL,
      titleTamil TEXT DEFAULT NULL,
      descriptionEnglish  TEXT DEFAULT NULL,
      descriptionSinhala TEXT DEFAULT NULL,
      descriptionTamil TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      status VARCHAR(15) DEFAULT NULL,
      publishDate TIMESTAMP NULL DEFAULT NULL,
      expireDate TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating content table: ' + err);
            } else {
                resolve('Content table created successfully.');
            }
        });
    });
};




const createCropGroup = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cropgroup (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cropNameEnglish VARCHAR(50) DEFAULT NULL,
      cropNameSinhala VARCHAR(50) DEFAULT NULL,
      cropNameTamil VARCHAR(50) DEFAULT NULL,
      category VARCHAR(255) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      bgColor VARCHAR(10) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating cropg roup table: ' + err);
            } else {
                resolve('crop group table created successfully.');
            }
        });
    });
};




const createCropVariety = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cropvariety (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cropGroupId INT(11) DEFAULT NULL,
      varietyNameEnglish VARCHAR(50) DEFAULT NULL,
      varietyNameSinhala VARCHAR(50) DEFAULT NULL,
      varietyNameTamil VARCHAR(50) DEFAULT NULL,
      descriptionEnglish TEXT DEFAULT NULL,
      descriptionSinhala TEXT DEFAULT NULL,
      descriptionTamil TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      bgColor VARCHAR(10) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cropGroupId) REFERENCES cropgroup(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating crop variety table: ' + err);
            } else {
                resolve('crop variety table created successfully.');
            }
        });
    });
};




const createCropCalenderTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cropcalender (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cropVarietyId INT(11) DEFAULT NULL,
      method VARCHAR(25) DEFAULT NULL,
      natOfCul VARCHAR(25) DEFAULT NULL,
      cropDuration VARCHAR(3) DEFAULT NULL,
      suitableAreas TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cropVarietyId) REFERENCES cropvariety(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating crop Calender table: ' + err);
            } else {
                resolve('Crop Calender table created successfully.');
            }
        });
    });
};




const createCropCalenderDaysTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS cropcalendardays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cropId INT(11) DEFAULT NULL,
    taskIndex INT(255) DEFAULT NULL,
    days INT(11) DEFAULT NULL,
    taskTypeEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
    taskTypeSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskTypeTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskCategoryEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
    taskCategorySinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskCategoryTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
    taskSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskDescriptionEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
    taskDescriptionSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    taskDescriptionTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
    imageLink TEXT DEFAULT NULL,
    videoLinkEnglish TEXT DEFAULT NULL,
    videoLinkSinhala TEXT DEFAULT NULL,
    videoLinkTamil TEXT DEFAULT NULL,
    reqImages INT(11) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cropId) REFERENCES cropcalender(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating crop Calender Days table: ' + err);
            } else {
                resolve('Crop Calender Days table created successfully.');
            }
        });
    });
};





const createOngoingCultivationsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ongoingcultivations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ongoing Cultivations table: ' + err);
            } else {
                resolve('Ongoing Cultivations table created successfully.');
            }
        });
    });
};





const createOngoingCultivationsCropsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ongoingcultivationscrops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ongoingCultivationId INT DEFAULT NULL,
      cropCalendar INT DEFAULT NULL,
      startedAt DATE DEFAULT NULL,
      extentha DECIMAL(15, 2) DEFAULT NULL,
      extentac DECIMAL(15, 2) DEFAULT NULL,
      extentp DECIMAL(15, 2) DEFAULT NULL,
      longitude DECIMAL(20, 15) DEFAULT NULL,
      latitude DECIMAL(20, 15) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ongoingCultivationId) REFERENCES ongoingcultivations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (cropCalendar) REFERENCES cropcalender(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ongoing Cultivations Crops table: ' + err);
            } else {
                resolve('Ongoing Cultivations Crops table created successfully.');
            }
        });
    });
};





const createCurrentAssetTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS currentasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      category VARCHAR(50) DEFAULT NULL,
      asset VARCHAR(50) DEFAULT NULL,
      brand VARCHAR(50) DEFAULT NULL,
      batchNum VARCHAR(50) DEFAULT NULL,
      unit VARCHAR(10) DEFAULT NULL,
      unitVolume INT DEFAULT NULL,
      numOfUnit DECIMAL(15, 2) DEFAULT NULL,
      unitPrice DECIMAL(15, 2) DEFAULT NULL,
      total DECIMAL(15, 2) DEFAULT NULL,
      purchaseDate DATETIME DEFAULT NULL,
      expireDate DATETIME DEFAULT NULL,
      status VARCHAR(255) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating current asset table: ' + err);
            } else {
                resolve('current asset table created successfully.');
            }
        });
    });
};





const createFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS fixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      category VARCHAR(50) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating fixed asset table: ' + err);
            } else {
                resolve('Fixed asset table created successfully.');
            }
        });
    });
};





const createBuldingFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS buildingfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fixedAssetId INT DEFAULT NULL,
      type VARCHAR(50) DEFAULT NULL,
      floorArea DECIMAL(15, 2) DEFAULT NULL,
      ownership VARCHAR(50) DEFAULT NULL,
      generalCondition VARCHAR(50) DEFAULT NULL,
      district VARCHAR(15) DEFAULT NULL,
      FOREIGN KEY (fixedAssetId) REFERENCES fixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating building fixed asset table: ' + err);
            } else {
                resolve('building Fixed asset table created successfully.');
            }
        });
    });
};



//03
const createLandFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS landfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fixedAssetId INT DEFAULT NULL,
      extentha DECIMAL(15, 2) DEFAULT NULL,
      extentac DECIMAL(15, 2) DEFAULT NULL,
      extentp DECIMAL(15, 2) DEFAULT NULL,
      ownership VARCHAR(50) DEFAULT NULL,
      district VARCHAR(15) DEFAULT NULL,
      landFenced VARCHAR(15) DEFAULT NULL,
      perennialCrop VARCHAR(15)  DEFAULT NULL,
      FOREIGN KEY (fixedAssetId) REFERENCES fixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating land fixed asset table: ' + err);
            } else {
                resolve('Land fixed asset table created successfully.');
            }
        });
    });
};



//04
const createMachToolsFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS machtoolsfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fixedAssetId INT DEFAULT NULL,
      asset VARCHAR(50) DEFAULT NULL,
      assetType VARCHAR(25) DEFAULT NULL,
      mentionOther VARCHAR(50) DEFAULT NULL,
      brand VARCHAR(125) DEFAULT NULL,
      numberOfUnits INT DEFAULT NULL,
      unitPrice DECIMAL(15, 2) DEFAULT NULL,
      totalPrice DECIMAL(15, 2) DEFAULT NULL,
      warranty VARCHAR(20) DEFAULT NULL,
      FOREIGN KEY (fixedAssetId) REFERENCES fixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating machtools fixed asset table: ' + err);
            } else {
                resolve('machtools Fixed asset table created successfully.');
            }
        });
    });
};


//05
const createMachToolsWarrantyFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS machtoolsfixedassetwarranty (
      id INT AUTO_INCREMENT PRIMARY KEY,
      machToolsId INT DEFAULT NULL,
      purchaseDate DATETIME DEFAULT NULL,
      expireDate DATETIME DEFAULT NULL,
      warrantystatus VARCHAR(20) DEFAULT NULL,
      FOREIGN KEY (machToolsId) REFERENCES machtoolsfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating fixed asset warranty table: ' + err);
            } else {
                resolve('Fixed asset warranty table created successfully.');
            }
        });
    });
};


//06
const createOwnershipOwnerFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ownershipownerfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buildingAssetId INT DEFAULT NULL,
      landAssetId INT DEFAULT NULL,
      issuedDate DATETIME DEFAULT NULL,
      estimateValue DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (buildingAssetId) REFERENCES buildingfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
     FOREIGN KEY (landAssetId) REFERENCES landfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ownership owner fixed asset table: ' + err);
            } else {
                resolve('ownership owner fixed asset table created successfully.');
            }
        });
    });
};

//07

const createOwnershipLeastFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ownershipleastfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buildingAssetId INT DEFAULT NULL,
      landAssetId INT DEFAULT NULL,
      startDate DATETIME DEFAULT NULL,
      durationYears INT(8) DEFAULT NULL,
      durationMonths INT(8) DEFAULT NULL,
      leastAmountAnnually DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (buildingAssetId) REFERENCES buildingfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
     FOREIGN KEY (landAssetId) REFERENCES landfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ownershipleastfixedasset table: ' + err);
            } else {
                resolve('ownershipleastfixedasset table created successfully.');
            }
        });
    });
};


//08
const createOwnershipPermitFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ownershippermitfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buildingAssetId INT DEFAULT NULL,
      landAssetId INT DEFAULT NULL,
      issuedDate DATETIME DEFAULT NULL,
      permitFeeAnnually DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (buildingAssetId) REFERENCES buildingfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
     FOREIGN KEY (landAssetId) REFERENCES landfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ownershippermitfixedasset table: ' + err);
            } else {
                resolve('ownershippermitfixedasset table created successfully.');
            }
        });
    });
};

//09
const createOwnershipSharedFixedAsset = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ownershipsharedfixedasset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buildingAssetId INT DEFAULT NULL,
      landAssetId INT DEFAULT NULL,
      paymentAnnually DECIMAL(15, 2) DEFAULT NULL,
      FOREIGN KEY (buildingAssetId) REFERENCES buildingfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
     FOREIGN KEY (landAssetId) REFERENCES landfixedasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating ownershipsharedfixedasset table: ' + err);
            } else {
                resolve('ownershipsharedfixedasset table created successfully.');
            }
        });
    });
};


const createCurrentAssetRecord = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS currentassetrecord (
    id INT AUTO_INCREMENT PRIMARY KEY,
    currentAssetId INT(5) DEFAULT NULL,
    numOfPlusUnit DECIMAL(15, 2) DEFAULT NULL,
    numOfMinUnit DECIMAL(15, 2) DEFAULT NULL,
    totalPrice DECIMAL(15, 2) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (currentAssetId) REFERENCES currentasset(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating cuurent asset record table: ' + err);
            } else {
                resolve('current asset record table created successfully.');
            }
        });
    });
};





const createSlaveCropCalenderDaysTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS slavecropcalendardays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT(11) DEFAULT NULL,
      onCulscropID  INT(11) DEFAULT NULL,
      cropCalendarId INT(11) DEFAULT NULL,
      taskIndex INT(255) DEFAULT NULL,
      startingDate DATE DEFAULT NULL,
      days INT(255) DEFAULT NULL,
      taskTypeEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
      taskTypeSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskTypeTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskCategoryEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
      taskCategorySinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskCategoryTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
      taskSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskDescriptionEnglish TEXT COLLATE latin1_swedish_ci DEFAULT NULL,
      taskDescriptionSinhala TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      taskDescriptionTamil TEXT COLLATE utf8_unicode_ci DEFAULT NULL,
      status VARCHAR(20) DEFAULT NULL,
      imageLink TEXT DEFAULT NULL,
      videoLinkEnglish TEXT DEFAULT NULL,
      videoLinkSinhala TEXT DEFAULT NULL,
      videoLinkTamil TEXT DEFAULT NULL,
      reqImages INT(11) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
      FOREIGN KEY (cropCalendarId) REFERENCES cropcalender(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (onCulscropID) REFERENCES ongoingcultivationscrops(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
  );
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating slave crop Calender Days table: ' + err);
            } else {
                resolve('slave crop   table created successfully.');
            }
        });
    });
};




const createTaskImages = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS taskimages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slaveId INT(11) DEFAULT NULL,
            image TEXT DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (slaveId) REFERENCES slavecropcalendardays(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
  );
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error taskimages table: ' + err);
            } else {
                resolve('taskimages table created successfully.');
            }
        });
    });
};




const createpublicforumposts = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS publicforumposts (
            id int AUTO_INCREMENT PRIMARY KEY,
            userId int DEFAULT NULL,
            heading varchar(255) DEFAULT NULL,
            message text DEFAULT NULL,
            createdAt timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            postimage TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
  );
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error publicforumposts table: ' + err);
            } else {
                resolve('publicforumposts table created successfully.');
            }
        });
    });
};

const createpublicforumreplies = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS publicforumreplies (
        id int AUTO_INCREMENT PRIMARY KEY,
        chatId int DEFAULT NULL,
        replyId int DEFAULT NULL,
        replyMessage text DEFAULT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (replyId) REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (chatId) REFERENCES publicforumposts(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE

  );
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error publicforumreplies table: ' + err);
            } else {
                resolve('publicforumreplies table created successfully.');
            }
        });
    });
};



const createUserBankDetails = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS userbankdetails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      accNumber VARCHAR(50) DEFAULT NULL,
      accHolderName VARCHAR(50) DEFAULT NULL,
      bankName VARCHAR(50) DEFAULT NULL,
      branchName VARCHAR(50) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating userbankdetails table: ' + err);
            } else {
                resolve('userbankdetails table created successfully.');
            }
        });
    });
};


const createFeedBackListTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS feedbacklist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderNumber INT DEFAULT NULL,
      feedbackEnglish TEXT DEFAULT NULL,
      feedbackSinahala TEXT DEFAULT NULL,
      feedbackTamil TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating feedbacklist table: ' + err);
            } else {
                resolve('feedbacklist table created successfully.');
            }
        });
    });
};


const createDeletedUserTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS deleteduser (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firstName VARCHAR(30) NULL DEFAULT NULL,
      lastName VARCHAR(30) NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error creating deleteduser table: ' + err);
            } else {
                resolve('deleteduser table created successfully.');
            }
        });
    });
};


const createUserFeedbackTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS userfeedback (
        id int AUTO_INCREMENT PRIMARY KEY,
        deletedUserId int DEFAULT NULL,
        feedbackId int DEFAULT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deletedUserId) REFERENCES deleteduser(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (feedbackId) REFERENCES feedbacklist(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
  );
    `;
    return new Promise((resolve, reject) => {
        plantcare.query(sql, (err, result) => {
            if (err) {
                reject('Error userfeedback table: ' + err);
            } else {
                resolve('userfeedback table created successfully.');
            }
        });
    });
};







module.exports = {
    createUsersTable,
    createContentTable,
    createCropGroup,
    createCropVariety,
    createCropCalenderTable,
    createCropCalenderDaysTable,
    createOngoingCultivationsTable,
    createOngoingCultivationsCropsTable,
    createCurrentAssetTable,
    createpublicforumposts,
    createpublicforumreplies,
    createFixedAsset,
    createBuldingFixedAsset, 
    createLandFixedAsset,
    createMachToolsFixedAsset,
    createMachToolsWarrantyFixedAsset,
    createOwnershipOwnerFixedAsset,
    createOwnershipLeastFixedAsset,
    createOwnershipPermitFixedAsset,
    createOwnershipSharedFixedAsset,
    createCurrentAssetRecord,
    createSlaveCropCalenderDaysTable,
    createTaskImages,
    createUserBankDetails,

    createFeedBackListTable,
    createDeletedUserTable,
    createUserFeedbackTable
};
