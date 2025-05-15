const jwt = require("jsonwebtoken");
const athDao = require("../dao/Auth-dao");
const ValidateSchema = require("../validations/Auth-validation");
const bcrypt = require("bcryptjs");

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.userLogin = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validateShcema = await ValidateSchema.loginAdminSchema.validateAsync(req.body);

    // const { email, password } = req.body;

    const user = await athDao.userLogin(validateShcema.email);

    if (!user) {
      return res.status(401).json({ status: false, message: "User not found." });
    }

    if (user) {
      const verify_password = bcrypt.compareSync(validateShcema.password, user.password);

      if (!verify_password) {
        return res.status(401).json({ status: false, message: "Wrong password." });
      }

      if (verify_password) {
        // Generate JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            buyerType: user.buyerType
          },
          process.env.JWT_SECRET,
          { expiresIn: "5h" }
        );

        console.log(token);

        return res.status(201).json({
          success: true,
          message: "user login successfully.",
          token: token,
          userData: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            buyerType: user.buyerType,
            image: user.image,
          }
        });
      }
    }

    // If user is not found or password doesn't match
    res.status(401).json({ error: "Invalid email or password." });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred during login." });
  }
};



// exports.userSignup = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log(fullUrl);

//   try {
//     // Validate request body
//     const user = await ValidateSchema.signupAdminSchema.validateAsync(req.body);

//     console.log('this is user',user);

//     // Check if the email already exists
//     const existingUser = await athDao.getUserByEmail(user.email);
//     if (existingUser) {
//       return res.json({ status: false, message: "Email already in use." });
//     }

//     // Hash the password
//     const hashedPassword = bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS));
//     console.log(hashedPassword);

//     // Insert new user into the database
//     const newUser = await athDao.signupUser(user, hashedPassword);

//     if (newUser.affectedRows === 0) {
//       return res.json({ status: false, message: "Failed to sign up." });
//     }

//     // Generate JWT token for the new user
//     // const token = jwt.sign(
//     //     { userId: newUser, },
//     //     process.env.JWT_SECRET,
//     //     { expiresIn: "5h" }
//     // );

//     res.status(201).json({
//       status: true,
//       message: "user registered successfully.",
//       data: { userId: newUser.insertId}
//     });
//   } catch (err) {
//     console.error("Error during signup:", err);
//     res.status(500).json({ error: "An error occurred during signup." });
//   }
// };

exports.userSignup = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Signup endpoint hit: ${fullUrl}`);

  try {

    const user = await ValidateSchema.signupAdminSchema.validateAsync(req.body);
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

    const signupResult = await athDao.signupUser(user, hashedPassword);

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