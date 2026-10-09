import mongoose from 'mongoose';

const tempUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone_number: { type: String, required: true },
    otp: { type: String, required: true },
    otp_expires_at: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('TempUser', tempUserSchema);