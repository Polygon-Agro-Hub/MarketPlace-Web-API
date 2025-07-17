const jwt = require("jsonwebtoken");
const athDao = require("../dao/Auth-dao");
const ValidateSchema = require('../validations/Auth-validation')
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require("uuid");

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const uploadFileToS3 = require('../middlewares/s3upload');



exports.userLogin = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    console.log('bodyyy---',req.body)
    const validateSchema = await ValidateSchema.loginAdminSchema.validateAsync(req.body);
    const { email, password, buyerType } = validateSchema;
    const user = await athDao.userLogin(email, buyerType);

    if (!user) {
      return res.status(401).json({ status: false, message: "User not found or invalid account type." });
    }

    const verify_password = bcrypt.compareSync(password, user.password);

    if (!verify_password) {
      return res.status(401).json({ status: false, message: "Wrong password." });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + (5 * 60 * 60); // 5 hours in seconds
    // const expirationTime = Math.floor(Date.now() / 1000) + (5 * 60); // 1 minute in seconds


    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        buyerType: user.buyerType,
        cusId: user.cusId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    console.log(token)
    const package = await athDao.getCartPackageInfoDao(user.id);
    const items = await athDao.getCartAdditionalInfoDao(user.id);
    const cartObj = {
      price: parseFloat(package.price) + parseFloat(items.price),
      count: parseFloat(package.count) + parseFloat(items.count)
    }
    console.log(cartObj);


    return res.status(201).json({
      success: true,
      message: "User login successfully.",
      token: token,
      tokenExpiration: expirationTime, // Add expiration time to response
      userData: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        buyerType: user.buyerType,
        image: user.image,
        cart: cartObj
      }
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred during login." });
  }
};

