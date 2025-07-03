const { createXlsxHistoryTable, createDistributedCompanyCenterTable, createDeliveryChargeTable, createDistributedCenter } = require('../tables/collection-table');
const { createMarketPriceTable } = require('../tables/collection-table');
const { createMarketPriceServeTable } = require('../tables/collection-table');
const { createCompany } = require('../tables/collection-table');
const { createCollectionOfficer } = require('../tables/collection-table');
const { createRegisteredFarmerPayments } = require('../tables/collection-table');
const { createFarmerPaymensCrops } = require('../tables/collection-table');
const { createCollectionCenter } = require('../tables/collection-table');
const { createFarmerComplains } = require('../tables/collection-table');
const { createMarketPriceRequestTable } = require('../tables/collection-table');
const { createCenterCropsTable } = require('../tables/collection-table');
const { createDailyTargetTable } = require('../tables/collection-table');
const { createOfficerTargetTable } = require('../tables/collection-table');

const { createCollectionRequest } = require('../tables/collection-table');
const { createCollectionRequestItemsTable } = require('../tables/collection-table');
const { createvehicleRegistrationTable } = require('../tables/collection-table');


const { createOfficerComplainsTable } = require('../tables/collection-table');

const { createCompanyCenterTable } = require('../tables/collection-table');




const { createAgroWorld } = require('../data/agroworldCompany')


const seedCollection = async () => {
  try {
    const messageXlsxHistory = await createXlsxHistoryTable();
    console.log(messageXlsxHistory);

    const messageMarketPrice = await createMarketPriceTable();
    console.log(messageMarketPrice);

    const messagecreateCollectionCenter = await createCollectionCenter();
    console.log(messagecreateCollectionCenter);

    const messageCreateCompany = await createCompany();
    console.log(messageCreateCompany);

    const messageCreateCollectionOfficer = await createCollectionOfficer();
    console.log(messageCreateCollectionOfficer);

    const messageCreateRegisteredFarmerPayments = await createRegisteredFarmerPayments();
    console.log(messageCreateRegisteredFarmerPayments);

    const messageCreateFarmerPaymensCrops = await createFarmerPaymensCrops();
    console.log(messageCreateFarmerPaymensCrops);

    const messagecreateFarmerComplains = await createFarmerComplains();
    console.log(messagecreateFarmerComplains);

    const messageCreateCompanyCenterTable = await createCompanyCenterTable();
    console.log(messageCreateCompanyCenterTable);

    const messageMarketPriceServeTable = await createMarketPriceServeTable();
    console.log(messageMarketPriceServeTable);

    const messageCreateMarketPriceRequestTable = await createMarketPriceRequestTable();
    console.log(messageCreateMarketPriceRequestTable);


    const messagecreateCenterCropsTable = await createCenterCropsTable();
    console.log(messagecreateCenterCropsTable);


    const messageCreateDailyTargetTable = await createDailyTargetTable();
    console.log(messageCreateDailyTargetTable);

    const messagecreateOfficerTargetTable = await createOfficerTargetTable();
    console.log(messagecreateOfficerTargetTable);

    const messagecreateCollectionRequest = await createCollectionRequest();
    console.log(messagecreateCollectionRequest);


    const messagecreateCollectionRequestItemsTable = await createCollectionRequestItemsTable();
    console.log(messagecreateCollectionRequestItemsTable);


    const messagecreatevehicleRegistrationTable = await createvehicleRegistrationTable();
    console.log(messagecreatevehicleRegistrationTable);


    const messageCreateDistributedCenter = await createDistributedCenter();
    console.log(messageCreateDistributedCenter);

    const messageCreateDistributedCompanyCenterTable = await createDistributedCompanyCenterTable();
    console.log(messageCreateDistributedCompanyCenterTable);

    const messagecreateDeliveryChargeTable = await createDeliveryChargeTable();
    console.log(messagecreateDeliveryChargeTable);

    const messageCreateOfficerComplainsTable = await createOfficerComplainsTable();
    console.log(messageCreateOfficerComplainsTable);

    






    const messagecreateAgroWorld = await createAgroWorld();
    console.log(messagecreateAgroWorld);

  } catch (err) {
    console.error('Error seeding seedCollection:', err);
  }
};


module.exports = seedCollection;