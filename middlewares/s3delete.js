const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Deletes a file from S3 using the file URL.
 * @param {string} imageUrl - The URL of the file to delete.
 * @returns {Promise<void>}
 */

const deleteFromS3 = async (imageUrl) => {
  let s3Key;
  if (imageUrl && imageUrl.startsWith(`https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)) {
    s3Key = imageUrl.split(`https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
  }

  if (!s3Key) {
    console.log("No S3 key provided, skipping deletion.");
    return;
  }

  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  };

  try {
    // Create and send the DeleteObjectCommand
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log(`Deleted object from S3: ${s3Key}`);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
};

module.exports = deleteFromS3;



