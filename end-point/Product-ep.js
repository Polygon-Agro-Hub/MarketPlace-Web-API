const ProductDao = require("../dao/Product-dao");
const ProductValidate = require("../validations/product-validation");

exports.getAllProduct = async (req, res) => {
  const { search } = req.query;
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl, 'search:', search);
  
  try {
    const productData = await ProductDao.getAllProductDao(search);
    if (productData.length === 0) {
      return res.json({
        status: false,
        message: search ? `No packages found matching "${search}"` : "No product found",
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
  const { category, search } = req.query;

  console.log('category', category, 'search', search);

  // Only require category if no search parameter is provided
  if (!category && (!search || search.trim() === '')) {
    return res.status(400).json({
      status: false,
      message: "Category parameter is required when no search term is provided",
    });
  }

  try {
    const products = await ProductDao.getProductsByCategoryDao(category, search);

    if (products.length === 0) {
      return res.json({
        status: false,
        message: search 
          ? `No products found matching "${search}"` 
          : "No products found for this category",
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

      console.log('pkg Id',packageId)

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

// exports.packageAddToCart = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log(fullUrl);

//   try {
//     const { userId } = req.user;
//     const { id } = await req.body;
//     // console.log(packageItems);
//     let createCart;
//     let cartId;
//     const packageId = id

//     const cart = await ProductDao.getUserCartIdDao(userId);
//     if (cart.length === 0) {
//       createCart = await ProductDao.createCartDao(userId, 1, 0);
//       cartId = createCart.insertId;
//       if (createCart.affectedRows === 0) {
//         return res.status(500).json({
//           status: false,
//           message: "Failed to create cart",
//         });
//       }
//     } else {
//       createCart = await ProductDao.updatePackageUserCartDao(cart[0].id, 1);
//       cartId = cart[0].id;
//       if (createCart.affectedRows === 0) {
//         return res.status(500).json({
//           status: false,
//           message: "Failed to update cart",
//         });
//       }
//     }


//     const checkCart = await ProductDao.chackPackageCartDao(cartId, packageId);
//     if (checkCart.length > 0) {
//       return res.status(200).json({
//         status: false,
//         message: "Package already added to cart",
//         // data: checkCart
//       });
//     }

//     const result = await ProductDao.packageAddToCartDao(cartId, packageId);
//     if (result.affectedRows === 0) {
//       return res.status(500).json({
//         status: false,
//         message: "Failed to add package to cart",
//       });
//     }

//     res.status(201).json({
//       status: true,
//       message: "Package added to cart successfully",
//       // data: result,
//     });
//   } catch (err) {
//     console.error("Error adding package to cart:", err);
//     res.status(500).json({
//       status: false,
//       error: "An error occurred while adding package to cart",
//       details: err.message,
//     });
//   }
// };

// exports.productAddToCart = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log(fullUrl);

//   try {
//     const { userId } = req.user;
//     const product = await ProductValidate.productDetailsSchema.validateAsync(
//       req.body
//     );

//     let createCart;
//     const cart = await ProductDao.getUserCartIdDao(userId);
//     if (cart.length === 0) {
//       createCart = await ProductDao.createCartDao(userId, 0, 1);
//       if (createCart.affectedRows === 0) {
//         return res.status(500).json({
//           status: false,
//           message: "Failed to create cart",
//         });
//       }
//     } else {
//       createCart = await ProductDao.updateAditionalItemsUserCartDao(
//         cart[0].id,
//         1
//       );
//     }

//     const cartId = createCart.insertId || cart[0].id;

//     res.status(201).json({
//       status: true,
//       message: "product added to cart successfully",
//       data: result,
//     });
//   } catch (err) {
//     console.error("Error adding product to cart:", err);
//     res.status(500).json({
//       status: false,
//       error: "An error occurred while adding product to cart",
//       details: err.message,
//     });
//   }
// };

// exports.productAddToCart = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log(fullUrl);

//   try {
//     const { userId } = req.user;
//     const product = req.body;

//     console.log('product for cart',req.body)

//     // Validate required product fields
//     if (!product.mpItemId || !product.quantity || !product.quantityType) {
//       return res.status(400).json({
//         status: false,
//         message: "Product ID, quantity and quantity type are required",
//       });
//     }

//     let cartId;
//     // Check if user already has a cart
//     const existingCart = await ProductDao.getUserCartIdDao(userId);
//     console.log(existingCart);

//     if (existingCart.length === 0) {
//       // Create new cart if user doesn't have one
//       const isPackage = product.isPackage || 0;
//       const isAditional = product.isAditional || 1;

//       const createCartResult = await ProductDao.createCartDao(
//         userId,
//         isPackage,
//         isAditional
//       );

//       console.log(createCartResult);

//       if (createCartResult.affectedRows === 0) {
//         return res.status(500).json({
//           status: false,
//           message: "Failed to create cart",
//         });
//       }
//       cartId = createCartResult.insertId;
//     } else {
//       // Update existing cart
//       cartId = existingCart[0].id;
//       // const isAditional = product.isAditional || 1;

//       const updateResult = await ProductDao.updateAditionalItemsUserCartDao(
//         cartId,
//         1
//       );
//       console.log(updateResult);

//       if (updateResult.affectedRows === 0) {
//         return res.status(500).json({
//           status: false,
//           message: "Failed to update cart",
//         });
//       }
//     }

//     // Add product to cart items table
//     const addProductResult = await ProductDao.addProductCartDao(
//       product,
//       cartId
//     );

//     if (addProductResult.affectedRows === 0) {
//       return res.status(500).json({
//         status: false,
//         message: "Failed to add product to cart",
//       });
//     }

//     res.status(201).json({
//       status: true,
//       message: "Product added to cart successfully",
//       data: {
//         cartId: cartId,
//         productId: product.mpItemId,
//         quantity: product.quantity,
//         quantityType: product.quantityType,
//       },
//     });
//   } catch (err) {
//     console.error("Error adding product to cart:", err);

//     // Handle specific error cases
//     if (err.isJoi) {
//       return res.status(400).json({
//         status: false,
//         error: "Validation error",
//         details: err.message,
//       });
//     }

//     res.status(500).json({
//       status: false,
//       error: "An error occurred while adding product to cart",
//       details: err.message,
//     });
//   }
// };

exports.packageAddToCart = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { userId ,buyerType} = req.user;
    const { id, qty = 1 } = req.body;
    
    const packageId = id;
    let cartId;

    // Check if user already has a cart
    const existingCart = await ProductDao.getUserCartIdDao(userId);
    
    if (existingCart.length === 0) {
      // Create new cart if none exists
      const createCart = await ProductDao.createCartDao(userId, buyerType);
      if (createCart.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to create cart",
        });
      }
      cartId = createCart.insertId;
    } else {
      // Use existing cart
      cartId = existingCart[0].id;
    }

    // Check if package is already in cart
    const existingPackage = await ProductDao.checkPackageInCartDao(cartId, packageId);
    
    if (existingPackage.length > 0) {
      // Update quantity if package already exists
      const newQty = existingPackage[0].qty + qty;
      const updateResult = await ProductDao.updatePackageQtyInCartDao(cartId, packageId, newQty);
      
      if (updateResult.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to update package quantity in cart",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Package quantity updated in cart successfully",
        data: {
          cartId: cartId,
          packageId: packageId,
          qty: newQty
        }
      });
    } else {
      // Add new package to cart
      const result = await ProductDao.addPackageToCartDao(cartId, packageId, qty);
      
      if (result.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to add package to cart",
        });
      }

      return res.status(201).json({
        status: true,
        message: "Package added to cart successfully",
        data: {
          cartId: cartId,
          packageId: packageId,
          qty: qty
        }
      });
    }

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
    const { userId, buyerType } = req.user;
    const productData = req.body;

    console.log('product for cart', req.body);

    // Validate required product fields
    if (!productData.mpItemId || !productData.quantity || !productData.quantityType) {
      return res.status(400).json({
        status: false,
        message: "Product ID, quantity, and unit are required",
      });
    }

    let cartId;
    // Check if user already has a cart
    const existingCart = await ProductDao.getUserCartIdDao(userId);
    console.log(existingCart);

    if (existingCart.length === 0) {
      // Create new cart if user doesn't have one
      const createCartResult = await ProductDao.createCartDao(
        userId,
        buyerType
      );

      console.log(createCartResult);

      if (createCartResult.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to create cart",
        });
      }
      cartId = createCartResult.insertId;
    } else {
      cartId = existingCart[0].id;
    }

    // Check if product already exists in cart
    const existingProduct = await ProductDao.checkProductInCartDao(cartId, productData.mpItemId);
    
    if (existingProduct.length > 0) {
      // Update existing product quantity
      const updateResult = await ProductDao.updateProductQtyInCartDao(
        cartId,
        productData.mpItemId,
        productData.quantity
      );

      if (updateResult.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to update product in cart",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Product quantity updated in cart successfully",
        data: {
          cartId: cartId,
          productId: productData.mpItemId,
          quantity: productData.quantity,
          unit: productData.quantityType,
        },
      });
    } else {
      // Add new product to cart
      const addProductResult = await ProductDao.addProductToCartDao(
        cartId,
        productData.mpItemId,
        productData.quantity,
        productData.quantityType
      );

      if (addProductResult.affectedRows === 0) {
        return res.status(500).json({
          status: false,
          message: "Failed to add product to cart",
        });
      }

      res.status(201).json({
        status: true,
        message: "Product added to cart successfully",
        data: {
          cartId: cartId,
          productId: productData.mpItemId,
          quantity: productData.quantity,
          unit: productData.quantityType,
        },
      });
    }
  } catch (err) {
    console.error("Error adding product to cart:", err);

    // Handle specific error cases
    if (err.isJoi) {
      return res.status(400).json({
        status: false,
        error: "Validation error",
        details: err.message,
      });
    }

    res.status(500).json({
      status: false,
      error: "An error occurred while adding product to cart",
      details: err.message,
    });
  }
};

