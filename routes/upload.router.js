const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const uploadFileToS3 = require("../middlewares/s3upload");
const deleteFileFromS3 = require("../middlewares/s3delete");

const router = express.Router();

router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);

    const url = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      'complaints'
    );

    console.log('Upload success:', url);
    return res.status(200).json({ url });

  } catch (error) {
    console.log('Single upload error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/rollback', authMiddleware, async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: 'No image URLs provided' });
    }

    await Promise.all(imageUrls.map((url) => deleteFileFromS3(url)));

    console.log('Rollback complete — deleted', imageUrls.length, 'images');
    return res.status(200).json({ message: 'Images deleted successfully' });

  } catch (error) {
    console.log('Rollback error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;