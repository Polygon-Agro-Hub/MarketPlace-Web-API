const bcrypt = require('bcryptjs');
const db = require('../startup/database');

const createSuperAdmin = async () => {
  const password = 'Admin123@';
  const saltRounds = 10;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use parameterized query to insert the hashed password
    const sql = `
      INSERT INTO adminusers (mail, userName, password, role)
      VALUES (?, ?, ?, ?)
    `;

    // Return a promise that resolves when the admin is created
    return new Promise((resolve, reject) => {
      db.query(sql, ['admin@agroworld.com', 'superadmin123', hashedPassword, '1'], (err, result) => {
        if (err) {
          reject('Error creating Super Admin: ' + err);
        } else {
          resolve('Super Admin created successfully.');
        }
      });
    });
  } catch (err) {
    throw new Error('Error hashing password: ' + err);
  }
};

module.exports = {
  createSuperAdmin
};
