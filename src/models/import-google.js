// Import module side-effect từ dotenv/config để dùng trong module.
/**
 * Tệp src/models/import-google.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import 'dotenv/config'; // <--- Thêm dòng này lên đầu tiên để nạp biến môi trường từ file .env
// Import axios từ axios để dùng trong module.
import axios from 'axios';
// Import mongoose từ mongoose để dùng trong module.
import mongoose from 'mongoose';
// Import PDFDocument từ pdfkit để dùng trong module.
import PDFDocument from 'pdfkit';
// Import { S3Client, PutObjectCommand } từ @aws-sdk/client-s3 để dùng trong module.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// Import Book từ ./book.model.js để dùng trong module.
import Book from './book.model.js';
// Import User từ ./user.model.js để dùng trong module.
import User from './user.model.js';

// Cấu hình S3 Client kết nối Supabase Storage
// Khai báo s3Client nhận giá trị từ new S3Client({ region: process.env.SUPABASE_REGION || ". const giữ biến không gán lại; let cho phép cập nhật.
const s3Client = new S3Client({
  // Trường region lưu process.env.SUPABASE_REGION || "ap-south-1" làm giá trị trong object.
  region: process.env.SUPABASE_REGION || "ap-south-1",
  // Trường endpoint lưu process.env.SUPABASE_S3_ENDPOINT làm giá trị trong object.
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
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

// Hàm tự động tạo file PDF động cho từng cuốn sách và đẩy lên Supabase Cloud
/**
 * Hàm generateAndUploadPdf: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookTitle, bookAuthor, bookDesc.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Promise, PDFDocument, on, push, async, concat, now, round.
 */
async function generateAndUploadPdf(bookTitle, bookAuthor, bookDesc) {
  // return kết thúc hàm và trả new Promise((resolve, reject) => { const doc = new PDFDocument(); const buf về nơi gọi.
  return new Promise((resolve, reject) => {
    // Khai báo doc nhận giá trị từ new PDFDocument(). const giữ biến không gán lại; let cho phép cập nhật.
    const doc = new PDFDocument();
    // Khai báo buffers nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const buffers = [];

    // Gọi/thực thi doc.on với các đối số để thực hiện thao tác: doc.on('data', chunk => buffers.push(chunk))
    doc.on('data', chunk => buffers.push(chunk));
    // Gọi/thực thi doc.on với các đối số để thực hiện thao tác: doc.on('end', async () => { const pdfBuffer = Buffer.concat(buffers); const
    doc.on('end', async () => {
      // Khai báo pdfBuffer nhận giá trị từ Buffer.concat(buffers). const giữ biến không gán lại; let cho phép cập nhật.
      const pdfBuffer = Buffer.concat(buffers);
      // Khai báo uniqueName nhận giá trị từ `book-${Date.now()}-${Math.round(Math.random() * 1e9)}.. const giữ biến không gán lại; let cho phép cập nhật.
      const uniqueName = `book-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;

      // Khai báo uploadParams nhận giá trị từ { Bucket: bucketName, Key: uniqueName, Body: pdfBuffer,. const giữ biến không gán lại; let cho phép cập nhật.
      const uploadParams = {
        // Trường Bucket lưu bucketName làm giá trị trong object.
        Bucket: bucketName,
        // Trường Key lưu uniqueName làm giá trị trong object.
        Key: uniqueName,
        // Trường Body lưu pdfBuffer làm giá trị trong object.
        Body: pdfBuffer,
        // Trường ContentType lưu 'application/pdf' làm giá trị trong object.
        ContentType: 'application/pdf',
      };

      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
      try {
        // Khai báo command nhận giá trị từ new PutObjectCommand(uploadParams). const giữ biến không gán lại; let cho phép cập nhật.
        const command = new PutObjectCommand(uploadParams);
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await s3Client.send(command)
        await s3Client.send(command);
        // Khai báo publicUrl nhận giá trị từ `https:. const giữ biến không gán lại; let cho phép cập nhật.
        const publicUrl = `https://atkadhaxzwnszvriuvvu.storage.supabase.co/storage/v1/object/public/${bucketName}/${uniqueName}`;
        // Gọi/thực thi resolve với các đối số để thực hiện thao tác: resolve(publicUrl)
        resolve(publicUrl);
      } catch (err) {
        // Gọi/thực thi reject với các đối số để thực hiện thao tác: reject(err)
        reject(err);
      }
    });

    // Nội dung bên trong file PDF
    // Gọi/thực thi doc.fontSize với các đối số để thực hiện thao tác: doc.fontSize(22).text(bookTitle, { align: 'center' })
    doc.fontSize(22).text(bookTitle, { align: 'center' });
    // Gọi/thực thi doc.moveDown với các đối số để thực hiện thao tác: doc.moveDown()
    doc.moveDown();
    // Gọi/thực thi doc.fontSize với các đối số để thực hiện thao tác: doc.fontSize(14).fillColor('gray').text(`Tác giả: ${bookAuthor}`, { align:
    doc.fontSize(14).fillColor('gray').text(`Tác giả: ${bookAuthor}`, { align: 'center' });
    // Gọi/thực thi doc.moveDown với các đối số để thực hiện thao tác: doc.moveDown(2)
    doc.moveDown(2);
    // Gọi/thực thi doc.fontSize với các đối số để thực hiện thao tác: doc.fontSize(12).fillColor('black').text('Tóm tắt nội dung sách:', { underl
    doc.fontSize(12).fillColor('black').text('Tóm tắt nội dung sách:', { underline: true });
    // Gọi/thực thi doc.moveDown với các đối số để thực hiện thao tác: doc.moveDown()
    doc.moveDown();
    // Gọi/thực thi doc.text với các đối số để thực hiện thao tác: doc.text(bookDesc || 'Không có mô tả chi tiết.')
    doc.text(bookDesc || 'Không có mô tả chi tiết.');
    // Gọi/thực thi doc.moveDown với các đối số để thực hiện thao tác: doc.moveDown(3)
    doc.moveDown(3);
    // Gọi/thực thi doc.fontSize với các đối số để thực hiện thao tác: doc.fontSize(10).fillColor('blue').text('--- Tài liệu số hóa bởi HarveyBook
    doc.fontSize(10).fillColor('blue').text('--- Tài liệu số hóa bởi HarveyBook ---', { align: 'center' });
    // Gọi/thực thi doc.end với các đối số để thực hiện thao tác: doc.end()
    doc.end();
  });
}

