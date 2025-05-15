const ProductDao = require("../dao/Product-dao");

exports.getAllProduct = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
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
        res.status(500).json({ error: "An error occurred during retrieval." });
    }
};


exports.getProductsByCategory = async (req, res) => {
    const { category } = req.query;
    
    if (!category) {
        return res.status(400).json({ 
            status: false, 
            message: "Category parameter is required" 
        });
    }
    
    try {
        const products = await ProductDao.getProductsByCategoryDao(category);
        
        if (products.length === 0) {
            return res.json({ 
                status: false, 
                message: "No products found for this category", 
                products: [] 
            });
        }
        
        res.status(200).json({
            status: true,
            message: "Products found.",
            products: products
        });
    } catch (err) {
        console.error("Error fetching products by category:", err);
        res.status(500).json({ 
            status: false, 
            error: "An error occurred while fetching products." 
        });
    }
};