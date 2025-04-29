const { createAdminUserRolesTable } = require('../tables/admin-table');
const { createAdminUserPositionTable } = require('../tables/admin-table');
const { createFeaturesCategoryTable } = require('../tables/admin-table');
const { createFeaturesTable } = require('../tables/admin-table');
const { createAdminUsersTable } = require('../tables/admin-table');
const { createRoleFeatures } = require('../tables/admin-table');

const { createSystemAppTable } = require('../tables/admin-table');
const { createComplainCategoryTable } = require('../tables/admin-table');

const {createSuperAdmin} = require('../data/admin')
const {insertRoles} = require('../data/adminRoles')
const {insertPositions} = require('../data/adminPositions')
const {insertFeatureCategoriesAndFeatures} = require('../data/featureCtegories')
const {applications} = require('../data/applications')


const seedAdmin = async () => {
    try {
  
    const messageCreateAdminUserRolesTable = await createAdminUserRolesTable();
    console.log(messageCreateAdminUserRolesTable);

    const messageCreateAdminUserPositionTable = await createAdminUserPositionTable();
    console.log(messageCreateAdminUserPositionTable);

    const messageCreateFeaturesCategoryTable = await createFeaturesCategoryTable();
    console.log(messageCreateFeaturesCategoryTable);

    const messageCreateFeaturesTable = await createFeaturesTable();
    console.log(messageCreateFeaturesTable);

    const messageCreateAdminUsersTable = await createAdminUsersTable();
    console.log(messageCreateAdminUsersTable);

    const messageCreateRoleFeatures = await createRoleFeatures();
    console.log(messageCreateRoleFeatures);

  
    const messageCreateSystemAppTable = await createSystemAppTable();
    console.log(messageCreateSystemAppTable);

    const messageCreateComplainCategoryTable = await createComplainCategoryTable();
    console.log(messageCreateComplainCategoryTable);




    




    const messageInsertRoles = await insertRoles();
    console.log(messageInsertRoles);

    const messageinsertPositions = await insertPositions();
    console.log(messageinsertPositions);
    
    const messageAdminCreate = await createSuperAdmin();
    console.log(messageAdminCreate);

    const messageInsertFeatureCategoriesAndFeatures = await insertFeatureCategoriesAndFeatures();
    console.log(messageInsertFeatureCategoriesAndFeatures);
    
    const messageInsertFapplications = await applications();
    console.log(messageInsertFapplications);
} catch (err) {
    console.error('Error seeding seedAdmin:', err);
  }
};

module.exports = seedAdmin;