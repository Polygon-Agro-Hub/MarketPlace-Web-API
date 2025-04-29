const seedAdmin = require('./table-seeds/admin-seed');
const seedPlantCare = require('./table-seeds/plantcareSeed');
const seedCollection = require('./table-seeds/collection-seed');
const seedMarketPlace = require('./table-seeds/marketPlace-seed');
const seedDash = require('./table-seeds/dash-seed');


const { createExpiredContentCleanupEvent} = require('./events/events');
const {createContentPublishingEvent} = require('./events/events');
const {createTaskStatusEvent} = require('./events/events');
const {createUserActiveStatusEvent} = require('./events/events');


const runSeeds = async () => {
  try {


    console.log('Seeding Admin Database ...');
    await seedAdmin();
    console.log('===========================================');



    console.log('Seeding PlantCare Database ...');
    await seedPlantCare();
    console.log('===========================================');

    console.log('Seeding Collection Database ...');
    await seedCollection();
    console.log('===========================================');

    console.log('Seeding Market place Database ...');
    await seedMarketPlace();
    console.log('===========================================');

    console.log('Seeding dash Database ...');
    await seedDash()
    console.log('Completed ........... 100%');
    console.log('===========================================');


    console.log('');
    console.log('Seeding Events.......');


    console.log('Seeding PcreateExpiredContentCleanupEvent ...');
    await createExpiredContentCleanupEvent();
    console.log('');

    console.log('Seeding createContentPublishingEvent ...');
    await createContentPublishingEvent();
    console.log('');

    console.log('Seeding createTaskStatusEvent ...');
    await createTaskStatusEvent();
    console.log('');

    console.log('Seeding createUserActiveStatusEvent ...');
    await createUserActiveStatusEvent();

    console.log('===========================================');
    console.log('All done 100%');


 
  } catch (err) {
    console.error('Error running seeds:', err);
  } finally {
    process.exit();
  }
};

runSeeds();
