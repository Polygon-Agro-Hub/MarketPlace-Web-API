const { createSalesAgentTable, createfinalPackageListTable } = require('../tables/dash-table');
const {createSalesAgentStarTable} = require('../tables/dash-table');
const {createCustomerTable} = require('../tables/dash-table')
const {createHouseTable} = require('../tables/dash-table')
const {createApartmentTable} = require('../tables/dash-table')
const {createDashcomplainTable} = require('../tables/dash-table')
const {createtargetTable} = require('../tables/dash-table')

const {createOrdersTable} = require('../tables/dash-table')
const {createOrderSelectedItemsTable} = require('../tables/dash-table')
const {createOrderPackageItemsTable} = require('../tables/dash-table')

const {createModifiedPlustemsTable} = require('../tables/dash-table')
const {createModifiedMintemsTable} = require('../tables/dash-table')
const {createAdditionaltemsTable} = require('../tables/dash-table')

const {createDashNotificationTable} = require('../tables/dash-table')





const seedDash = async () => {
    try {
  
    const messageCreateSalesAgentTable = await createSalesAgentTable();
    console.log(messageCreateSalesAgentTable);

    const messageCreateSalesAgentStarTable = await createSalesAgentStarTable();
    console.log(messageCreateSalesAgentStarTable);

    const messageCreateCustomerTable = await createCustomerTable();
    console.log(messageCreateCustomerTable);

    const messageCreateHouseTable = await createHouseTable();
    console.log(messageCreateHouseTable);

    const messageCreateApartmentTable = await createApartmentTable();
    console.log(messageCreateApartmentTable);

    const messagecreateDashcomplainTable = await createDashcomplainTable();
    console.log(messagecreateDashcomplainTable);

    const messageCreatetargetTable = await createtargetTable();
    console.log(messageCreatetargetTable);

  

    const messageCreateOrdersTable = await createOrdersTable();
    console.log(messageCreateOrdersTable);

    const messageCreateOrderSelectedItemsTable = await createOrderSelectedItemsTable();
    console.log(messageCreateOrderSelectedItemsTable);

    const messageCreateOrderPackageItemsTable = await createOrderPackageItemsTable();
    console.log(messageCreateOrderPackageItemsTable);

    const messageCreateModifiedPlustemsTable = await createModifiedPlustemsTable();
    console.log(messageCreateModifiedPlustemsTable);

    const messagecreateModifiedMintemsTable = await createModifiedMintemsTable();
    console.log(messagecreateModifiedMintemsTable);

    const messagecreateAdditionaltemsTable = await createAdditionaltemsTable();
    console.log(messagecreateAdditionaltemsTable);

    const messagecreatefinalPackageListTable = await createfinalPackageListTable();
    console.log(messagecreatefinalPackageListTable);



    const messagecreateDashNotificationTable= await createDashNotificationTable();
    console.log(messagecreateDashNotificationTable);



    
} catch (err) {
    console.error('Error seeding seedDash:', err);
  }
};

module.exports = seedDash;