// [MODEL SÁCH] Lưu siêu dữ liệu, chương và khóa tệp riêng tư cho ebook/audio/comic/webnovel.
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    author_name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: ['ebook', 'Science', 'Programming', 'Database', 'audiobook', 'comic', 'webnovel', 'software_engineering', 'computer_science', 'backend', 'frontend', 'database', 'programming', 'mobile', 'other', 'Technology'], required: true },
    publication_year: { type: Number, min: 1, max: 3000, default: null },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    cover_url: { type: String, trim: true, default: '' },
    access_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free', required: true },
    file_key: { type: String, trim: true, default: null, select: false },
    file_original_name: { type: String, trim: true, default: null, select: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published', required: true }
}, { timestamps: true });

// [CHỈ MỤC TÌM KIẾM] Tối ưu lọc danh mục/quyền truy cập và tìm theo tên sách/tác giả.
bookSchema.index({ status: 1, access_level: 1, category: 1, createdAt: -1 });
bookSchema.index({ title: 'text', author_name: 'text', description: 'text' });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
