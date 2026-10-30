// [MODEL SÁCH] Lưu siêu dữ liệu, chương và khóa tệp riêng tư cho ebook/audio/comic/webnovel.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/book.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo bookSchema nhận giá trị từ new mongoose.Schema({ title: { type: String, required: . const giữ biến không gán lại; let cho phép cập nhật.
const bookSchema = new mongoose.Schema({
    // Trường title lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // Trường slug lưu { type: String, trim: true, lowercase: true, unique: tr làm giá trị trong object.
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    // Trường author_name lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    author_name: { type: String, required: true, trim: true, maxlength: 120 },
    // Trường category lưu { type: String, enum: ['ebook', 'Science', 'Programming làm giá trị trong object.
    category: { type: String, enum: ['ebook', 'Science', 'Programming', 'Database', 'audiobook', 'comic', 'webnovel', 'software_engineering', 'computer_science', 'backend', 'frontend', 'database', 'programming', 'mobile', 'other', 'Technology'], required: true },
    // Trường genre lưu { type: String, enum: ['van_hoc_viet_nam', 'truyen_ngan làm giá trị trong object.
    genre: { type: String, enum: ['van_hoc_viet_nam', 'truyen_ngan_viet_nam', 'tho_viet_nam', 'van_hoc_dan_gian', 'van_hoc_the_gioi', 'kinh_doanh', 'phat_trien_ban_than', 'tam_ly_hoc', 'lich_su', 'khoa_hoc'], default: 'van_hoc_viet_nam', index: true },
    // Trường publication_year lưu { type: Number, min: 1, max: 3000, default: null } làm giá trị trong object.
    publication_year: { type: Number, min: 1, max: 3000, default: null },
    // Trường description lưu { type: String, trim: true, maxlength: 5000, default: ' làm giá trị trong object.
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    // Trường cover_url lưu { type: String, trim: true, default: '' } làm giá trị trong object.
    cover_url: { type: String, trim: true, default: '' },
    // Trường cover_file_key lưu { type: String, trim: true, default: null, select: fals làm giá trị trong object.
    cover_file_key: { type: String, trim: true, default: null, select: false },
    // Trường import_source lưu { type: String, trim: true, default: null } làm giá trị trong object.
    import_source: { type: String, trim: true, default: null },
    // Trường source_id lưu { type: String, trim: true, default: null } làm giá trị trong object.
    source_id: { type: String, trim: true, default: null },
    // Trường source_url lưu { type: String, trim: true, default: null } làm giá trị trong object.
    source_url: { type: String, trim: true, default: null },
    // Trường license_name lưu { type: String, trim: true, default: null } làm giá trị trong object.
    license_name: { type: String, trim: true, default: null },
    // Trường license_url lưu { type: String, trim: true, default: null } làm giá trị trong object.
    license_url: { type: String, trim: true, default: null },
    // Trường cover_source_url lưu { type: String, trim: true, default: null } làm giá trị trong object.
    cover_source_url: { type: String, trim: true, default: null },
    // Trường cover_license_name lưu { type: String, trim: true, default: null } làm giá trị trong object.
    cover_license_name: { type: String, trim: true, default: null },
    // Trường cover_license_url lưu { type: String, trim: true, default: null } làm giá trị trong object.
    cover_license_url: { type: String, trim: true, default: null },
    // Trường cover_attribution lưu { type: String, trim: true, default: null } làm giá trị trong object.
    cover_attribution: { type: String, trim: true, default: null },
    // Trường language lưu { type: String, trim: true, default: null } làm giá trị trong object.
    language: { type: String, trim: true, default: null },
    // Trường file_format lưu { type: String, trim: true, default: null } làm giá trị trong object.
    file_format: { type: String, trim: true, default: null },
    // Trường file_size lưu { type: Number, min: 0, default: null } làm giá trị trong object.
    file_size: { type: Number, min: 0, default: null },
    // Trường verified_at lưu { type: Date, default: null } làm giá trị trong object.
    verified_at: { type: Date, default: null },
    // Trường access_level lưu { type: String, enum: ['free', 'premium', 'vip'], defau làm giá trị trong object.
    access_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free', required: true },
    // Trường file_key lưu { type: String, trim: true, default: null, select: fals làm giá trị trong object.
    file_key: { type: String, trim: true, default: null, select: false },
    // Trường file_original_name lưu { type: String, trim: true, default: null, select: fals làm giá trị trong object.
    file_original_name: { type: String, trim: true, default: null, select: false },
    // Trường owner lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Trường status lưu { type: String, enum: ['draft', 'published'], default:  làm giá trị trong object.
    status: { type: String, enum: ['draft', 'published'], default: 'published', required: true }
}, { timestamps: true });

// [CHỈ MỤC TÌM KIẾM] Tối ưu lọc danh mục/quyền truy cập và tìm theo tên sách/tác giả.
// Gọi/thực thi bookSchema.index với các đối số để thực hiện thao tác: bookSchema.index({ status: 1, access_level: 1, category: 1, createdAt: -1 }
bookSchema.index({ status: 1, access_level: 1, category: 1, createdAt: -1 });
// The `language` metadata field stores values such as `vi`, which MongoDB text indexes do not support as language overrides.
// Gọi/thực thi bookSchema.index với các đối số để thực hiện thao tác: bookSchema.index({ title: 'text', author_name: 'text', description: 'text'
bookSchema.index({ title: 'text', author_name: 'text', description: 'text' }, {
    // Trường default_language lưu 'none' làm giá trị trong object.
    default_language: 'none',
    // Trường language_override lưu 'search_language' làm giá trị trong object.
    language_override: 'search_language'
});

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Book || mongoose.model('Book', bookSchema);