exports.checkProductInCart = async (req, res) => {
    try {
        const { userId } = req.user;
        const { mpItemId } = req.body;

        console.log('market place id',mpItemId);

        if (!mpItemId) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required",
            });
        }

        // Get user's cart
        const existingCart = await ProductDao.getUserCartIdDao(userId);
        
        if (existingCart.length === 0) {
            return res.status(200).json({
                status: true,
                inCart: false,
                message: "Product not in cart",
            });
        }

        const cartId = existingCart[0].id;
        
        // Check if product exists in cart
        const existingProduct = await ProductDao.checkProductInCartDao(cartId, mpItemId);
        
        return res.status(200).json({
            status: true,
            inCart: existingProduct.length > 0,
            message: existingProduct.length > 0 ? "Product already in cart" : "Product not in cart",
            data: existingProduct.length > 0 ? existingProduct[0] : null
        });

    } catch (err) {
        console.error("Error checking product in cart:", err);
        res.status(500).json({
            status: false,
            error: "An error occurred while checking product in cart",
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

exports.getCategoryCountsWholesale = async (req, res) => {
  try {
    const categoryCounts = await ProductDao.getCategoryCountsWholesaleDao();

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

// Updated Controller Function
exports.getProductsByCategoryWholesale = async (req, res) => {
  const { category, search } = req.query;

  console.log('wholesale category', category, 'search', search);

  if (!category) {
    return res.status(400).json({
      status: false,
      message: "Category parameter is required",
    });
  }

  try {
    const products = await ProductDao.getProductsByCategoryDaoWholesale(category, search);

    if (products.length === 0) {
      return res.json({
        status: false,
        message: search 
          ? `No wholesale products found for category "${category}" matching "${search}"` 
          : "No wholesale products found for this category",
        products: [],
      });
    }

    res.status(200).json({
      status: true,
      message: "Wholesale products found.",
      products: products,
    });
  } catch (err) {
    console.error("Error fetching wholesale products by category:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while fetching wholesale products.",
    });
  }
};




//------------------------------ cart functions ------------------------

// Get user's complete cart data
// exports.getUserCart = async (req, res) => {
//   try {
//     const { userId } = req.user;

//     // Get user's cart
//     const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    
//     if (userCart.length === 0) {
//       return res.status(200).json({
//         status: true,
//         message: "Cart is empty",
//         data: {
//           cart: null,
//           packages: [],
//           products: [],
//           summary: {
//             totalPackages: 0,
//             totalProducts: 0,
//             packageTotal: 0,
//             productTotal: 0,
//             grandTotal: 0
//           }
//         }
//       });
//     }

//     const cartId = userCart[0].cartId;
//     const cartInfo = userCart[0];

//     // Get packages in cart
//     const cartPackages = await ProductDao.getCartPackagesDao(cartId);
    
//     // Get package details for each package
//     const packagesWithDetails = await Promise.all(
//       cartPackages.map(async (pkg) => {
//         const packageItems = await ProductDao.getPackageDetailsDao(pkg.packageId);
//         return {
//           ...pkg,
//           items: packageItems,
//           totalItems: packageItems.reduce((sum, item) => sum + item.quantity, 0)
//         };
//       })
//     );

//     // Get individual products in cart
//     const cartProducts = await ProductDao.getCartProductsDao(cartId);

//     // Format products for frontend
//       const formattedProducts = cartProducts.map(product => ({
//         id: product.productId,
//         cartItemId: product.cartItemId,
//         name: product.name,
//         unit: product.unit,
//         quantity: parseFloat(product.quantity),
//         discount: parseFloat(product.discount) || 0,
//         price: parseFloat(product.discountedPrice || product.normalPrice), // This is already the discounted price per unit
//         normalPrice: parseFloat(product.normalPrice),
//         discountedPrice: parseFloat(product.discountedPrice) || null,
//         image: product.image,
//         varietyNameEnglish: product.varietyNameEnglish,
//         category: product.category,
//         createdAt: product.createdAt
//         // Removed any quantity multiplication
//       }));

//     // The summary calculation should just sum the discounted prices (not multiplied by quantity)
//     const productTotal = formattedProducts.reduce((sum, product) => sum + product.price, 0);

//     // Get cart summary
//     const summary = await ProductDao.getCartSummaryDao(cartId);

//     // Format response to match frontend structure
//     const responseData = {
//       cart: cartInfo,
//       packages: packagesWithDetails.map(pkg => ({
//         id: pkg.packageId,
//         cartItemId: pkg.cartItemId,
//         packageName: pkg.packageName,
//         totalItems: pkg.totalItems,
//         price: parseFloat(pkg.price),
//         quantity: pkg.quantity,
//         image: pkg.image,
//         description: pkg.description,
//         items: pkg.items.map(item => ({
//           name: item.name,
//           quantity: item.quantity,
//           hasSpecialBadge: false // You can implement logic for this
//         }))
//       })),
//       additionalItems: formattedProducts.length > 0 ? [{
//         id: 2, // Fixed ID for additional items section
//         packageName: "Additional Items",
//         Items: formattedProducts
//       }] : [],
//       summary: {
//         ...summary,
//       totalPackages: summary.totalPackages,
//           totalProducts: summary.totalProducts,
//           packageTotal: summary.packageTotal,
//           productTotal: productTotal, // Use our calculated productTotal
//           grandTotal: summary.packageTotal + productTotal,
//           couponDiscount: parseFloat(cartInfo.couponValue) || 0,
//           finalTotal: (summary.packageTotal + productTotal) - (parseFloat(cartInfo.couponValue) || 0)
//       }
//     };

//     res.status(200).json({
//       status: true,
//       message: "Cart data retrieved successfully",
//       data: responseData
//     });

//   } catch (err) {
//     console.error("Error retrieving cart:", err);
//     res.status(500).json({
//       status: false,
//       error: "An error occurred while retrieving cart data",
//       details: err.message
//     });
//   }
// };

exports.getUserCart = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    

        if (userCart.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Cart is empty",
        data: {
          cart: {
            cartId: 0, 
            userId: userId
          },
          packages: [],
          products: [],
          additionalItems: [],
          summary: {
            totalPackages: 0,
            totalProducts: 0,
            couponDiscount: 0
          }
        }
      });
    }

    const cartId = userCart[0].cartId;
    const cartInfo = userCart[0];

    // Get packages in cart
    const cartPackages = await ProductDao.getCartPackagesDao(cartId);
    
    // Get package details for each package
    const packagesWithDetails = await Promise.all(
      cartPackages.map(async (pkg) => {
        const packageItems = await ProductDao.getPackageDetailsDao(pkg.packageId);
        return {
          ...pkg,
          items: packageItems,
          totalItems: packageItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      })
    );

    // Get individual products in cart
    const cartProducts = await ProductDao.getCartProductsDao(cartId);

    // Format products for frontend
    const formattedProducts = cartProducts.map(product => ({
      id: product.productId,
      cartItemId: product.cartItemId,
      name: product.name,
      unit: product.unit,
      quantity: parseFloat(product.quantity),
      discount: parseFloat(product.discount) || 0,
      price: parseFloat(product.discountedPrice || product.normalPrice),
      normalPrice: parseFloat(product.normalPrice),
      discountedPrice: parseFloat(product.discountedPrice) || null,
      startValue: parseFloat(product.startValue) || null,    // Add this
      changeby: parseFloat(product.changeby) || null,        // Add this
      image: product.image,
      varietyNameEnglish: product.varietyNameEnglish,
      category: product.category,
      createdAt: product.createdAt
    }));

    // Get cart summary
    const summary = await ProductDao.getCartSummaryDao(cartId);

    // Format response to match frontend structure
    const responseData = {
      cart: cartInfo,
      packages: packagesWithDetails.map(pkg => ({
        id: pkg.packageId,
        cartItemId: pkg.cartItemId,
        packageName: pkg.packageName,
        totalItems: pkg.totalItems,
        price: parseFloat(pkg.price),
        quantity: pkg.quantity,
        image: pkg.image,
        description: pkg.description,
        items: pkg.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          hasSpecialBadge: false // You can implement logic for this
        }))
      })),
      additionalItems: formattedProducts.length > 0 ? [{
        id: 2, // Fixed ID for additional items section
        packageName: "Selected Items",
        Items: formattedProducts
      }] : [],
      summary: {
        ...summary,
        totalPackages: summary.totalPackages,
        totalProducts: summary.totalProducts,
        couponDiscount: parseFloat(cartInfo.couponValue) || 0
      }
    };

    res.status(200).json({
      status: true,
      message: "Cart data retrieved successfully",
      data: responseData
    });

  } catch (err) {
    console.error("Error retrieving cart:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while retrieving cart data",
      details: err.message
    });
  }
};

