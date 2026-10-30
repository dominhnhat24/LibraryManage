// Import Nodemailer từ nodemailer để dùng trong module.
/**
 * Tệp src/config/mailer.js: cấu hình dịch vụ dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Nodemailer from 'nodemailer';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';

/**
 * Hàm escapeHtml: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, replace.
 */
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    // Trường '&' lưu '&amp;' làm giá trị trong object.
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

// Hàm getSmtpSettings: Đọc cấu hình mail ưu tiên MAIL_* và hỗ trợ tên SMTP_* đang dùng trong .env hiện tại.
/**
 * Hàm getSmtpSettings: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, Number, isInteger.
 */
export const getSmtpSettings = () => {
    // Khai báo host nhận giá trị từ process.env.MAIL_HOST || process.env.SMTP_HOST. const giữ biến không gán lại; let cho phép cập nhật.
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
    // Khai báo user nhận giá trị từ process.env.MAIL_USER || process.env.SMTP_USER. const giữ biến không gán lại; let cho phép cập nhật.
    const user = process.env.MAIL_USER || process.env.SMTP_USER;
    // Khai báo password nhận giá trị từ process.env.MAIL_PASSWORD || process.env.SMTP_PASS. const giữ biến không gán lại; let cho phép cập nhật.
    const password = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
    // Khai báo from nhận giá trị từ process.env.MAIL_FROM || process.env.SMTP_FROM || user. const giữ biến không gán lại; let cho phép cập nhật.
    const from = process.env.MAIL_FROM || process.env.SMTP_FROM || user;
    // if chỉ chạy nhánh này khi điều kiện !host || !user || !password || !from đúng.
    if (!host || !user || !password || !from) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Email delivery is unavailable because SMTP is not configured');
    }

    // Khai báo port nhận giá trị từ Number(process.env.MAIL_PORT || process.env.SMTP_PORT |. const giữ biến không gán lại; let cho phép cập nhật.
    const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
    // if chỉ chạy nhánh này khi điều kiện !Number.isInteger(port) || port < 1 || port > 65535 đúng.
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Email delivery is unavailable because the SMTP port is invalid');
    }
    // return kết thúc hàm và trả { host, port, user, password, from } về nơi gọi.
    return { host, port, user, password, from };
};

// Hàm createSmtpTransport: Tạo kết nối Nodemailer dùng chung cấu hình đã chuẩn hóa cho các luồng email.
/**
 * Hàm createSmtpTransport: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: getSmtpSettings, createTransport.
 */
export const createSmtpTransport = () => {
    // Khai báo settings nhận giá trị từ getSmtpSettings(). const giữ biến không gán lại; let cho phép cập nhật.
    const settings = getSmtpSettings();
    // Khai báo transporter nhận giá trị từ Nodemailer.createTransport({ host: settings.host, port:. const giữ biến không gán lại; let cho phép cập nhật.
    const transporter = Nodemailer.createTransport({
        // Trường host lưu settings.host làm giá trị trong object.
        host: settings.host,
        // Trường port lưu settings.port làm giá trị trong object.
        port: settings.port,
        // Trường secure lưu settings.port === 465 làm giá trị trong object.
        secure: settings.port === 465,
        // Trường connectionTimeout lưu 10000 làm giá trị trong object.
        connectionTimeout: 10000,
        // Trường greetingTimeout lưu 10000 làm giá trị trong object.
        greetingTimeout: 10000,
        // Trường socketTimeout lưu 15000 làm giá trị trong object.
        socketTimeout: 15000,
        // Trường auth lưu { user: settings.user, pass: settings.password } làm giá trị trong object.
        auth: { user: settings.user, pass: settings.password }
    });
    // return kết thúc hàm và trả { transporter, from: settings.from } về nơi gọi.
    return { transporter, from: settings.from };
};

// Hàm sendRegistrationOtp: Gửi mã xác minh đăng ký qua SMTP; báo lỗi cấu hình hoặc giao nhận rõ ràng.
/**
 * Hàm sendRegistrationOtp: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: email, otp.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createSmtpTransport, sendMail, error, ApiError.
 */
