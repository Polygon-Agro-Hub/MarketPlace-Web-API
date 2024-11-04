const crypto = require('crypto');

const generateSecretKey = () => {
  return crypto.randomBytes(64).toString('hex');
};

console.log('Your new JWT secret key:');
console.log(generateSecretKey());