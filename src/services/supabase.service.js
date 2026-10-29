import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cấu hình S3 Client kết nối trực tiếp tới Supabase Storage
const s3Client = new S3Client({
  region: process.env.SUPABASE_REGION || "ap-south-1", // Vùng region của project bạn
  endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://atkadhaxzwnszvriuvvu.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const bucketName = process.env.SUPABASE_BUCKET_NAME || 'books-storage';

export async function uploadFileToSupabase(file) {
  if (!file) return null;

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const cleanOriginalName = file.originalname.replace(/\s+/g, '_');
  const fileName = `${uniqueSuffix}-${cleanOriginalName}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read", // Đảm bảo file public để mọi người có thể xem/đọc
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Trả về Public URL chuẩn của Supabase Storage
    const publicUrl = `https://atkadhaxzwnszvriuvvu.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
    console.log("Upload lên Supabase qua S3 thành công:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Lỗi S3 Upload:", error);
    throw new Error(`Không thể tải file lên Cloud (S3): ${error.message}`);
  }
}