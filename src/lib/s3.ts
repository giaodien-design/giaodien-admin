import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Upload a file to S3
 * @param file - File buffer
 * @param key - S3 object key (path/filename)
 * @param contentType - MIME type
 * @returns S3 object URL
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  // Validate bucket name is configured
  if (!BUCKET_NAME || BUCKET_NAME.trim() === "") {
    throw new Error(
      "AWS_S3_BUCKET_NAME environment variable is not set. Please configure it in your .env file."
    );
  }

  // Validate AWS credentials are configured
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file."
    );
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL (adjust based on your bucket settings)
  return `https://${BUCKET_NAME}.s3.${
    process.env.AWS_REGION || "us-east-1"
  }.amazonaws.com/${key}`;
}

/**
 * Generate a unique file key with timestamp
 * @param filename - Original filename
 * @param folder - Optional folder prefix
 * @returns Unique S3 key
 */
export function generateS3Key(
  filename: string,
  folder: string = "apps"
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = filename.split(".").pop();
  const cleanName = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();

  return `${folder}/${timestamp}-${randomStr}-${cleanName}.${ext}`;
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}
