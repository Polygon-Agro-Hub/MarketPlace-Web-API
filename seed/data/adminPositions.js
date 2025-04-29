const {  admin, plantcare } = require('../../startup/database');

const insertPositions = async () => {
  const positions = [
    'Associate', 
    'Officer', 
    'Executive', 
    'Manager'
    ];

  const sql = `
    INSERT INTO adminposition (positions) 
    VALUES ${positions.map(() => '(?)').join(', ')}
  `;

  try {
    return new Promise((resolve, reject) => {
      admin.query(sql, positions, (err, result) => {
        if (err) {
          reject('Error inserting positions: ' + err);
        } else {
          resolve('positions inserted successfully.');
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
    insertPositions
};