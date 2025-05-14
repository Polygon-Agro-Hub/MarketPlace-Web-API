const express = require("express");
const ProductEp = require("../end-point/Product-ep");


const router = express.Router();

router.get("/all-product", ProductEp.getAllProduct);


module.exports = router;

