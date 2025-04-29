const { createMarketPlaceUsersTable } = require('../tables/marketPlace-table');
const { createMarketPlacePackages } = require('../tables/marketPlace-table');
const { createCoupon } = require('../tables/marketPlace-table');
const { createMarketPlaceItems } = require('../tables/marketPlace-table');
const { createPackageDetails } = require('../tables/marketPlace-table');
const { createPromoItems } = require('../tables/marketPlace-table');
const { createCart } = require('../tables/marketPlace-table');
const { createCartItems } = require('../tables/marketPlace-table');



const seedMarketPlace = async () => {
    try {
    const messageCreateMarketPlaceUsersTable = await createMarketPlaceUsersTable();
    console.log(messageCreateMarketPlaceUsersTable);

    const messageCreateMarketPlacePackages = await createMarketPlacePackages();
    console.log(messageCreateMarketPlacePackages);

    const messageCreateCoupon = await createCoupon();
    console.log(messageCreateCoupon);

    const messageCreateMarketPlaceItems = await createMarketPlaceItems();
    console.log(messageCreateMarketPlaceItems);

    const messageCreatePackageDetails = await createPackageDetails();
    console.log(messageCreatePackageDetails);

    const messageCreatePromoItems = await createPromoItems();
    console.log(messageCreatePromoItems);

    const messageCreateCart = await createCart();
    console.log(messageCreateCart);

    const messageCreateCartItems = await createCartItems();
    console.log(messageCreateCartItems);
    
} catch (err) {
    console.error('Error seeding seedMarketPlace:', err);
  }
};


module.exports = seedMarketPlace;