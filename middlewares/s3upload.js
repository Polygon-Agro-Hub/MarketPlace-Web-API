const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, // Alternative endpoint format
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/**
 * Uploads a file to Cloudflare R2 and returns the file URL.
 * @param {Buffer} fileBuffer - The file buffer to upload.
 * @param {string} fileName - The original file name.
 * @param {string} keyPrefix - The prefix path (folder structure) in the R2 bucket.
 * @returns {Promise<string>} - Resolves with the file URL after successful upload.
 */
const uploadFileToS3 = async (fileBuffer, fileName, keyPrefix) => {
  try {
    const fileExtension = fileName.split(".").pop(); // Get file extension
    const uniqueFileName = `${uuidv4()}.${fileExtension}`; // Generate a unique file name
    const key = `${keyPrefix}/${uniqueFileName}`;
    
    // Determine content type based on file extension
    const getContentType = (ext) => {
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'json': 'application/json',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg'
      };
      return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    };
    
    const putObjectParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key, // Full path in the bucket
      Body: fileBuffer,
      ContentType: getContentType(fileExtension),
      // Note: R2 doesn't use ACL like S3, files are public based on bucket configuration
    };

    // Create and send the PutObjectCommand
    const command = new PutObjectCommand(putObjectParams);
    await r2Client.send(command);
    
    // Construct the URL using the R2 custom domain/endpoint
    // Remove the protocol from endpoint to get just the domain
    const domain = process.env.R2_ENDPOINT.replace('https://', '');
    const fileUrl = `https://${domain}/${key}`;
    
    return fileUrl;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
};

module.exports = uploadFileToS3;