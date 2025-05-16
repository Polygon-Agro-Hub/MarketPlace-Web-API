const express = require("express");
const ProductEp = require("../end-point/Product-ep");
const authMiddleware = require("../middlewares/authMiddleware");


const router = express.Router();

router.get(
    "/all-product",
     ProductEp.getAllProduct
);

router.get(
    "/by-category", 
    ProductEp.getProductsByCategory
);

router.get(
    "/package-details/:packageId", 
    ProductEp.getPackageDetails
);

router.post(
    "/package-add-to-cart",
    authMiddleware,
    ProductEp.packageAddToCart
);

router.post(
    "/product-add-to-cart",
    authMiddleware,
    ProductEp.productAddToCart
);


router.get(
    "/get-product-type-count",
    ProductEp.getProductTypeCount
);


module.exports = router;