// Update product quantity in cart
exports.updateCartProductQuantity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        status: false,
        message: "Product ID and valid quantity are required"
      });
    }

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    
    if (userCart.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Cart not found"
      });
    }

    const cartId = userCart[0].cartId;

    // Update product quantity
    const updateResult = await ProductDao.updateCartProductQuantityDao(cartId, productId, quantity);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Product not found in cart"
      });
    }

    res.status(200).json({
      status: true,
      message: "Product quantity updated successfully",
      data: {
        productId,
        quantity
      }
    });

  } catch (err) {
    console.error("Error updating product quantity:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while updating product quantity",
      details: err.message
    });
  }
};

// Update package quantity in cart
exports.updateCartPackageQuantity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { packageId, quantity } = req.body;

    if (!packageId || !quantity || quantity <= 0) {
      return res.status(400).json({
        status: false,
        message: "Package ID and valid quantity are required"
      });
    }

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    
    if (userCart.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Cart not found"
      });
    }

    const cartId = userCart[0].cartId;

    // Update package quantity
    const updateResult = await ProductDao.updateCartPackageQuantityDao(cartId, packageId, quantity);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Package not found in cart"
      });
    }

    res.status(200).json({
      status: true,
      message: "Package quantity updated successfully",
      data: {
        packageId,
        quantity
      }
    });

  } catch (err) {
    console.error("Error updating package quantity:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while updating package quantity",
      details: err.message
    });
  }
};

