// admin-validation.js
const Joi = require('joi');

exports.loginAdminSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.signupAdminSchema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneCode: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    buyerType: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    agreeToMarketing: Joi.boolean().required(),
    agreeToTerms: Joi.boolean().required(),
    confirmPassword: Joi.string().required(),
});

exports.googleAuthSchema = Joi.object({
  token: Joi.string().required(),

});

exports.editUserProfileSchema = Joi.object({
    title:Joi.string().required(),
    firstName:Joi.string().required(),
    lastName:Joi.string().required(),
    email:Joi.string().required(),
    phoneCode:Joi.string().required(),
    phoneNumber:Joi.string().required(),
});

exports.UserAddressItemsSchema = Joi.object({
  billingTitle: Joi.string().required(),
  billingName: Joi.string().required(),
  title: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().allow('', null),
  phoneCode: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  buildingType: Joi.string().valid('house', 'apartment').required(),
  address: Joi.object({
    houseNo: Joi.string().allow('', null),
    buildingNo: Joi.string().allow('', null),
    buildingName: Joi.string().allow('', null),
    unitNo: Joi.string().allow('', null),
    floorNo: Joi.any().allow(null),
    streetName: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
  }).required(),
  phonecode2: Joi.string().allow('', null),
  phone2: Joi.string().allow('', null),
});

