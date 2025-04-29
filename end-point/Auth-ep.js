const jwt = require("jsonwebtoken");
const athDao = require("../dao/Auth-dao");
const ValidateSchema = require("../validations/Auth-validation");
const bcrypt = require("bcryptjs");

exports.userLogin = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    await ValidateSchema.loginAdminSchema.validateAsync(req.body);

    const { email, password } = req.body;

    const [user] = await athDao.userLogin(email);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    if (user) {
      const verify_password = bcrypt.compareSync(password, user.password);

      if (!verify_password) {
        return res.status(401).json({ error: "Wrong password." });
      }

      if (verify_password) {
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id},
          process.env.JWT_SECRET,
          { expiresIn: "5h" }
        );

        

        return res.status(201).json({
          success: true,
          message: "user login successfully.",
          token: token,
          userId: user.id
          // data: { token, userId: user.id}
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
      await ValidateSchema.signupAdminSchema.validateAsync(req.body);

      const { title, firstName, lastName, phoneNumber, email, NICnumber, password} = req.body;

      // Check if the email already exists
      const [existingUser] = await athDao.getUserByEmail(email);
      if (existingUser) {
          return res.status(409).json({ error: "Email already in use." });
      }

      // Hash the password
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Insert new user into the database
      const newUser = await athDao.signupUser({ title, firstName, lastName, phoneNumber, email, NICnumber, hashedPassword });

      // Generate JWT token for the new user
      const token = jwt.sign(
          { userId: newUser.insertId },
          process.env.JWT_SECRET,
          { expiresIn: "5h" }
      );

      res.status(201).json({
          success: true,
          message: "user registered successfully.",
          data: { token, userId: newUser.insertId}
      });
  } catch (err) {
      console.error("Error during signup:", err);
      res.status(500).json({ error: "An error occurred during signup." });
  }
};
