// [CONTROLLER BÁO CÁO] Lưu yêu cầu liên hệ/báo lỗi và chuyển nội dung tới Admin qua SMTP.
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as reportService from '../services/report.service.js';
import { toReportDto } from '../utils/api-dto.js';
import { createSmtpTransport, sendSupportReceipt } from '../config/mailer.js';

// [NHẬN BÁO CÁO] Ghi yêu cầu trước để không mất nội dung; nếu SMTP lỗi sẽ trả lỗi có mã tra cứu.
export const createReport = asyncHandler(async (req, res) => {
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const type = req.body.type === 'bug' ? 'bug' : 'contact';
    const email = req.authUser?.email || String(req.body.email || '').trim().toLowerCase();
    const violations = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        violations.push({ field: 'email', message: 'A valid email address is required' });
    }
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
        violations.push({ field: 'subject', message: 'Subject is required, must be at most 200 characters, and cannot contain line breaks' });
    }
    if (!message || message.length > 5000) violations.push({ field: 'message', message: 'Message is required and must be at most 5000 characters' });
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);

    const report = await reportService.createReport(
        { email, subject, message, type }, req.authUser || null
    );
    const supportInbox = process.env.ADMIN_EMAIL || process.env.MAIL_USER || process.env.SMTP_USER;
    if (!supportInbox) {
        throw new ApiError(503, 'Report was recorded but email delivery is not configured', [
            { field: 'report_id', message: report.id }
        ]);
    }
    let transporter;
    let from;
    try {
        ({ transporter, from } = createSmtpTransport());
    } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        throw new ApiError(503, 'Report was recorded but email delivery is not configured', [
            { field: 'report_id', message: report.id }
        ]);
    }
    try {
        await transporter.sendMail({
            from,
            to: supportInbox,
            replyTo: email,
            subject: `[HarveyBook ${type}] ${subject}`,
            text: `Report ID: ${report.id}\nFrom: ${email}\n\n${message}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#29261f"><h2>[HarveyBook ${type}] ${subject.replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character])}</h2><p><strong>Report ID:</strong> ${report.id}<br><strong>From:</strong> ${email}</p><pre style="white-space:pre-wrap;font:inherit">${message.replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character])}</pre></div>`
        });
    } catch (error) {
        console.error(`[MAIL] Could not deliver report ${report.id}`, error);
        throw new ApiError(502, 'Report was recorded but email delivery failed', [
            { field: 'report_id', message: report.id }
        ]);
    }
    let confirmationEmailSent = true;
    try {
        await sendSupportReceipt({ email, reportId: report.id, subject, type });
    } catch {
        confirmationEmailSent = false;
    }
    return res.status(201).json({
        status: 'success',
        message: confirmationEmailSent
            ? 'Support request received and confirmation email sent'
            : 'Support request received, but the confirmation email could not be delivered',
        data: { ...toReportDto({ id: report.id, status: report.status }), confirmation_email_sent: confirmationEmailSent }
    });
});
