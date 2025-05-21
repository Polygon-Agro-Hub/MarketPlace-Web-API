const { createMarketPlaceUsersTable, createUserAddressItems, createRetailCart, createHomeDeliveryDetails, createRetailOrder, createRetailOrderItems, createProcessRetailOrders, createBanners, createRetailAdditionalItems, createRetailpackageItems, createRetailpackageItemsAdded, createRetailpackageItemsMin } = require('../tables/marketPlace-table');
const { createMarketPlacePackages } = require('../tables/marketPlace-table');
const { createCoupon } = require('../tables/marketPlace-table');
const { createMarketPlaceItems } = require('../tables/marketPlace-table');
const { createPackageDetails } = require('../tables/marketPlace-table');
const { createPromoItems } = require('../tables/marketPlace-table');


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

    const messageCreateUserAddressItems = await createUserAddressItems();
    console.log(messageCreateUserAddressItems);

    const messageCreateRetailCart = await createRetailCart();
    console.log(messageCreateRetailCart);

    const messageCreateHomeDeliveryDetails = await createHomeDeliveryDetails();
    console.log(messageCreateHomeDeliveryDetails);

    const messageCreateRetailOrder = await createRetailOrder();
    console.log(messageCreateRetailOrder);

    const messageCreateRetailOrderItems = await createRetailOrderItems();
    console.log(messageCreateRetailOrderItems);

    const messageCreateRetailAdditionalItems = await createRetailAdditionalItems();
    console.log(messageCreateRetailAdditionalItems);

    const messageCreateRetailpackageItems= await createRetailpackageItems();
    console.log(messageCreateRetailpackageItems);

    const messageCreateRetailpackageItemsAdded = await createRetailpackageItemsAdded();
    console.log(messageCreateRetailpackageItemsAdded);

    
    const messageCreateRetailpackageItemsMin = await createRetailpackageItemsMin();
    console.log(messageCreateRetailpackageItemsMin);

    const messageCreateProcessRetailOrders = await createProcessRetailOrders();
    console.log(messageCreateProcessRetailOrders);

    const messageCreateBanners = await createBanners();
    console.log(messageCreateBanners);

    
  } catch (err) {
    console.error('Error seeding seedMarketPlace:', err);
  }
};


module.exports = seedMarketPlace;