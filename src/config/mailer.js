import Nodemailer from 'nodemailer';
import ApiError from '../utils/api-error.js';

// Tạo transporter dùng chung
const transporter = Nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true cho port 465, false cho các port khác như 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendRegisterOtp = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"OpenBook Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Mã xác thực tài khoản OpenBook',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #4A90E2; text-align: center;">Chào mừng bạn đến với OpenBook!</h2>
                    <p style="font-size: 16px; color: #333;">Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình xác thực, vui lòng sử dụng mã OTP bên dưới:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff5722; background: #fff; padding: 12px 24px; border: 1px dashed #ff5722; border-radius: 6px;">
                            ${otp}
                        </span>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Trân trọng,<br>Đội ngũ phát triển OpenBook</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new ApiError(500, 'Không thể gửi email xác thực, vui lòng thử lại sau.');
    }
};









