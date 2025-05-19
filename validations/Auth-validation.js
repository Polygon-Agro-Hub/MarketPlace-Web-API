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
});

exports.editUserProfileSchema = Joi.object({
    title:Joi.string().required(),
    firstName:Joi.string().required(),
    lastName:Joi.string().required(),
    email:Joi.string().required(),
    phoneCode:Joi.string().required(),
    phoneNumber:Joi.string().required(),
});

exports.billingDetailsSchema = Joi.object({
  title: Joi.string().required(),
  firstName: Joi.string().required(),
  buildingNo: Joi.string().required(),
  buildingType: Joi.string().required(),
  streetName: Joi.string().required(),
  city: Joi.string().required(),
  phoneCode1: Joi.string().required(),
  phoneNumber1: Joi.string().pattern(/^[0-9]{7,15}$/).required(),
  phoneCode2: Joi.string().optional(),
  phoneNumber2: Joi.string().allow('').pattern(/^[0-9]{7,15}$/).optional(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('').optional(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
});
