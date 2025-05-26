const CartDao = require("../dao/Cart-dao");
const ProductValidate = require("../validations/product-validation");

exports.getTrueCart = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const userId = req.params.userId;
    const cart = await CartDao.getTrueCart(userId);
    console.log("Cart retrieved:", userId);
    if (cart.length === 0) {
      return res.json({
        status: false,
        message: "No cart found",
        cart: [],
      });
    }
    res.status(200).json({
      status: true,
      message: "cart found.",
      cart: cart,
    });
  } catch (err) {
    console.error("Error during get product:", err);
    res.status(500).json({ error: "An error occurred during retrieval." });
  }
};




exports.getCartDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await CartDao.getCartByUserId(userId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const result = { cartId: cart.id };

    if (cart.isAditional) {
      result.additionalItems = await CartDao.getAdditionalItems(cart.id);
    }

    if (cart.isPackage) {
      const packageItems = await CartDao.getPackageItems(cart.id);
      result.packageItems = await Promise.all(packageItems.map(async (pkg) => {
        const baseDetails = await CartDao.getPackageDetails(pkg.packageId);

        if (pkg.isMin) {
          const minusItems = await CartDao.getPackageItemMin(pkg.id);
          baseDetails.forEach(item => {
            const minus = minusItems.find(m => m.packageItemId === item.id);
            if (minus) item.quantity -= minus.qty;
          });
        }

        if (pkg.isAdded) {
          const addedItems = await CartDao.getPackageItemAdded(pkg.id);
          addedItems.forEach(add => {
            const existing = baseDetails.find(i => i.id === add.packageItemId);
            if (existing) {
              existing.quantity += add.qty;
            } else {
              baseDetails.push({ ...add, id: add.packageItemId });
            }
          });
        }

        return {
          packageId: pkg.packageId,
          finalItems: baseDetails
        };
      }));
    }

    res.json(result);

  } catch (error) {
    console.error('DAO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.createOrder = async (req, res) => {
  try {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);

    const { items, cartId, checkoutDetails, paymentMethod, discountAmount, grandTotal } = req.body;
    console.log("Order creation started", items);

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array" });
    }

    const {
      buildingType,
      houseNo,
      street,
      cityName,
      buildingNo,
      buildingName,
      flatNumber,
      floorNumber,
      deliveryMethod,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName
    } = checkoutDetails;

    const homedeliveryId = await CartDao.createDeliveryAddress(
      buildingType,
      houseNo,
      street,
      cityName,
      buildingNo,
      buildingName,
      flatNumber,
      floorNumber
    );

    const cartDetails = await CartDao.checkCartDetails(cartId);
    const userId = cartDetails[0]?.userId;

    if (!userId) {
      return res.status(400).json({ error: "Invalid cart or missing user" });
    }

    const orderId = await CartDao.createOrder(
      userId,
      deliveryMethod,
      homedeliveryId,
      title,
      phoneCode1,
      phone1,
      phoneCode2,
      phone2,
      scheduleType,
      deliveryDate,
      timeSlot,
      fullName,
      grandTotal,
      discountAmount
    );

    for (const item of items) {
      await CartDao.saveOrderItem({
        orderId,
        productId: item.productId,
        unit: item.unit,
        qty: item.qty,
        discount: item.totalDiscount || 0,
        price: item.totalPrice || 0,
        packageId: item.itemType === 'package' ? item.packageId : null,
        packageItemId: item.itemType === 'package' ? item.id : null
      });
    }

    console.log("Order creation success");
    return res.status(200).json({ status: true, message: "Order created", });
  } catch (err) {
    console.error("Error executing query:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while creating Order" });
  }
};
