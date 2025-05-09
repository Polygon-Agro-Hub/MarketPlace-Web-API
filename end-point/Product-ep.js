const ProductDao = require("../dao/Product-dao");
// const ValidateSchema = require("../validations/Auth-validation");

exports.getAllProduct = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);

    try {
        // Validate request body
        // const user = await ValidateSchema.signupAdminSchema.validateAsync(req.body);


        // Check if the email already exists
        const productData = await ProductDao.getAllProductDao();
        if (productData.length === 0) {
            return res.json({ status: false, message: "No product found", product: [] });
        }


        res.status(200).json({
            status: true,
            message: "Product found.",
            product: productData
        });
    } catch (err) {
        console.error("Error during get product:", err);
        res.status(500).json({ error: "An error occurred during signup." });
    }
};
