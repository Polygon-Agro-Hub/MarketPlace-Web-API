const Joi = require('joi');

const billingDetailsSchema = Joi.object({
  title: Joi.string().required(),
  fullName: Joi.string().required(),
  buildingType: Joi.string().required(),
  houseNo: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  phonecode1: Joi.string().required(),
  phone1: Joi.string().required(),
  phonecode2: Joi.string().allow(null, ''),
  phone2: Joi.string().allow(null, '')
});

/**
 * Validate billing details
 * @param {object} data - The billing data to validate
 * @returns {object} - The validation result
 */
exports.validateBillingDetails = (data) => {
  return billingDetailsSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateBillingDetails: exports.validateBillingDetails,
  billingDetailsSchema
};