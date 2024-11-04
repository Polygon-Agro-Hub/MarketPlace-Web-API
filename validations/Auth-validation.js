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
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().min(8).required(),
    terms: Joi.boolean().required()
});