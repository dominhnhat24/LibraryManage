// [MODEL SÁCH] Lưu siêu dữ liệu, chương và khóa tệp riêng tư cho ebook/audio/comic/webnovel.
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    author_name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: ['ebook', 'Science', 'Programming', 'Database', 'audiobook', 'comic', 'webnovel', 'software_engineering', 'computer_science', 'backend', 'frontend', 'database', 'programming', 'mobile', 'other', 'Technology'], required: true },
    genre: { type: String, enum: ['van_hoc_viet_nam', 'truyen_ngan_viet_nam', 'tho_viet_nam', 'van_hoc_dan_gian', 'van_hoc_the_gioi', 'kinh_doanh', 'phat_trien_ban_than', 'tam_ly_hoc', 'lich_su', 'khoa_hoc'], default: 'van_hoc_viet_nam', index: true },
    publication_year: { type: Number, min: 1, max: 3000, default: null },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    cover_url: { type: String, trim: true, default: '' },
    cover_file_key: { type: String, trim: true, default: null, select: false },
    import_source: { type: String, trim: true, default: null },
    source_id: { type: String, trim: true, default: null },
    source_url: { type: String, trim: true, default: null },
    license_name: { type: String, trim: true, default: null },
    license_url: { type: String, trim: true, default: null },
    cover_source_url: { type: String, trim: true, default: null },
    cover_license_name: { type: String, trim: true, default: null },
    cover_license_url: { type: String, trim: true, default: null },
    cover_attribution: { type: String, trim: true, default: null },
    language: { type: String, trim: true, default: null },
    file_format: { type: String, trim: true, default: null },
    file_size: { type: Number, min: 0, default: null },
    verified_at: { type: Date, default: null },
    access_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free', required: true },
    file_key: { type: String, trim: true, default: null, select: false },
    file_original_name: { type: String, trim: true, default: null, select: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published', required: true }
}, { timestamps: true });

// [CHỈ MỤC TÌM KIẾM] Tối ưu lọc danh mục/quyền truy cập và tìm theo tên sách/tác giả.
bookSchema.index({ status: 1, access_level: 1, category: 1, createdAt: -1 });
// The `language` metadata field stores values such as `vi`, which MongoDB text indexes do not support as language overrides.
bookSchema.index({ title: 'text', author_name: 'text', description: 'text' }, {
    default_language: 'none',
    language_override: 'search_language'
});

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
