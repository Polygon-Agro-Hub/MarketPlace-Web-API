const Joi = require('joi');


exports.packageDetailsSchema = Joi.object({
    packageId: Joi.number().integer().required()
});

// exports.packageAddToCartSchema = Joi.array().items(
//     Joi.object({
//         id: Joi.number().integer().positive().required(),
//         packageId: Joi.number().integer().positive().required(),
//         quantity: Joi.number().required(),
//         quantityType: Joi.string().valid('Kg', 'g').required(),
//         displayName: Joi.string().required(),
//         mpItemId: Joi.number().integer().positive().required()
//     })
// ).min(1).required(); // Ensures at least one item in the array

exports.packageAddToCartSchema = Joi.object({
    id: Joi.number().positive().required()
});


exports.productDetailsSchema = Joi.object({
    quantity: Joi.number().required(),
    quantityType: Joi.string().valid('Kg', 'g').required(),
    displayName: Joi.string().optional(),
    mpItemId: Joi.number().integer().positive().required()
});

exports.addSlideSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  title: Joi.string().allow(""),
  description: Joi.string().allow(""),
});


exports.getSuggestedItemsForNewUserSchema = Joi.object({
  userId: Joi.number().positive().required(),
});

// Validation schema for excludeItems
exports.excludeItemsSchema = Joi.object({
  userId: Joi.number().positive().required(),
  items: Joi.array().items(Joi.string().required()).min(1).required(),
});

// Validation schema for getExcludedItems
exports.getExcludedItemsSchema = Joi.object({
  userId: Joi.number().positive().required(),
});


// Validation schema for deleteExcludedItems
exports.deleteExcludedItemsSchema = Joi.object({
  userId: Joi.number().positive().required(),
  items: Joi.array().items(Joi.string().required()).min(1).required(),
});


// Validation schema for updateUserStatus
exports.updateUserStatusSchema = Joi.object({
  userId: Joi.number().positive().required(),
});