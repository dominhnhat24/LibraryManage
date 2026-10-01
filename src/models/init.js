// Khởi tạo kết nối MongoDB và định nghĩa các model dùng chung cho nghiệp vụ thư viện.
import mongoose from 'mongoose';
import 'dotenv/config';


// Không nhận tham số; kết nối theo MONGODB_URI, ghi trạng thái và thoát tiến trình nếu kết nối thất bại.
export const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not configured');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};


// Lược đồ cho từng bản sao vật lý; liên kết đầu sách, trạng thái lưu thông và chỉ mục tra cứu.
const bookCopySchema = new mongoose.Schema({
    bookId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Book', // Trỏ tới bảng Books
        required: true 
    },
    status: {
        type: String,
        enum: ['Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'],
        required: true,
        default: 'Available'
    }
}, { timestamps: true });
// Hỗ trợ lọc bản sao theo đầu sách và trạng thái.
bookCopySchema.index({ bookId: 1, status: 1 });


// Lược đồ thông tin đầu sách; virtual copies cho phép populate danh sách bản sao liên quan.
const bookSchema = new mongoose.Schema({
    isbn: { type: String, trim: true, unique: true, sparse: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    publish_year: { type: Number },
    category: { type: String },
    description: { type: String, trim: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
bookSchema.virtual('copies', {
    ref: 'BookCopy',
    localField: '_id',
    foreignField: 'bookId'
});

// Hồ sơ thủ thư lưu tên đăng nhập, email, mật khẩu băm, vai trò và trạng thái tài khoản.
const librarianSchema = new mongoose.Schema({
    user_name: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    hash_pass: { type: String, required: true },
    full_name: { type: String, required: true },
    roll: { type: String, enum: ['librarian'], default: 'librarian', required: true },
    status: { type: String, enum: ['Active', 'Blocked'], default: 'Active', required: true }
}, { timestamps: true });

// Hồ sơ độc giả; mật khẩu băm mặc định không được trả trong truy vấn.
const readerSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, select: false },
    phone: { type: String },
    address: { type: String },
    status: { type: String, enum: ['Active', 'Blocked'], required: true, default: 'Active' }
}, { timestamps: true });

// Một dòng chi tiết của phiếu mượn, tham chiếu đầu sách/bản sao và tình trạng khi trả.
const borrowDetailSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    copyId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookCopy', required: true },
    returnedAt: { type: Date },
    condition: { type: String, enum: ['Good', 'Damaged', 'Lost'] }
});

// Phiếu mượn gắn độc giả, thủ thư xử lý, hạn trả, trạng thái và danh sách chi tiết.
const borrowCardSchema = new mongoose.Schema({
    readerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reader', required: true },
    librarianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Librarian' },
    borrowedAt: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Borrowing', 'PartiallyReturned', 'Returned', 'Overdue', 'Cancelled'],
        required: true,
        default: 'Pending'
    },
    details: { type: [borrowDetailSchema], required: true, validate: v => v.length > 0 }
}, { timestamps: true });
// Tăng tốc truy vấn phiếu theo độc giả/trạng thái và theo bản sao/trạng thái.
borrowCardSchema.index({ readerId: 1, status: 1, createdAt: -1 });
borrowCardSchema.index({ 'details.copyId': 1, status: 1 });

// Khoản phạt liên kết phiếu, dòng sách và độc giả; mỗi dòng phiếu chỉ có tối đa một khoản phạt.
const fineSchema = new mongoose.Schema({
    borrowCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowCard', required: true },
    detailId: { type: mongoose.Schema.Types.ObjectId, required: true },
    readerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reader', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, enum: ['Overdue', 'Damaged', 'Lost'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Waived'], required: true, default: 'Pending' },
    paidAt: { type: Date },
    waivedAt: { type: Date },
    waiverReason: { type: String }
}, { timestamps: true });
// Các chỉ mục phục vụ tra cứu khoản phạt và ngăn tạo khoản trùng trên cùng dòng chi tiết.
fineSchema.index({ readerId: 1, status: 1 });
fineSchema.index({ borrowCardId: 1, detailId: 1 }, { unique: true });

// Đăng ký model với Mongoose và xuất để service, validator cùng dùng chung.
export const Books = mongoose.model('Book', bookSchema);
export const BookCopy = mongoose.model('BookCopy', bookCopySchema);
export const Librarians = mongoose.model('Librarian', librarianSchema); 
export const Readers = mongoose.model('Reader', readerSchema);
export const BorrowCards = mongoose.model('BorrowCard', borrowCardSchema);
export const Fines = mongoose.model('Fine', fineSchema);
