import mongoose from 'mongoose';
import 'dotenv/config';


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
bookCopySchema.index({ bookId: 1, status: 1 });


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

const librarianSchema = new mongoose.Schema({
    user_name: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    hash_pass: { type: String, required: true },
    full_name: { type: String, required: true },
    roll: { type: String, enum: ['librarian'], default: 'librarian', required: true },
    status: { type: String, enum: ['Active', 'Blocked'], default: 'Active', required: true }
}, { timestamps: true });

const readerSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, select: false },
    phone: { type: String },
    address: { type: String },
    status: { type: String, enum: ['Active', 'Blocked'], required: true, default: 'Active' }
}, { timestamps: true });

const borrowDetailSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    copyId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookCopy', required: true },
    returnedAt: { type: Date },
    condition: { type: String, enum: ['Good', 'Damaged', 'Lost'] }
});

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
borrowCardSchema.index({ readerId: 1, status: 1, createdAt: -1 });
borrowCardSchema.index({ 'details.copyId': 1, status: 1 });

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
fineSchema.index({ readerId: 1, status: 1 });
fineSchema.index({ borrowCardId: 1, detailId: 1 }, { unique: true });

export const Books = mongoose.model('Book', bookSchema);
export const BookCopy = mongoose.model('BookCopy', bookCopySchema);
export const Librarians = mongoose.model('Librarian', librarianSchema); 
export const Readers = mongoose.model('Reader', readerSchema);
export const BorrowCards = mongoose.model('BorrowCard', borrowCardSchema);
export const Fines = mongoose.model('Fine', fineSchema);
