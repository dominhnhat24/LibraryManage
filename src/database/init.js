const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema({
    status: { type: String, required: true, default: 'Available' }, // Available, Borrowed, Damaged
    // _id của bản sao sẽ được MongoDB tự động sinh ra (thay thế cho coppy_id)
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

module.exports = mongoose.model('Book', bookSchema);
module.exports = mongoose.model('Librarian', librarianSchema);
module.exports = mongoose.model('Reader', readerSchema);
module.exports = mongoose.model('BorrowCard', borrowCardSchema);
module.exports = mongoose.model('Fine', fineSchema);