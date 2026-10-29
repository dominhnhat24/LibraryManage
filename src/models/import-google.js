import 'dotenv/config'; // <--- Thêm dòng này lên đầu tiên để nạp biến môi trường từ file .env
import axios from 'axios';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Book from './book.model.js';
import User from './user.model.js';

// Cấu hình S3 Client kết nối Supabase Storage
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

// Hàm tự động tạo file PDF động cho từng cuốn sách và đẩy lên Supabase Cloud
async function generateAndUploadPdf(bookTitle, bookAuthor, bookDesc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const uniqueName = `book-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;

      const uploadParams = {
        Bucket: bucketName,
        Key: uniqueName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      };

      try {
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const publicUrl = `https://atkadhaxzwnszvriuvvu.storage.supabase.co/storage/v1/object/public/${bucketName}/${uniqueName}`;
        resolve(publicUrl);
      } catch (err) {
        reject(err);
      }
    });

    // Nội dung bên trong file PDF
    doc.fontSize(22).text(bookTitle, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('gray').text(`Tác giả: ${bookAuthor}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).fillColor('black').text('Tóm tắt nội dung sách:', { underline: true });
    doc.moveDown();
    doc.text(bookDesc || 'Không có mô tả chi tiết.');
    doc.moveDown(3);
    doc.fontSize(10).fillColor('blue').text('--- Tài liệu số hóa bởi HarveyBook ---', { align: 'center' });
    doc.end();
  });
}

// Kết nối MongoDB
mongoose.connect('mongodb+srv://1923051158_db_user:OilfClTLxxqZDd9V@cluster0.onvlsqy.mongodb.net/?appName=Cluster0')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));

async function importRealBooksWithPdf() {
  try {
    const adminUser = await User.findOne();
    if (!adminUser) {
      console.error("❌ Cần ít nhất 1 user trong database để làm owner!");
      process.exit(1);
    }

    console.log("Đang lấy dữ liệu sách từ Open Library...");
    const response = await axios.get(`https://openlibrary.org/search.json?q=programming&limit=3`); 
    const docs = response.data.docs;

    const booksToInsert = [];

    for (const doc of docs) {
      if (!doc.cover_i || !doc.title) continue;

      const title = doc.title;
      const author = doc.author_name ? doc.author_name.join(', ') : 'Unknown Author';
      const desc = `Sách chuyên ngành lập trình. Năm xuất bản: ${doc.first_publish_year || 'N/A'}.`;
      const coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;

      console.log(`⏳ Đang tạo và upload file PDF thực tế cho cuốn: "${title}"...`);
      const realPdfUrl = await generateAndUploadPdf(title, author, desc);

      booksToInsert.push({
        title,
        author_name: author,
        category: 'Technology',
        owner: adminUser._id,
        description: desc,
        coverImage,
        fileUrl: realPdfUrl 
      });
    }

    if (booksToInsert.length > 0) {
      await Book.insertMany(booksToInsert);
      console.log(`✨ Thành công! Đã import ${booksToInsert.length} cuốn sách kèm file PDF riêng biệt lên cloud và vào Database!`);
    }
    process.exit();

  } catch (error) {
    console.error("❌ Lỗi thực thi:", error);
    process.exit(1);
  }
}

importRealBooksWithPdf();
