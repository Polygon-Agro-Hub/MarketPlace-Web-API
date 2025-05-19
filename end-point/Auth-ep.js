const jwt = require("jsonwebtoken");
const athDao = require("../dao/Auth-dao");
// const userDao = require("../dao/Auth-dao");
const ValidateSchema = require("../validations/Auth-validation");
const bcrypt = require("bcryptjs");
// const bcrypt = require('bcrypt');
const  uploadFileToS3  = require('../middlewares/s3upload');


exports.userLogin = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validateShcema = await ValidateSchema.loginAdminSchema.validateAsync(req.body);

    const { email, password } = req.body;

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



exports.userSignup = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate request body
    const user = await ValidateSchema.signupAdminSchema.validateAsync(req.body);

    console.log(user);

    // Check if the email already exists
    const existingUser = await athDao.getUserByEmail(user.email);
    if (existingUser) {
      return res.json({ status: false, message: "Email already in use." });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS));
    console.log(hashedPassword);

    // Insert new user into the database
    const newUser = await athDao.signupUser(user, hashedPassword);

    if (newUser.affectedRows === 0) {
      return res.json({ status: false, message: "Failed to sign up." });
    }

    // Generate JWT token for the new user
    // const token = jwt.sign(
    //     { userId: newUser, },
    //     process.env.JWT_SECRET,
    //     { expiresIn: "5h" }
    // );

    res.status(201).json({
      status: true,
      message: "user registered successfully.",
      // data: { token, userId: newUser.insertId}
    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "An error occurred during signup." });
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
  // const { title, firstName, lastName, email, phoneCode, phoneNumber } = req.body;
    const { title, firstName, lastName, email, phoneCode, phoneNumber } = await ValidateSchema.editUserProfileSchema.validateAsync(req.body);


  try {
    // Fetch existing user to get current image (if any)
    const existingUser = await athDao.getUserById(userId); // Implement this if not available
    if (!existingUser) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    // Handle profile image upload
    let profilePictureUrl = existingUser.profilePicture;
    if (req.file) {
      if (profilePictureUrl) {
        await deleteFromS3(profilePictureUrl); // Optional: delete previous image
      }
  

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
     profilePictureUrl = await uploadFileToS3(fileBuffer, fileName, "marketplaceusers/profile-images");
    }

    // Update user
    const result = await athDao.editUserProfileDao(userId, {
      title,
      firstName,
      lastName,
      email,
      phoneCode,
      phoneNumber,
      profilePicture: profilePictureUrl,
    });

    if (result.affectedRows === 0) {
      return res.status(400).json({ status: false, message: "Update failed or no changes made." });
    }

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully.",
      profilePicture: profilePictureUrl,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ status: false, error: "An error occurred while updating profile." });
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

exports.saveOrUpdateBillingDetails = async (req, res) => {
  const userId = req.user.userId;
  const validatedDetails = await billingDetailsSchema.validateAsync(req.body);

  try {
    const result = await athDao.saveOrUpdateBillingDetails(userId, details);
    res.status(200).json({ status: true, message: "Billing details saved successfully." });
  } catch (err) {
    console.error("Save Billing Details Error:", err);
    res.status(500).json({ status: false, message: "Failed to save billing details." });
  }
};
