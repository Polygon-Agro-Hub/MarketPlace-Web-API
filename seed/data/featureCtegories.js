const { admin } = require('../../startup/database');

const insertFeatureCategoriesAndFeatures = async () => {
  const category = 'Plantcare User'; // Single category
  const features = ['Add plantcare user', 'Edit Plantcare User', 'Delete plantcare user']; // Three features

  try {
    return new Promise((resolve, reject) => {
      // Insert category into featurecategory table
      const insertCategorySQL = `INSERT INTO featurecategory (category) VALUES (?)`;
      admin.query(insertCategorySQL, [category], (err, categoryResult) => {
        if (err) {
          return reject('Error inserting category: ' + err);
        }

        // Retrieve the inserted category ID
        const categoryIdQuery = `SELECT id FROM featurecategory WHERE category = ?`;
        admin.query(categoryIdQuery, [category], (err, rows) => {
          if (err || rows.length === 0) {
            return reject('Error retrieving category ID: ' + err);
          }

          const categoryId = rows[0].id;

          // Insert multiple features linked to the category ID
          const insertFeatureSQL = `
            INSERT INTO features (name, category) VALUES ${features.map(() => '(?, ?)').join(', ')}
          `;

          const featureValues = [];
          features.forEach(feature => {
            featureValues.push(feature, categoryId);
          });

          admin.query(insertFeatureSQL, featureValues, (err, featureResult) => {
            if (err) {
              return reject('Error inserting features: ' + err);
            }
            resolve('Category and features inserted successfully.');
          });
        });
      });
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  insertFeatureCategoriesAndFeatures
};
