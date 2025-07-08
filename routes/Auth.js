const express = require("express");
const db = require("../startup/database");
const AuthEp = require("../end-point/Auth-ep");

const bodyParser = require("body-parser");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const upload = require("../middlewares/uploadMiddleware");
const path = require("path");
const fs = require('fs');
const xlsx = require('xlsx');
const router = express.Router();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});
const uploadfile = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== ".xlsx" && ext !== ".xls") {
            return callback(new Error("Only Excel files are allowed"));
        }
        callback(null, true);
    },
});

router.post("/login", AuthEp.userLogin);
router.post("/signup", AuthEp.userSignup);

// New Google auth route - handles both signup and login
router.post('/google', AuthEp.googleAuth);


// Password reset routes
router.post("/forgot-password", AuthEp.forgotPassword); // Send reset email
router.get("/validate-reset-token/:token", AuthEp.validateResetToken); // Validate token
router.put("/reset-password", AuthEp.resetPassword); // Actually reset password
router.post("/check-phone", AuthEp.checkPhoneNumber);
router.post("/reset-password-by-phone", AuthEp.resetPasswordByPhone);


router.get("/profile", authMiddleware, AuthEp.getprofile);

router.put('/update-password',authMiddleware, AuthEp.updatePassword);
router.put("/edit-profile", authMiddleware, upload.single("profilePicture"), AuthEp.editUserProfile);
router.get('/billing-details', authMiddleware, AuthEp.getBillingDetails);
router.post('/billing-details', authMiddleware, AuthEp.saveOrUpdateBillingDetails);
router.get('/get-cities', authMiddleware, AuthEp.getAllCities);

router.post('/unsubscribe', authMiddleware, AuthEp.unsubscribeUser);
router.post('/submit/:userId', authMiddleware, upload.array('images'), AuthEp.submitComplaint);
// Router
router.get('/complaints/user/:userId', authMiddleware, AuthEp.getComplaintsByUserId);
router.get('/categories', AuthEp.getCategoryEnglishByAppId);


router.get(
    '/cart-info',
    authMiddleware,
    AuthEp.getCartInfo
)

module.exports = router; 

 