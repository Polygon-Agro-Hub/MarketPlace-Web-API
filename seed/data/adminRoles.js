const {  admin, plantcare } = require('../../startup/database');

const insertRoles = async () => {
  const roles = [
    'Super Admin', 
    'Agriculture', 
    'Finance', 
    'Call Center', 
    'Procuiment'];

  const sql = `
    INSERT INTO adminroles (role) 
    VALUES ${roles.map(() => '(?)').join(', ')}
  `;

  try {
    return new Promise((resolve, reject) => {
      admin.query(sql, roles, (err, result) => {
        if (err) {
          reject('Error inserting roles: ' + err);
        } else {
          resolve('Roles inserted successfully.');
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  insertRoles
};
