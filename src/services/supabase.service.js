// Import { S3Client, PutObjectCommand } từ @aws-sdk/client-s3 để dùng trong module.
/**
 * Tệp src/services/supabase.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cấu hình S3 Client kết nối trực tiếp tới Supabase Storage
// Khai báo s3Client nhận giá trị từ new S3Client({ region: process.env.SUPABASE_REGION || ". const giữ biến không gán lại; let cho phép cập nhật.
const s3Client = new S3Client({
  // Trường region lưu process.env.SUPABASE_REGION || "ap-south-1" làm giá trị trong object.
  region: process.env.SUPABASE_REGION || "ap-south-1", // Vùng region của project bạn
  // Trường endpoint lưu process.env.SUPABASE_S3_ENDPOINT || "https: làm giá trị trong object.
  endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://atkadhaxzwnszvriuvvu.supabase.co/storage/v1/s3",
  // Trường credentials lưu { accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID, secr làm giá trị trong object.
  credentials: {
    // Trường accessKeyId lưu process.env.SUPABASE_ACCESS_KEY_ID làm giá trị trong object.
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID,
    // Trường secretAccessKey lưu process.env.SUPABASE_SECRET_ACCESS_KEY làm giá trị trong object.
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY,
  },
  // Trường forcePathStyle lưu true làm giá trị trong object.
  forcePathStyle: true,
});

// Khai báo bucketName nhận giá trị từ process.env.SUPABASE_BUCKET_NAME || 'books-storage'. const giữ biến không gán lại; let cho phép cập nhật.
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'books-storage';

/**
 * Hàm uploadFileToSupabase: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: file.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: now, round, random, replace, PutObjectCommand, send, log, error.
 */
export async function uploadFileToSupabase(file) {
  // if chỉ chạy nhánh này khi điều kiện !file đúng.
  if (!file) return null;

  // Khai báo uniqueSuffix nhận giá trị từ Date.now() + '-' + Math.round(Math.random() * 1e9). const giữ biến không gán lại; let cho phép cập nhật.
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  // Khai báo cleanOriginalName nhận giá trị từ file.originalname.replace(/\s+/g, '_'). const giữ biến không gán lại; let cho phép cập nhật.
  const cleanOriginalName = file.originalname.replace(/\s+/g, '_');
  // Khai báo fileName nhận giá trị từ `${uniqueSuffix}-${cleanOriginalName}`. const giữ biến không gán lại; let cho phép cập nhật.
  const fileName = `${uniqueSuffix}-${cleanOriginalName}`;

  // Khai báo uploadParams nhận giá trị từ { Bucket: bucketName, Key: fileName, Body: file.buffer,. const giữ biến không gán lại; let cho phép cập nhật.
  const uploadParams = {
    // Trường Bucket lưu bucketName làm giá trị trong object.
    Bucket: bucketName,
    // Trường Key lưu fileName làm giá trị trong object.
    Key: fileName,
    // Trường Body lưu file.buffer làm giá trị trong object.
    Body: file.buffer,
    // Trường ContentType lưu file.mimetype làm giá trị trong object.
    ContentType: file.mimetype,
    // Trường ACL lưu "public-read" làm giá trị trong object.
    ACL: "public-read", // Đảm bảo file public để mọi người có thể xem/đọc
  };

  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // Khai báo command nhận giá trị từ new PutObjectCommand(uploadParams). const giữ biến không gán lại; let cho phép cập nhật.
    const command = new PutObjectCommand(uploadParams);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await s3Client.send(command)
    await s3Client.send(command);

    // Trả về Public URL chuẩn của Supabase Storage
    // Khai báo publicUrl nhận giá trị từ `https:. const giữ biến không gán lại; let cho phép cập nhật.
    const publicUrl = `https://atkadhaxzwnszvriuvvu.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
    // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log("Upload lên Supabase qua S3 thành công:", publicUrl)
    console.log("Upload lên Supabase qua S3 thành công:", publicUrl);
    // return kết thúc hàm và trả publicUrl về nơi gọi.
    return publicUrl;
  } catch (error) {
    // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error("Lỗi S3 Upload:", error)
    console.error("Lỗi S3 Upload:", error);
    // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
    throw new Error(`Không thể tải file lên Cloud (S3): ${error.message}`);
  }
}