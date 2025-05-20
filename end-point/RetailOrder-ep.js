const RetailOrderDao = require("../dao/RetailOrder-dao");
const ValidateSchema = require("../validations/Auth-validation");



exports.getRetailCart = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        const { userId } = req.user;
        const product = await RetailOrderDao.getRetailCartDao(userId);

        console.log("Product found:", product);
        
        res.status(200).json({
            status: true,
            message: "Product count found.",
            product
            // productCount: productCount
        });
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};
