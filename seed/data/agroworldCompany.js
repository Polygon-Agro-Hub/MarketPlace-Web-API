const bcrypt = require('bcryptjs');
const {collectionofficer } = require('../../startup/database');

const createAgroWorld = async () => {
  const companyNameEnglish = 'agroworld (Pvt) Ltd';
  const companyNameSinhala = 'ඇග්‍රො වර්ල්ඩ් පුද්. සමාගම';
  const companyNameTamil = 'அக்ரோ வேர்ல்ட் பிரைவேட்';
 

  try {
    const sql = `
      INSERT INTO company  (companyNameEnglish, companyNameSinhala, companyNameTamil)
      VALUES (?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      collectionofficer.query(sql, [companyNameEnglish, companyNameSinhala, companyNameTamil], (err, result) => {
        if (err) {
          reject('Error creating Agro World Company: ' + err);
        } else {
          resolve('Agro World Company created successfully.');
        }
      });
    });
  } catch (err) {
    throw new Error('Error : ' + err);
  }
};

module.exports = {
    createAgroWorld
};