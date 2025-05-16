const Joi = require('joi');

exports.packageDetailsSchema = Joi.object({
    packageId: Joi.number().integer().required()
});

exports.packageAddToCartSchema = Joi.array().items(
    Joi.object({
        id: Joi.number().integer().positive().required(),
        packageId: Joi.number().integer().positive().required(),
        quantity: Joi.number().required(),
        quantityType: Joi.string().valid('Kg', 'g').required(),
        displayName: Joi.string().required(),
        mpItemId: Joi.number().integer().positive().required()
    })
).min(1).required(); // Ensures at least one item in the array



exports.productDetailsSchema = Joi.object({
    quantity: Joi.number().required(),
    quantityType: Joi.string().valid('Kg', 'g').required(),
    displayName: Joi.string().optional(),
    mpItemId: Joi.number().integer().positive().required()
});