// Remove product from cart
exports.removeCartProduct = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        status: false,
        message: "Product ID is required"
      });
    }

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    
    if (userCart.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Cart not found"
      });
    }

    const cartId = userCart[0].cartId;

    // Remove product from cart
    const removeResult = await ProductDao.removeCartProductDao(cartId, productId);

    if (removeResult.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Product not found in cart"
      });
    }

    res.status(200).json({
      status: true,
      message: "Product removed from cart successfully"
    });

  } catch (err) {
    console.error("Error removing product from cart:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while removing product from cart",
      details: err.message
    });
  }
};

// Remove package from cart
exports.removeCartPackage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { packageId } = req.params;

    if (!packageId) {
      return res.status(400).json({
        status: false,
        message: "Package ID is required"
      });
    }

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    
    if (userCart.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Cart not found"
      });
    }

    const cartId = userCart[0].cartId;

    // Remove package from cart
    const removeResult = await ProductDao.removeCartPackageDao(cartId, packageId);

    if (removeResult.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Package not found in cart"
      });
    }

    res.status(200).json({
      status: true,
      message: "Package removed from cart successfully"
    });

  } catch (err) {
    console.error("Error removing package from cart:", err);
    res.status(500).json({
      status: false,
      error: "An error occurred while removing package from cart",
      details: err.message
    });
  }
};


