import 'dotenv/config';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';

const s3Client = new S3Client({
  region: process.env.SUPABASE_REGION || "ap-south-1",
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const bucketName = process.env.SUPABASE_BUCKET_NAME || 'books-storage';

async function testUpload() {
  try {
    console.log("Đang kiểm tra kết nối S3 tới Supabase...");
    
    // Tạo một file text giả lập hoặc dùng buffer bất kỳ
    const fileBuffer = Buffer.from("Noi dung file PDF test thu nghiem cho do an OpenBook.");
    const fileName = `test-direct-${Date.now()}.pdf`;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const publicUrl = `https://atkadhaxzwnszvriuvvu.storage.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
    console.log("✅ UPLOAD THÀNH CÔNG RỒI!");
    console.log("Link file trên Supabase:", publicUrl);

  } catch (error) {
    console.error("❌ LỖI KẾT NỐI HOẶC UPLOAD S3:", error);
  }
}

testUpload();