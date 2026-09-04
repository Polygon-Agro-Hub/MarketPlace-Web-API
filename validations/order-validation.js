const Joi = require('joi');

exports.couponValidationSchema = Joi.object({
    coupon: Joi.string().required(),
    deliveryMethod: Joi.string().required()
});

// Validates the nested checkoutDetails object sent as part of createOrder
const checkoutDetailsSchema = Joi.object({
    deliveryMethod: Joi.string().valid('home', 'pickup').required(),

    title: Joi.string().max(5).required(),
    fullName: Joi.string().pattern(/^[A-Za-z\s]+$/).max(255).required()
        .messages({ 'string.pattern.base': 'Full Name must only contain letters and spaces.' }),

    phoneCode1: Joi.string().max(5).required(),
    phone1: Joi.string().pattern(/^\d{9}$/).required()
        .messages({ 'string.pattern.base': 'Please enter a valid mobile number (format: 7XXXXXXXX)' }),

    phoneCode2: Joi.string().max(5).allow('', null),
    phone2: Joi.string().pattern(/^\d{9}$/).allow('', null)
        .messages({ 'string.pattern.base': 'Please enter a valid mobile number (format: 7XXXXXXXX)' }),

    // Home delivery address fields — required only when deliveryMethod === 'home'
    buildingType: Joi.string().valid('apartment', 'house', 'Apartment', 'House').when('deliveryMethod', {
        is: 'home',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }),
    buildingNo: Joi.string().max(50).allow('', null),
    buildingName: Joi.string().max(255).allow('', null),
    flatNumber: Joi.string().max(50).allow('', null),
    floorNumber: Joi.string().max(50).allow('', null),
    houseNo: Joi.string().max(50).when('deliveryMethod', {
        is: 'home',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }),
    street: Joi.string().max(255).when('deliveryMethod', {
        is: 'home',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }),
    cityName: Joi.string().max(255).when('deliveryMethod', {
        is: 'home',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }),

    // Pickup — required only when deliveryMethod === 'pickup'
    centerId: Joi.number().integer().positive().when('deliveryMethod', {
        is: 'pickup',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null),
    }),

    // Schedule
    scheduleType: Joi.string().valid('One Time', 'Once a week', 'Twice a week').required(),
    deliveryDate: Joi.string().isoDate().when('scheduleType', {
        is: 'One Time',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }),
    timeSlot: Joi.string().valid(
        '08:00 AM - 12:00 PM',
        '12:00 PM - 04:00 PM',
        '04:00 PM - 09:00 PM',
    ).required(),

    selectedDays: Joi.string()
        .custom((value, helpers) => {
            let parsed;
            try {
                parsed = JSON.parse(value);
            } catch (e) {
                return helpers.error('any.invalid');
            }
            if (!Array.isArray(parsed)) {
                return helpers.error('any.invalid');
            }
            const validDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']; // CHANGED - short codes
            const allValid = parsed.every((d) => validDays.includes(d));
            if (!allValid) {
                return helpers.error('any.invalid');
            }
            return value;
        }, 'selectedDays JSON validation')
        .when('scheduleType', {
            is: Joi.valid('Once a week', 'Twice a week'),
            then: Joi.required(),
            otherwise: Joi.optional().allow('', null),
        })
        .messages({ 'any.invalid': 'selectedDays must be a JSON array of valid day codes (Mo, Tu, We, Th, Fr, Sa, Su).' }),

    validPeriod: Joi.string().pattern(/^(0[2-9]|1[0-2])$/).when('scheduleType', {
        is: Joi.valid('Once a week', 'Twice a week'),
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null),
    }).messages({ 'string.pattern.base': 'validPeriod must be between 02 and 12 weeks.' }),

    sheduleDate: Joi.string().isoDate().allow(null),

    // Coupon
    isCoupon: Joi.boolean().default(false),
    couponValue: Joi.number().min(0).default(0),
    couponCode: Joi.string().allow('', null),
    couponType: Joi.string().valid('Free Delivery', 'Free Delivary', 'Percentage', 'Fixed Amount', null).allow('', null),

    // Geo
    geoLatitude: Joi.number().min(-90).max(90).allow(null),
    geoLongitude: Joi.number().min(-180).max(180).allow(null),

    companycenterId: Joi.number().integer().allow(null),

    saveAs: Joi.string().max(100).allow('', null),
}).unknown(false); // reject unexpected fields for security

exports.createOrderValidationSchema = Joi.object({
    cartId: Joi.number().integer().positive().required(),
    checkoutDetails: checkoutDetailsSchema.required(),
    paymentMethod: Joi.string().valid('card', 'cash', 'Card', 'Cash').required(),
    discountAmount: Joi.number().min(0).default(0),
    grandTotal: Joi.number().positive().required(),
    orderApp: Joi.string().max(25).default('Marketplace'),
    deliveryCharge: Joi.number().min(0).default(0),
    isCreditApplied: Joi.boolean().optional(),
    creditPaid: Joi.number().min(0).default(0),
    moneyPaid: Joi.number().min(0).default(0),
    isFinalizeImdt: Joi.number().valid(0, 1).default(0),
}).unknown(false);