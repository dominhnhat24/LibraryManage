// [MODEL BÌNH LUẬN] Lưu bình luận/đánh giá thuộc một sách và một tài khoản đã xác thực.
import mongoose from 'mongoose';

// [LƯỢC ĐỒ BÌNH LUẬN] Mỗi người dùng chỉ có một đánh giá cho một cuốn sách.
const commentSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    rating: { type: Number, min: 1, max: 5, default: null }
}, { timestamps: true });
commentSchema.index({ book: 1, user: 1 }, { unique: true });

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
