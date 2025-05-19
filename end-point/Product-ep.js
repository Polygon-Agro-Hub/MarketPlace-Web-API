const ProductDao = require("../dao/Product-dao");
const ProductValidate = require("../validations/product-validation");

exports.getAllProduct = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const productData = await ProductDao.getAllProductDao();
    if (productData.length === 0) {
      return res.json({
        status: false,
        message: "No product found",
        product: [],
      });
    }
    res.status(200).json({
      status: true,
      message: "Product found.",
      product: productData,
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
      message: "Category parameter is required",
    });
  }

  try {
    const products = await ProductDao.getProductsByCategoryDao(category);

    if (products.length === 0) {
      return res.json({
        status: false,
        message: "No products found for this category",
        products: [],
      });
    }

    res.status(200).json({
      status: true,
      message: "Products found.",
      products: products,
    });
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while fetching products.",
    });
  }
};

exports.getPackageDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { packageId } =
      await ProductValidate.packageDetailsSchema.validateAsync(req.params);

    // const {packageId} = req.params
    // const packageIdNum = parseInt(packageId, 10);
    // console.log(packageIdNum);

    const packageItemData = await ProductDao.getAllPackageItemsDao(packageId);
    if (packageItemData.length === 0) {
      return res.json({
        status: false,
        message: "No package data found",
        product: [],
      });
    }
    // console.log(packageItemData);

    res.status(200).json({
      status: true,
      message: "Product found.",
      packageItems: packageItemData,
    });
  } catch (err) {
    console.error("Error during get product:", err);
    res.status(500).json({ error: "An error occurred during signup." });
  }
};

exports.packageAddToCart = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { userId } = req.user;
    const packageItems =
      await ProductValidate.packageAddToCartSchema.validateAsync(req.body);

    const checkCart = await ProductDao.chackPackageCartDao(
      packageItems[0].packageId,
      userId
    );
    if (checkCart.length > 0) {
      return res.status(200).json({
        status: false,
        message: "Package already added to cart",
        // data: checkCart
      });
    }

    const result = await ProductDao.packageAddToCartDao(packageItems, userId);

    res.status(201).json({
      status: true,
      message: "Package added to cart successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error adding package to cart:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while adding package to cart",
      details: err.message,
    });
  }
};

exports.productAddToCart = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { userId } = req.user;
    const product = await ProductValidate.productDetailsSchema.validateAsync(
      req.body
    );

    const checkCart = await ProductDao.chackProductCartDao(
      product.mpItemId,
      userId
    );
    if (checkCart.length !== 0) {
      return res.status(200).json({
        status: false,
        message: "product already added to cart",
        // data: checkCart
      });
    }

    const result = await ProductDao.addProductCartDao(product, userId);

    res.status(201).json({
      status: true,
      message: "product added to cart successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error adding product to cart:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while adding product to cart",
      details: err.message,
    });
  }
};

exports.getProductTypeCount = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const productCount = await ProductDao.getProductTypeCountDao();

    res.status(200).json({
      status: true,
      message: "Product count found.",
      productCount: productCount,
    });
  } catch (err) {
    console.error("Error during get product:", err);
    res.status(500).json({ error: "An error occurred during retrieval." });
  }
};

exports.getCategoryCounts = async (req, res) => {
  try {
    const categoryCounts = await ProductDao.getCategoryCountsDao();

    if (categoryCounts.length === 0) {
      return res.json({
        status: false,
        message: "No categories found",
        counts: [],
      });
    }

    res.status(200).json({
      status: true,
      message: "Category counts retrieved successfully",
      counts: categoryCounts,
    });
  } catch (err) {
    console.error("Error fetching category counts:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while fetching category counts",
    });
  }
};

exports.getAllSlides = async (req, res) => {
  try {
    const slides = await ProductDao.getAllSlidesDao();
    res.status(200).json({
      status: true,
      message: "Slides fetched successfully",
      slides,
    });
  } catch (err) {
    console.error("Error fetching slides:", err);
    res.status(500).json({ status: false, error: "Failed to fetch slides" });
  }
};

exports.addSlide = async (req, res) => {
  try {
    const slide = await ProductValidate.addSlideSchema.validateAsync(req.body);
    const result = await ProductDao.addSlideDao(slide);
    res.status(201).json({
      status: true,
      message: "Slide added successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error adding slide:", err);
    res.status(400).json({
      status: false,
      error: err.details ? err.details[0].message : err.message,
    });
  }
};

exports.deleteSlide = async (req, res) => {
  const { id } = req.params;
  try {
    await ProductDao.deleteSlideDao(id);
    res.status(200).json({
      status: true,
      message: "Slide deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting slide:", err);
    res.status(500).json({ status: false, error: "Failed to delete slide" });
  }
};