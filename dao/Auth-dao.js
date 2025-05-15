const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');


exports.userLogin = (email) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE email = ?";
    marketPlace.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};


exports.signupUser = (user, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (title, firstName, lastName, phoneCode, phoneNumber, buyerType, email, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.title,
      user.firstName,
      user.lastName,
      user.phoneCode,
      user.phoneNumber,
      user.buyerType,  // ← make sure this aligns with frontend `accountType`
      user.email,
      hashedPassword
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        reject({
          status: false,
          message: 'Database error during user signup.',
          error: err
        });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: 'User registered successfully.',
          data: { userId: results.insertId }
        });
      } else {
        reject({
          status: false,
          message: 'User registration failed, no rows affected.'
        });
      }
    });
  });
};


// Optionally, add a function to check if the email already exists
exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM marketplaceusers WHERE email = ?";
      marketPlace.query(sql, [email], (err, results) => {
          if (err) {
              reject(err);
          } else {
              resolve(results[0]);
          }
      });
  });
};

// Get user by Google ID
exports.getUserByGoogleId = (googleId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM marketplaceusers WHERE googleId = ?";
    marketPlace.query(sql, [googleId], (err, results) => {
      if (err) {
        console.error('Error getting user by Google ID:', err);
        reject({ status: false, message: 'Database error', error: err });
      } else {
        resolve(results.length > 0 ? results[0] : null);
      }
    });
  });
};

// Create user with Google authentication (consistent Promise wrapper)
exports.createGoogleUser = (userData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO marketplaceusers 
      (email, firstName, lastName, googleId, image, buyerType) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.googleId,
      userData.imageUrl || null,
      'regular'
    ];

    marketPlace.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error creating Google user:', err);
        reject({ status: false, message: 'Database error', error: err });
      } else if (results.affectedRows === 1) {
        resolve({
          status: true,
          message: 'User registered successfully with Google',
          data: { userId: results.insertId }
        });
      } else {
        resolve({
          status: false,
          message: 'Failed to register user with Google'
        });
      }
    });
  });
};