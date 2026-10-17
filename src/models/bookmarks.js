import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true }
}, { timestamps: true });

bookmarkSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