// Kết nối MongoDB
// Gọi/thực thi mongoose.connect với các đối số để thực hiện thao tác: mongoose.connect('mongodb+srv:
mongoose.connect('mongodb+srv://1923051158_db_user:OilfClTLxxqZDd9V@cluster0.onvlsqy.mongodb.net/?appName=Cluster0')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));

/**
 * Hàm importRealBooksWithPdf: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOne, error, exit, log, get, join, generateAndUploadPdf, push.
 */
async function importRealBooksWithPdf() {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // Khai báo adminUser nhận giá trị từ await User.findOne(). const giữ biến không gán lại; let cho phép cập nhật.
    const adminUser = await User.findOne();
    // if chỉ chạy nhánh này khi điều kiện !adminUser đúng.
    if (!adminUser) {
      // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error("❌ Cần ít nhất 1 user trong database để làm owner!")
      console.error("❌ Cần ít nhất 1 user trong database để làm owner!");
      // Gọi/thực thi process.exit với các đối số để thực hiện thao tác: process.exit(1)
      process.exit(1);
    }

    // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log("Đang lấy dữ liệu sách từ Open Library...")
    console.log("Đang lấy dữ liệu sách từ Open Library...");
    // Khai báo response nhận giá trị từ await axios.get(`https:. const giữ biến không gán lại; let cho phép cập nhật.
    const response = await axios.get(`https://openlibrary.org/search.json?q=programming&limit=3`); 
    // Khai báo docs nhận giá trị từ response.data.docs. const giữ biến không gán lại; let cho phép cập nhật.
    const docs = response.data.docs;

    // Khai báo booksToInsert nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const booksToInsert = [];

    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const doc of docs) {
      // if chỉ chạy nhánh này khi điều kiện !doc.cover_i || !doc.title đúng.
      if (!doc.cover_i || !doc.title) continue;

      // Khai báo title nhận giá trị từ doc.title. const giữ biến không gán lại; let cho phép cập nhật.
      const title = doc.title;
      // Khai báo author nhận giá trị từ doc.author_name ? doc.author_name.join(', ') : 'Unknown. const giữ biến không gán lại; let cho phép cập nhật.
      const author = doc.author_name ? doc.author_name.join(', ') : 'Unknown Author';
      // Khai báo desc nhận giá trị từ `Sách chuyên ngành lập trình. Năm xuất bản: ${doc.first. const giữ biến không gán lại; let cho phép cập nhật.
      const desc = `Sách chuyên ngành lập trình. Năm xuất bản: ${doc.first_publish_year || 'N/A'}.`;
      // Khai báo coverImage nhận giá trị từ `https:. const giữ biến không gán lại; let cho phép cập nhật.
      const coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;

      // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log(`⏳ Đang tạo và upload file PDF thực tế cho cuốn: "${title}"...`
      console.log(`⏳ Đang tạo và upload file PDF thực tế cho cuốn: "${title}"...`);
      // Khai báo realPdfUrl nhận giá trị từ await generateAndUploadPdf(title, author, desc). const giữ biến không gán lại; let cho phép cập nhật.
      const realPdfUrl = await generateAndUploadPdf(title, author, desc);

      // Gọi/thực thi booksToInsert.push với các đối số để thực hiện thao tác: booksToInsert.push({ title, author_name: author, category: 'Technology', ow
      booksToInsert.push({
        // Khóa title nhận biến cùng tên làm giá trị.
        title,
        // Trường author_name lưu author làm giá trị trong object.
        author_name: author,
        // Trường category lưu 'Technology' làm giá trị trong object.
        category: 'Technology',
        // Trường owner lưu adminUser._id làm giá trị trong object.
        owner: adminUser._id,
        // Trường description lưu desc làm giá trị trong object.
        description: desc,
        // Khóa coverImage nhận biến cùng tên làm giá trị.
        coverImage,
        // Trường fileUrl lưu realPdfUrl làm giá trị trong object.
        fileUrl: realPdfUrl 
      });
    }

    // if chỉ chạy nhánh này khi điều kiện booksToInsert.length > 0 đúng.
    if (booksToInsert.length > 0) {
      // await chờ tác vụ bất đồng bộ xong trước bước sau: await Book.insertMany(booksToInsert)
      await Book.insertMany(booksToInsert);
      // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log(`✨ Thành công! Đã import ${booksToInsert.length} cuốn sách kèm
      console.log(`✨ Thành công! Đã import ${booksToInsert.length} cuốn sách kèm file PDF riêng biệt lên cloud và vào Database!`);
    }
    // Gọi/thực thi process.exit với các đối số để thực hiện thao tác: process.exit()
    process.exit();

  } catch (error) {
    // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error("❌ Lỗi thực thi:", error)
    console.error("❌ Lỗi thực thi:", error);
    // Gọi/thực thi process.exit với các đối số để thực hiện thao tác: process.exit(1)
    process.exit(1);
  }
}

// Gọi/thực thi importRealBooksWithPdf với các đối số để thực hiện thao tác: importRealBooksWithPdf()
importRealBooksWithPdf();
