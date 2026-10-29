// [KHÓA IMPORT] Dùng _id duy nhất làm khóa nguồn để ngăn hai import đồng thời cùng một tác phẩm.
import mongoose from 'mongoose';

const bookImportJobSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    source: { type: String, required: true },
    source_id: { type: String, required: true },
    status: { type: String, enum: ['importing', 'imported', 'duplicate', 'failed'], required: true },
    lock_token: { type: String, default: null, select: false },
    lease_expires_at: { type: Date, default: null },
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    last_error: { type: String, default: null },
    attempts: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false, collection: 'book_import_jobs' });

export default mongoose.models.BookImportJob
    || mongoose.model('BookImportJob', bookImportJobSchema);
