// [CONTROLLER BÁO CÁO] Lưu yêu cầu liên hệ/báo lỗi và chuyển nội dung tới Admin qua SMTP.
// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/controllers/report.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import * as reportService từ ../services/report.service.js để dùng trong module.
import * as reportService from '../services/report.service.js';
// Import { toReportDto } từ ../utils/api-dto.js để dùng trong module.
import { toReportDto } from '../utils/api-dto.js';
// Import { createSmtpTransport, sendSupportReceipt } từ ../config/mailer.js để dùng trong module.
import { createSmtpTransport, sendSupportReceipt } from '../config/mailer.js';

// [NHẬN BÁO CÁO] Ghi yêu cầu trước để không mất nội dung; nếu SMTP lỗi sẽ trả lỗi có mã tra cứu.
// Khai báo createReport nhận giá trị từ asyncHandler(async (req, res) => { const subject = Stri. const giữ biến không gán lại; let cho phép cập nhật.
export const createReport = asyncHandler(async (req, res) => {
    // Khai báo subject nhận giá trị từ String(req.body.subject || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const subject = String(req.body.subject || '').trim();
    // Khai báo message nhận giá trị từ String(req.body.message || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const message = String(req.body.message || '').trim();
    // Khai báo type nhận giá trị từ req.body.type === 'bug' ? 'bug' : 'contact'. const giữ biến không gán lại; let cho phép cập nhật.
    const type = req.body.type === 'bug' ? 'bug' : 'contact';
    // Khai báo email nhận giá trị từ req.authUser?.email || String(req.body.email || '').tri. const giữ biến không gán lại; let cho phép cập nhật.
    const email = req.authUser?.email || String(req.body.email || '').trim().toLowerCase();
    // Khai báo violations nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const violations = [];
    // if chỉ chạy nhánh này khi điều kiện !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 đúng.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        // Gọi/thực thi violations.push với các đối số để thực hiện thao tác: violations.push({ field: 'email', message: 'A valid email address is requir
        violations.push({ field: 'email', message: 'A valid email address is required' });
    }
    // if chỉ chạy nhánh này khi điều kiện !subject || subject.length > 200 || /[\r\n]/.test(subject) đúng.
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
        // Gọi/thực thi violations.push với các đối số để thực hiện thao tác: violations.push({ field: 'subject', message: 'Subject is required, must be
        violations.push({ field: 'subject', message: 'Subject is required, must be at most 200 characters, and cannot contain line breaks' });
    }
    // if chỉ chạy nhánh này khi điều kiện !message || message.length > 5000 đúng.
    if (!message || message.length > 5000) violations.push({ field: 'message', message: 'Message is required and must be at most 5000 characters' });
    // if chỉ chạy nhánh này khi điều kiện violations.length đúng.
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);

    // Khai báo report nhận giá trị từ await reportService.createReport( { email, subject, mes. const giữ biến không gán lại; let cho phép cập nhật.
    const report = await reportService.createReport(
        { email, subject, message, type }, req.authUser || null
    );
    // Khai báo supportInbox nhận giá trị từ process.env.ADMIN_EMAIL || process.env.MAIL_USER || pro. const giữ biến không gán lại; let cho phép cập nhật.
    const supportInbox = process.env.ADMIN_EMAIL || process.env.MAIL_USER || process.env.SMTP_USER;
    // if chỉ chạy nhánh này khi điều kiện !supportInbox đúng.
    if (!supportInbox) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Report was recorded but email delivery is not configured', [
            { field: 'report_id', message: report.id }
        ]);
    }
    // Khai báo transporter nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let transporter;
    // Khai báo from nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let from;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Gọi/thực thi createSmtpTransport với các đối số để thực hiện thao tác: ({ transporter, from } = createSmtpTransport())
        ({ transporter, from } = createSmtpTransport());
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện !(error instanceof ApiError) đúng.
        if (!(error instanceof ApiError)) throw error;
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Report was recorded but email delivery is not configured', [
            { field: 'report_id', message: report.id }
        ]);
    }
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await transporter.sendMail({ from, to: supportInbox, replyTo: email, subjec
        await transporter.sendMail({
            // Khóa from nhận biến cùng tên làm giá trị.
            from,
            // Trường to lưu supportInbox làm giá trị trong object.
            to: supportInbox,
            // Trường replyTo lưu email làm giá trị trong object.
            replyTo: email,
            // Trường subject lưu `[HarveyBook ${type}] ${subject}` làm giá trị trong object.
            subject: `[HarveyBook ${type}] ${subject}`,
            // Trường text lưu `Report ID: ${report.id}\nFrom: ${email}\n\n${message}` làm giá trị trong object.
            text: `Report ID: ${report.id}\nFrom: ${email}\n\n${message}`,
            // Trường html lưu `<div style="font-family:Arial,sans-serif;max-width:600 làm giá trị trong object.
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#29261f"><h2>[HarveyBook ${type}] ${subject.replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character])}</h2><p><strong>Report ID:</strong> ${report.id}<br><strong>From:</strong> ${email}</p><pre style="white-space:pre-wrap;font:inherit">${message.replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character])}</pre></div>`
        });
    } catch (error) {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error(`[MAIL] Could not deliver report ${report.id}`, error)
        console.error(`[MAIL] Could not deliver report ${report.id}`, error);
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(502, 'Report was recorded but email delivery failed', [
            { field: 'report_id', message: report.id }
        ]);
    }
    // Khai báo confirmationEmailSent nhận giá trị từ true. const giữ biến không gán lại; let cho phép cập nhật.
    let confirmationEmailSent = true;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await sendSupportReceipt({ email, reportId: report.id, subject, type })
        await sendSupportReceipt({ email, reportId: report.id, subject, type });
    } catch {
        // Gọi/thực thi biểu thức để thực hiện thao tác: confirmationEmailSent = false
        confirmationEmailSent = false;
    }
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', message: confirmationEmailSent ?  về nơi gọi.
    return res.status(201).json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu confirmationEmailSent ? 'Support request received and c làm giá trị trong object.
        message: confirmationEmailSent
            ? 'Support request received and confirmation email sent'
            : 'Support request received, but the confirmation email could not be delivered',
        // Trường data lưu { ...toReportDto({ id: report.id, status: report.status làm giá trị trong object.
        data: { ...toReportDto({ id: report.id, status: report.status }), confirmation_email_sent: confirmationEmailSent }
    });
});
