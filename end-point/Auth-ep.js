const jwt = require("jsonwebtoken");
const athDao = require("../dao/Auth-dao");
const ValidateSchema = require("../validations/Auth-validation");
const bcrypt = require("bcryptjs");

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
