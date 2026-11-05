const multer = require("multer");
const path = require("path");

const ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".pdf"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error("Only JPG, PNG or PDF files are allowed"));
};

const brUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Wrapper so multer errors return clean JSON instead of crashing the request
module.exports = (req, res, next) => {
  brUpload.single("brImage")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File size must be 5MB or less"
          : err.message;
      return res.status(400).json({ status: false, message });
    }
    next();
  });
};