exports.bulkRemoveCartProducts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productIds } = req.body;

    console.log('product ids', req.body);
    console.log('userId', req.user);

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Product IDs array is required"
      });
    }

    // Convert to integers and filter valid IDs
    const validIds = productIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id > 0);
    
    if (validIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid product IDs provided"
      });
    }

    // Get user's cart
    const userCart = await ProductDao.getUserCartWithDetailsDao(userId);
    if (!userCart || userCart.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Cart not found"
      });
    }

    const cartId = userCart[0].cartId;

    // Bulk remove products
    const result = await ProductDao.bulkRemoveCartProductsDao(cartId, validIds);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "No products found in cart to remove"
      });
    }

    res.status(200).json({
      status: true,
      message: `${result.affectedRows} products removed from cart successfully`,
      removedCount: result.affectedRows
    });

  } catch (error) {
    console.error("Error bulk removing products from cart:", error);
    res.status(500).json({
      status: false,
      message: "Failed to remove products from cart",
      error: error.message
    });
  }
};

exports.getSuggestedItemsForNewUser = async (req, res) => {
  try {
    const { userId } = req.user;

    // Log userId for debugging
    console.log('Fetching suggestions for userId:', userId);

    // Check if the user is a first time user
    const suggestions = await ProductDao.getSuggestedItemsForNewUserDao(userId);

    if (!suggestions || suggestions.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No suggestions found for this user"
      });
    }

    res.status(200).json({
      status: true,
      message: "Suggested items fetched successfully",
      items: suggestions
    });

  } catch (error) {
    console.error("Error fetching suggested items for new user:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch suggested items",
      error: error.message
    });
  }
};