export const sendRegistrationOtp = async (email, otp) => {
    // Khai báo { transporter, from } nhận giá trị từ createSmtpTransport(). const giữ biến không gán lại; let cho phép cập nhật.
    const { transporter, from } = createSmtpTransport();

    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await transporter.sendMail({ from: `"HarveyBook Library" <${from}>`, to: em
        await transporter.sendMail({
            // Trường from lưu `"HarveyBook Library" <${from}>` làm giá trị trong object.
            from: `"HarveyBook Library" <${from}>`,
            // Trường to lưu email.requested || email làm giá trị trong object.
            to: email.requested || email, // Hỗ trợ cả email trực tiếp hoặc req.body.email từ controller
            // Trường subject lưu 'Mã xác minh đăng ký HarveyBook' làm giá trị trong object.
            subject: 'Mã xác minh đăng ký HarveyBook',
            // Trường text lưu `Mã xác minh HarveyBook của bạn là ${otp}. Mã có hiệu l làm giá trị trong object.
            text: `Mã xác minh HarveyBook của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
            // Trường html lưu ` <div style="font-family:Arial,sans-serif;max-width:52 làm giá trị trong object.
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
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('[MAIL] Could not deliver registration verification email', e
        console.error('[MAIL] Could not deliver registration verification email', error);
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(502, 'Could not deliver the verification email; please try again later');
    }
};

/**
 * Hàm sendPasswordChangeOtp: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: email, otp.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createSmtpTransport, sendMail, ApiError.
 */
export const sendPasswordChangeOtp = async (email, otp) => {
    // Khai báo { transporter, from } nhận giá trị từ createSmtpTransport(). const giữ biến không gán lại; let cho phép cập nhật.
    const { transporter, from } = createSmtpTransport();
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await transporter.sendMail({ from: `"HarveyBook Library" <${from}>`, to: em
        await transporter.sendMail({
            // Trường from lưu `"HarveyBook Library" <${from}>` làm giá trị trong object.
            from: `"HarveyBook Library" <${from}>`,
            // Trường to lưu email làm giá trị trong object.
            to: email,
            // Trường subject lưu 'Mã xác minh đổi mật khẩu HarveyBook' làm giá trị trong object.
            subject: 'Mã xác minh đổi mật khẩu HarveyBook',
            // Trường text lưu `Mã xác minh đổi mật khẩu HarveyBook của bạn là ${otp}. làm giá trị trong object.
            text: `Mã xác minh đổi mật khẩu HarveyBook của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
            // Trường html lưu `<div style="font-family:Arial,sans-serif;max-width:520 làm giá trị trong object.
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #ddd"><h2>Xác minh đổi mật khẩu</h2><p>Mã của bạn:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p></div>`
        });
    } catch {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(502, 'Could not deliver the password verification email; please try again later');
    }
};

/**
 * Hàm sendSupportReceipt: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { email, reportId, subject, type }.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createSmtpTransport, escapeHtml, sendMail, error.
 */
export const sendSupportReceipt = async ({ email, reportId, subject, type }) => {
    // Khai báo { transporter, from } nhận giá trị từ createSmtpTransport(). const giữ biến không gán lại; let cho phép cập nhật.
    const { transporter, from } = createSmtpTransport();
    // Khai báo requestType nhận giá trị từ type === 'bug' ? 'báo lỗi kỹ thuật' : 'yêu cầu hỗ trợ'. const giữ biến không gán lại; let cho phép cập nhật.
    const requestType = type === 'bug' ? 'báo lỗi kỹ thuật' : 'yêu cầu hỗ trợ';
    // Khai báo safeSubject nhận giá trị từ escapeHtml(subject). const giữ biến không gán lại; let cho phép cập nhật.
    const safeSubject = escapeHtml(subject);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await transporter.sendMail({ from: `"HarveyBook Hỗ trợ" <${from}>`, to: ema
        await transporter.sendMail({
            // Trường from lưu `"HarveyBook Hỗ trợ" <${from}>` làm giá trị trong object.
            from: `"HarveyBook Hỗ trợ" <${from}>`,
            // Trường to lưu email làm giá trị trong object.
            to: email,
            // Trường subject lưu 'HarveyBook đã nhận được yêu cầu hỗ trợ của bạn' làm giá trị trong object.
            subject: 'HarveyBook đã nhận được yêu cầu hỗ trợ của bạn',
            // Trường text lưu `Xin chào,\n\nChúng tôi đã nhận được ${requestType} của làm giá trị trong object.
            text: `Xin chào,\n\nChúng tôi đã nhận được ${requestType} của bạn với tiêu đề: ${subject}.\nĐội ngũ HarveyBook sẽ xem xét và trả lời lại trong thời gian sớm nhất.\n\nMã yêu cầu: ${reportId}\n\nCảm ơn bạn đã liên hệ HarveyBook.`,
            // Trường html lưu `<div style="font-family:Arial,sans-serif;max-width:560 làm giá trị trong object.
            html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#29261f;background:#fbf9f2;border:1px solid #e2dbc6;border-radius:12px"><h2 style="margin:0 0 18px;color:#5f512b">HarveyBook đã nhận được yêu cầu của bạn</h2><p>Xin chào,</p><p>Chúng tôi đã nhận được ${requestType} của bạn. Đội ngũ HarveyBook sẽ xem xét và trả lời lại trong thời gian sớm nhất.</p><p><strong>Tiêu đề:</strong> ${safeSubject}</p><p><strong>Mã yêu cầu:</strong> ${escapeHtml(reportId)}</p><p style="margin-top:24px">Cảm ơn bạn đã liên hệ HarveyBook.</p></div>`
        });
    } catch (error) {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error(`[MAIL] Could not send support receipt for report ${reportId}
        console.error(`[MAIL] Could not send support receipt for report ${reportId}`, error);
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
};