exports.userSignup = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Signup endpoint hit: ${fullUrl}`);

  try {
    console.log('Request body:', req.body);

    const user = await ValidateSchema.signupAdminSchema.validateAsync(req.body);
    // const user  = req.body;
    console.log('Validated user data:', user);


    const existingUser = await athDao.getUserByEmail(user.email);
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "Email already in use."
      });
    }


    const hashedPassword = bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS));
    console.log('Generated hashed password.');

    const lastId = await athDao.getMarketPlaceUserLastCusIdDao();
    let nextId;
    if (lastId === null || lastId === undefined) {
      nextId = 'MAR-00001';
    } else {

      const numericPart = parseInt(lastId.split('-')[1], 10);
      const nextNumber = numericPart + 1;

      nextId = `MAR-${nextNumber.toString().padStart(5, '0')}`;
    }

    console.log('Last user ID from database:', nextId);

    const signupResult = await athDao.signupUser(user, hashedPassword, nextId);

    if (signupResult.status) {
      return res.status(201).json({
        status: true,
        message: signupResult.message,
        data: signupResult.data  // e.g., { userId: ... }
      });
    } else {
      console.error('Database signup issue:', signupResult);
      return res.status(500).json({
        status: false,
        message: signupResult.message || 'Failed to sign up.'
      });
    }
  } catch (err) {
    console.error('Error during signup:', err);


    if (err.isJoi) {
      return res.status(400).json({
        status: false,
        message: 'Validation error.',
        details: err.details.map(detail => detail.message)
      });
    }


    if (err.status === false) {
      return res.status(500).json({
        status: false,
        message: err.message || 'Database error.',
        error: err.error || null
      });
    }


    res.status(500).json({
      status: false,
      message: 'An unexpected error occurred during signup.',
      error: err.message
    });
  }
};


// Google Authentication end-points

exports.googleAuth = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Google auth endpoint hit: ${fullUrl}`);

  try {
    // Validate the request body
    const validatedData = await ValidateSchema.googleAuthSchema.validateAsync(req.body);

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: validatedData.token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;

    // Check if the user already exists
    let user = await athDao.getUserByGoogleId(googleId);
    let isNewUser = false;

    if (!user) {
      // If user doesn't exist, create a new one
      isNewUser = true;
      const userData = {
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        googleId: googleId,
        imageUrl: payload.picture
      };

      const createResult = await athDao.createGoogleUser(userData);

      if (!createResult.status) {
        return res.status(500).json({
          status: false,
          message: 'Failed to create user account with Google'
        });
      }

      // Get the newly created user
      user = await athDao.getUserByGoogleId(googleId);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        buyerType: user.buyerType || ''
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    return res.status(200).json({
      success: true,
      message: isNewUser ? "User registered and logged in with Google" : "User logged in with Google",
      isNewUser,
      token,
      userData: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        buyerType: user.buyerType || '',
        image: user.image
      }
    });

  } catch (error) {
    console.error('Error during Google authentication:', error);

    if (error.isJoi) {
      return res.status(400).json({
        status: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    if (error.message === 'Invalid token') {
      return res.status(401).json({
        status: false,
        message: 'Invalid Google token'
      });
    }

    res.status(500).json({
      status: false,
      message: 'An error occurred during Google authentication',
      error: error.message
    });
  }
};




exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log('email:', email);
  try {
    const user = await athDao.getUserByEmail(email);
    if (!user) {
      return res.status(200).json({
        message: 'It Seems you do not have a account with us using this email !'
      });
    }

    console.log('User found:', user);
    const resetToken = await athDao.createPasswordResetToken(email);

    const resetUrl = `${process.env.FRONTEND_URL}reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    const currentDate = new Date().toLocaleDateString();

    // Email setup
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USERNAME || 'agroworldinf@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'ddaierninefzzvjt',
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: {
        name: 'Agro World',
        address: process.env.EMAIL_FROM || 'agroworldinf@gmail.com'
      },
      to: email,
      subject: 'Agro world Marketplace Password Reset Link',
      text: `
AGRO WORLD PASSWORD RESET

Hello from Agro World,

You requested to reset your password. Please click the link below:

${resetUrl}

If you didn't request this, you can safely ignore this email.

Thank you,
Agro World Team
${currentDate}

---
This is a transactional email regarding your Agro World account.
      `,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; margin: 0; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #4CAF50; padding: 30px 40px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Agro World</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin-top: 0; color: #333; font-size: 22px;">Password Reset Request</h2>
                    <p style="margin-bottom: 20px; font-size: 16px;">Hello,</p>
                    <p style="margin-bottom: 20px; font-size: 16px;">We received a request to reset your password for your Agro World account. Click the button below to reset it:</p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; font-weight: bold; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-size: 16px;">Reset My Password</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin-bottom: 20px; font-size: 16px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="margin-bottom: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
                    
                    <p style="margin-bottom: 5px; font-size: 16px;">Thank you,</p>
                    <p style="margin-top: 0; font-weight: bold; font-size: 16px;">The Agro World Team</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f5f5f5; padding: 20px 40px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; text-align: center; font-size: 14px; color: #666;">
                    <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} Agro World. All rights reserved.</p>
                    <p style="margin: 0;">If you didn't request this email, please disregard it.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Space at bottom -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; font-size: 12px; color: #999;">
                    <p style="margin: 0;">This is an automated message from Agro World</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    };

    // Add essential headers to reduce spam likelihood
    mailOptions.headers = {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Mailer': 'Agro World Service (Node.js)',
      'List-Unsubscribe': '<mailto:support@agroworld.com?subject=unsubscribe>'
    };

    // Additional email properties that help avoid spam filters
    mailOptions.messageId = `<password-reset-${Date.now()}@agroworld.com>`;
    mailOptions.priority = 'high';

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ', info.messageId);
      res.status(200).json({
        message: 'Please check your emails, a password reset link has been sent.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);

      try {
        const simpleTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USERNAME ,
            pass: process.env.EMAIL_PASSWORD ,
          }
        });

        const simpleMailOptions = {
          from: 'Agro World <tnathuluwage@gmail.com>',
          to: email,
          subject: 'Password Reset Link - Agro World',
          text: `Click here to reset your password: ${resetUrl}`,
          html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
        };

        await simpleTransporter.sendMail(simpleMailOptions);
        res.status(200).json({
          message: 'Please check your emails, a password reset link has been sent.'
        });
      } catch (fallbackError) {
        console.error('Fallback email sending error:', fallbackError);
        res.status(500).json({ error: 'Failed to send password reset email.' });
      }
    }
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};

// Controller to validate reset token
// Validate Reset Token Controller
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token using the DAO method
    const tokenData = await athDao.verifyResetToken(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: tokenData.email
    });
  } catch (error) {
    console.error('Error in validateResetToken:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log('Reset password request:', req.body);

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get email from token
    const tokenData = await athDao.verifyResetToken(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const { email } = tokenData;
    console.log('Email from token:', email);

    // Proceed with password reset
    await athDao.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Your password has been updated successfully.'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

exports.checkPhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;

  console.log('Checking phone number:', phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    const user = await athDao.getUserByPhoneNumber(phoneNumber);
    if (user) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking phone number:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPasswordByPhone = async (req, res) => {
  const { phoneNumber, newPassword } = req.body;

  console.log('Reset password by phone request:', req.body);

  if (!phoneNumber || !newPassword) {
    return res.status(400).json({ error: "Phone number and new password are required" });
  }

  try {
    const result = await athDao.updatePasswordByPhoneNumber(phoneNumber, newPassword);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error resetting password by phone:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.getprofile = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const userId = req.user.userId


    // Insert new user into the database
    const newUser = await athDao.getUserProfileDao(userId);


    res.status(200).json({
      status: true,

      data: newUser,

    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "An error occurred during signup." });
  }
};




exports.updatePassword = async (req, res) => {
  const id = req.user.userId; // Correctly extract userId from JWT
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "New passwords do not match" });
  }

  try {
    const result = await athDao.updatePasswordDao(id, currentPassword, newPassword);
    res.status(200).json({ message: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};




exports.editUserProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const { title, firstName, lastName, email, phoneCode, phoneNumber } =
      await ValidateSchema.editUserProfileSchema.validateAsync(req.body);

    console.log('Request Body:', req.body);

    // Fetch existing user
    const existingUser = await athDao.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    // Check for duplicate email only if changed
    if (email !== existingUser.email) {
      const emailExists = await athDao.checkEmailExists(email, userId);
      if (emailExists) {
        return res.status(400).json({ status: false, message: "Email already exists." });
      }
    }

    // Check for duplicate phone only if changed
    if (phoneNumber !== existingUser.phoneNumber || phoneCode !== existingUser.phoneCode) {
      const phoneExists = await athDao.checkPhoneExists(phoneCode, phoneNumber, userId);
      if (phoneExists) {
        return res.status(400).json({ status: false, message: "Phone number already exists." });
      }
    }

    // Handle profile image
    let profilePictureUrl = existingUser.profilePicture;
    if (req.file) {
      if (profilePictureUrl) {
        await deleteFromS3(profilePictureUrl);
      }
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      profilePictureUrl = await uploadFileToS3(fileBuffer, fileName, "marketplaceusers/profile-images");
    }

    // Update user profile
    const result = await athDao.editUserProfileDao(userId, {
      title,
      firstName,
      lastName,
      email,
      phoneCode,
      phoneNumber,
      profilePicture: profilePictureUrl,
    });

    return res.status(200).json({
      status: true,
      message: result.affectedRows === 0 ? "No changes made to profile." : "Profile updated successfully.",
      profilePicture: profilePictureUrl,
    });

  } catch (err) {
    console.error("Error updating profile:", err.message, err.stack);
    return res.status(500).json({ status: false, message: err.message || "An error occurred while updating profile." });
  }
};


exports.getBillingDetails = async (req, res) => {
  const userId = req.user.userId;

  try {
    const details = await athDao.getBillingDetails(userId);
    res.status(200).json({ status: true, data: details || {} });
  } catch (err) {
    console.error("Get Billing Details Error:", err);
    res.status(500).json({ status: false, message: "Failed to retrieve billing details." });
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await athDao.getAllCities();
    res.status(200).json({ status: true, data: cities });
  } catch (err) {
    console.error("Get All Cities Error:", err);
    res.status(500).json({ status: false, message: "Failed to retrieve cities." });
  }
};


exports.saveOrUpdateBillingDetails = async (req, res) => {
  const userId = req.user.userId;

  try {
    const validatedDetails = await ValidateSchema.UserAddressItemsSchema.validateAsync(req.body);
    const result = await athDao.saveOrUpdateBillingDetails(userId, validatedDetails);
    res.status(200).json(result); // Use the result directly for success
  } catch (err) {
    console.error("Save Billing Details Error:", err.message);
    if (err.message === 'Phone number(s) already in use by another user') {
      return res.status(400).json({ status: false, message: err.message });
    }
    res.status(500).json({ status: false, message: "Failed to save billing details." });
  }
};

exports.unsubscribeUser = async (req, res) => {
  const email = req.user.email; // assuming email is available from auth middleware
  const { action } = req.body;

  if (!['unsubscribe', 'stay'].includes(action)) {
    return res.status(400).json({
      status: false,
      message: 'Invalid action. Must be "unsubscribe" or "stay".',
    });
  }

  try {
    const result = await athDao.unsubscribeUser(email, action);
    res.status(200).json(result);
  } catch (err) {
    console.error("Unsubscribe Error:", err);
    res.status(500).json({
      status: false,
      message: "Failed to update subscription preference.",
    });
  }
};


exports.submitComplaint = async (req, res) => {
  try {
    // const { userId } = req.params;
    const { userId, cusId } = req.user; // thos shoud chang 
    const { complaintCategoryId, complaint } = req.body;
    const images = req.files;
    console.log(images);
    if (!userId || !complaintCategoryId || !complaint) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: userId, complaintCategoryId, or complaint.',
      });
    }

    if (isNaN(parseInt(userId)) || isNaN(parseInt(complaintCategoryId))) {
      return res.status(400).json({
        status: false,
        message: 'Invalid userId or complaintCategoryId.',
      });
    }

    const lastId = await athDao.getComplainLastCusIdDao(cusId);
    let nextId;
    if (lastId) {
      const numericPart = lastId.substring(cusId.length);
      const nextNum = parseInt(numericPart) + 1;
      nextId = cusId + String(nextNum).padStart(numericPart.length, '0');
    } else {
      nextId = cusId + '001';
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const imageUrls = [];
    if (images && images.length > 0) {
      for (const image of images) {
        if (!allowedMimeTypes.includes(image.mimetype)) {
          return res.status(400).json({
            status: false,
            message: `Unsupported file type: ${image.mimetype}`,
          });
        }
        if (image.size > maxFileSize) {
          return res.status(400).json({
            status: false,
            message: `File too large: ${image.originalname} exceeds 5MB`,
          });
        }
        const imageUrl = await uploadFileToS3(image.buffer, image.originalname, 'complaints');
        imageUrls.push(imageUrl);
      }
    }
    console.log("images", imageUrls[0]);
    const result = await athDao.createComplaint(
      parseInt(userId),
      parseInt(complaintCategoryId),
      complaint,
      imageUrls,
      nextId
    );

    res.status(201).json({
      status: true,
      message: 'Complaint submitted successfully.',
      complaintId: result.complaintId,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to submit complaint.',
      error: error.message || error,
    });
  }
};

exports.getComplaintsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        status: false,
        message: 'Invalid or missing userId.',
      });
    }

    const result = await athDao.getComplaintsByUserId(parseInt(userId));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getComplaintsByUserId:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving complaints.',
      error: error.message || error,
    });
  }
};



exports.getCategoryEnglishByAppId = async (req, res) => {
  try {
    const appId = req.params.appId ? parseInt(req.params.appId) : 3;

    if (isNaN(appId)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid appId parameter.',
      });
    }

    const result = await athDao.getCategoryEnglishByAppId(appId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getCategoryEnglishByAppId:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving categories.',
      error: error.message || error,
    });
  }
};


exports.getCartInfo = async (req, res) => {
  try {
    const userId = req.user.userId
    console.log("----------------------------------------------Cart Info----------------------------------");

    const package = await athDao.getCartPackageInfoDao(userId);
    const items = await athDao.getCartAdditionalInfoDao(userId);
    const cartObj = {
      price: parseFloat(package.price) + parseFloat(items.price),
      count: parseFloat(package.count) + parseFloat(items.count)
    }
    console.log(cartObj, userId);

    res.status(200).json(cartObj);
  } catch (error) {
    console.error('Error in getCategoryEnglishByAppId:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving categories.',
      error: error.message || error,
    });
  }
};