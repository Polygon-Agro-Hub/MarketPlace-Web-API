// admin-validation.js
const Joi = require('joi');

exports.loginAdminSchema = Joi.object({
    email: Joi.string().required(),
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
  title: Joi.string().required(),
  fullName: Joi.string().required(),
  houseNo: Joi.string().allow('', null),
  buildingType: Joi.string().allow('', null),
  street: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  phonecode1: Joi.string().required(),
  phone1: Joi.string().required(),
  phonecode2: Joi.string().allow('', null),
  phone2: Joi.string().allow('', null)
});
