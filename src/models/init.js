import mongoose from 'mongoose';
import 'dotenv/config';

const bookCopySchema = new mongoose.Schema({
    status: { type: String, required: true, default: 'Available' } // Available, Borrowed, Damaged
});

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    publish_year: { type: Number },
    category: { type: String },
    copies: [bookCopySchema] // Mảng chứa các bản sao vật lý của sách
}, { timestamps: true });

const librarianSchema = new mongoose.Schema({
    user_name: { type: String, required: true, unique: true },
    hash_pass: { type: String, required: true },
    full_name: { type: String, required: true },
    roll: { type: String, required: true } // admin, staff
}, { timestamps: true });

const readerSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String },
    address: { type: String },
    status: { type: String, required: true, default: 'Active' } // Active, Blocked
}, { timestamps: true });

const borrowDetailSchema = new mongoose.Schema({
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    copies_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID của bản sao trong mảng copies của Book
    returned_day: { type: Date },
    status_returned_date: { type: String } // Good, Lost, Damaged
});

const borrowCardSchema = new mongoose.Schema({
    reader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reader', required: true },
    librarian_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Librarian', required: true },
    borrow_day: { type: Date, required: true, default: Date.now },
    due_date: { type: Date, required: true },
    Status: { type: String, required: true, default: 'Borrowing' }, // Borrowing, Returned, Overdue
    details: [borrowDetailSchema] // Nhúng chi tiết các sách mượn vào chung phiếu mượn
}, { timestamps: true });

const fineSchema = new mongoose.Schema({
    borrow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowCard', required: true },
    reader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reader', required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    payment_status: { type: String, required: true, default: 'Pending' } // Pending, Paid
}, { timestamps: true });

export const Books = mongoose.model('Book', bookSchema);
export const Librarians = mongoose.model('Librarian', librarianSchema); 
export const Readers = mongoose.model('Reader', readerSchema);
export const BorrowCards = mongoose.model('BorrowCard', borrowCardSchema);
export const Fines = mongoose.model('Fine', fineSchema);

export const connectDB = async () => {
    try {
        console.log("URI đang kết nối:", process.env.MONGODB_URI); // Thêm dòng này để kiểm tra
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};