exports.excludeItems = async (req, res) => {
  try {
    const { userId } = req.user; // Ensure middleware sets req.user
    const { items } = req.body;  // Expecting an array of displayNames

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No items provided to exclude",
      });
    }

    // Debug log
    console.log(`Excluding items for userId ${userId}:`, items);

    const result = await ProductDao.insertExcludeItemsDao(userId, items);

    res.status(200).json({
      status: true,
      message: "Excluded items saved successfully",
      result,
    });

  } catch (error) {
    console.error("Error excluding items:", error);
    res.status(500).json({
      status: false,
      message: "Failed to save excluded items",
      error: error.message,
    });
  }
};
exports.getExcludedItems = async (req, res) => {
  try {
    const { userId } = req.user; // auth middleware should set this

    const savedItems = await ProductDao.getExcludedItemsDao(userId);

    res.status(200).json({
      status: true,
      items: savedItems,
    });

  } catch (error) {
    console.error("Error fetching excluded items:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch excluded items",
      error: error.message,
    });
  }
};

exports.deleteExcludedItems = async (req, res) => {
  try {
    const { userId } = req.user;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No items provided for deletion",
      });
    }

    const result = await ProductDao.deleteExcludedItemsDao(userId, items);

    return res.status(200).json({
      status: true,
      message: "Excluded items deleted successfully",
      result,
    });
  } catch (error) {
    console.error("Error deleting excluded items:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete excluded items",
      error: error.message,
    });
  }
};


exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.user; // Assumes auth middleware sets req.user

    // Debug log
    console.log(`Updating firstTimeUser for userId ${userId}`);



    const result = await ProductDao.updateUserStatusDao(userId);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found or already marked as non-first-time user",
      });
    }

    res.status(200).json({
      status: true,
      message: "User status updated successfully",
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};


exports.getSuggestedItems = async (req, res) => {
  try {
    const { userId } = req.user;

    // Log userId for debugging
    console.log('Fetching suggestions for userId:', userId);

    // Check if the user is a first time user
    const suggestions = await ProductDao.getSuggestedItemsDao(userId);

    if (!suggestions || suggestions.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No suggestions found for this user"
      });
    }

    res.status(200).json({
      status: true,
      message: "Suggested items fetched successfully",
      items: suggestions
    });

  } catch (error) {
    console.error("Error fetching suggested items for new user:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch suggested items",
      error: error.message
    });
  }
};

exports.searchProductsAndPackages = async (req, res) => {
  try {
    // Get search term from query parameters
    const { search } = req.query;

    // Validate search parameter
    if (!search || search.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Search parameter is required and cannot be empty'
      });
    }

    // Trim the search term to remove extra spaces
    const searchTerm = search.trim();

    // Call DAO function
    const results = await ProductDao.searchProductsAndPackagesDao(searchTerm);

    // Return successful response
    res.status(200).json({
      status: 'success',
      message: `Found ${results.length} items matching "${searchTerm}"`,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error in searchProductsAndPackages controller:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error occurred while searching',
      error: error.message
    });
  }
};