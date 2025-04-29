const {  admin, plantcare } = require('../../startup/database');

const applications = async () => {
  const applications = [
    'PlantCare', 
    'CollectionOfficer', 
    'MarketPlace', 
    'SalesDash'];

  const sql = `
    INSERT INTO systemapplications (appName) 
    VALUES ${applications.map(() => '(?)').join(', ')}
  `;

  try {
    return new Promise((resolve, reject) => {
      admin.query(sql, applications, (err, result) => {
        if (err) {
          reject('Error inserting applications: ' + err);
        } else {
          resolve('applications inserted successfully.');
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  applications
};