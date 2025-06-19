// admin-validation.js
const Joi = require('joi');

exports.loginAdminSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    buyerType:Joi.string().required(),
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
    confirmPassword: Joi.string().required()
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

// Validation schema for submitting a complaint (POST /complaints/:userId)
exports.submitComplaintSchema = Joi.object({
  params: Joi.object({
    userId: Joi.number().integer().positive().required().messages({
      'number.base': 'userId must be a number.',
      'number.integer': 'userId must be an integer.',
      'number.positive': 'userId must be a positive number.',
      'any.required': 'userId is required.'
    })
  }),
  body: Joi.object({
    complaintCategoryId: Joi.number().integer().positive().required().messages({
      'number.base': 'complaintCategoryId must be a number.',
      'number.integer': 'complaintCategoryId must be an integer.',
      'number.positive': 'complaintCategoryId must be a positive number.',
      'any.required': 'complaintCategoryId is required.'
    }),
    complaint: Joi.string().min(1).max(1000).required().messages({
      'string.base': 'complaint must be a string.',
      'string.empty': 'complaint cannot be empty.',
      'string.min': 'complaint must be at least 1 character long.',
      'string.max': 'complaint cannot exceed 1000 characters.',
      'any.required': 'complaint is required.'
    })
  }),
  files: Joi.array().items(
    Joi.object({
      mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml').required().messages({
        'string.valid': 'Unsupported file type. Allowed types are jpeg, png, gif, webp, svg.',
        'any.required': 'File mimetype is required.'
      }),
      size: Joi.number().max(5 * 1024 * 1024).required().messages({
        'number.max': 'File size cannot exceed 5MB.',
        'any.required': 'File size is required.'
      })
    })
  ).optional().messages({
    'array.base': 'Files must be an array of file objects.'
  })
});

// Validation schema for getting a complaint by ID (GET /complaints/:complainId)
exports.getComplaintByIdSchema = Joi.object({
  params: Joi.object({
    complainId: Joi.number().integer().positive().required().messages({
      'number.base': 'complainId must be a number.',
      'number.integer': 'complainId must be an integer.',
      'number.positive': 'complainId must be a positive number.',
      'any.required': 'complainId is required.'
    })
  })
});

// Validation schema for getting complaints by user ID (GET /complaints/user/:userId)
exports.getComplaintsByUserIdSchema = Joi.object({
  params: Joi.object({
    userId: Joi.number().integer().positive().required().messages({
      'number.base': 'userId must be a number.',
      'number.integer': 'userId must be an integer.',
      'number.positive': 'userId must be a positive number.',
      'any.required': 'userId is required.'
    })
  })
});

// module.exports = {
//   submitComplaintSchema,
//   getComplaintByIdSchema,
//   getComplaintsByUserIdSchema
// };