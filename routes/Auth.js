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
    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function(req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});
const uploadfile = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
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




module.exports = router;