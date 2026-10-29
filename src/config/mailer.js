import Nodemailer from 'nodemailer';
import ApiError from '../utils/api-error.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

// Hàm getSmtpSettings: Đọc cấu hình mail ưu tiên MAIL_* và hỗ trợ tên SMTP_* đang dùng trong .env hiện tại.
export const getSmtpSettings = () => {
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
    const user = process.env.MAIL_USER || process.env.SMTP_USER;
    const password = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || process.env.SMTP_FROM || user;
    if (!host || !user || !password || !from) {
        throw new ApiError(503, 'Email delivery is unavailable because SMTP is not configured');
    }

    const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new ApiError(503, 'Email delivery is unavailable because the SMTP port is invalid');
    }
    return { host, port, user, password, from };
};

// Hàm createSmtpTransport: Tạo kết nối Nodemailer dùng chung cấu hình đã chuẩn hóa cho các luồng email.
export const createSmtpTransport = () => {
    const settings = getSmtpSettings();
    const transporter = Nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.port === 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: { user: settings.user, pass: settings.password }
    });
    return { transporter, from: settings.from };
};

// Hàm sendRegistrationOtp: Gửi mã xác minh đăng ký qua SMTP; báo lỗi cấu hình hoặc giao nhận rõ ràng.
export const sendRegistrationOtp = async (email, otp) => {
    const { transporter, from } = createSmtpTransport();

    try {
        await transporter.sendMail({
            from: `"HarveyBook Library" <${from}>`,
            to: email.requested || email, // Hỗ trợ cả email trực tiếp hoặc req.body.email từ controller
            subject: 'Mã xác minh đăng ký HarveyBook',
            text: `Mã xác minh HarveyBook của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #ddd">
                    <h2>Chào mừng bạn đến với HarveyBook</h2>
                    <p>Nhập mã sau để xác minh địa chỉ email và hoàn tất đăng ký:</p>
                    <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p>
                    <p>Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('[MAIL] Could not deliver registration verification email', error);
        throw new ApiError(502, 'Could not deliver the verification email; please try again later');
    }
};

export const sendPasswordChangeOtp = async (email, otp) => {
    const { transporter, from } = createSmtpTransport();
    try {
        await transporter.sendMail({
            from: `"HarveyBook Library" <${from}>`,
            to: email,
            subject: 'Mã xác minh đổi mật khẩu HarveyBook',
            text: `Mã xác minh đổi mật khẩu HarveyBook của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #ddd"><h2>Xác minh đổi mật khẩu</h2><p>Mã của bạn:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p></div>`
        });
    } catch {
        throw new ApiError(502, 'Could not deliver the password verification email; please try again later');
    }
};

export const sendSupportReceipt = async ({ email, reportId, subject, type }) => {
    const { transporter, from } = createSmtpTransport();
    const requestType = type === 'bug' ? 'báo lỗi kỹ thuật' : 'yêu cầu hỗ trợ';
    const safeSubject = escapeHtml(subject);
    try {
        await transporter.sendMail({
            from: `"HarveyBook Hỗ trợ" <${from}>`,
            to: email,
            subject: 'HarveyBook đã nhận được yêu cầu hỗ trợ của bạn',
            text: `Xin chào,\n\nChúng tôi đã nhận được ${requestType} của bạn với tiêu đề: ${subject}.\nĐội ngũ HarveyBook sẽ xem xét và trả lời lại trong thời gian sớm nhất.\n\nMã yêu cầu: ${reportId}\n\nCảm ơn bạn đã liên hệ HarveyBook.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#29261f;background:#fbf9f2;border:1px solid #e2dbc6;border-radius:12px"><h2 style="margin:0 0 18px;color:#5f512b">HarveyBook đã nhận được yêu cầu của bạn</h2><p>Xin chào,</p><p>Chúng tôi đã nhận được ${requestType} của bạn. Đội ngũ HarveyBook sẽ xem xét và trả lời lại trong thời gian sớm nhất.</p><p><strong>Tiêu đề:</strong> ${safeSubject}</p><p><strong>Mã yêu cầu:</strong> ${escapeHtml(reportId)}</p><p style="margin-top:24px">Cảm ơn bạn đã liên hệ HarveyBook.</p></div>`
        });
    } catch (error) {
        console.error(`[MAIL] Could not send support receipt for report ${reportId}`, error);
        throw error;
    }
};
