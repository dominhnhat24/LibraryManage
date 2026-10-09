// [CONTROLLER BÁO CÁO] Lưu yêu cầu liên hệ/báo lỗi và chuyển nội dung tới Admin qua SMTP.
import nodemailer from 'nodemailer';
import Report from '../models/report.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

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

    const report = await Report.create({
        user: req.authUser?._id || null, email, subject, message, type
    });
    const requiredMailSettings = [
        process.env.MAIL_HOST, process.env.MAIL_USER, process.env.MAIL_PASSWORD,
        process.env.MAIL_FROM, process.env.ADMIN_EMAIL
    ];
    if (requiredMailSettings.some((value) => !value)) {
        throw new ApiError(503, 'Report was recorded but email delivery is not configured', [
            { field: 'report_id', message: report.id }
        ]);
    }
    const port = Number(process.env.MAIL_PORT || 587);
    const transport = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port,
        secure: port === 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
    });
    try {
        await transport.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            replyTo: email,
            subject: `[OpenBook ${type}] ${subject}`,
            text: `Report ID: ${report.id}\nFrom: ${email}\n\n${message}`
        });
    } catch (error) {
        console.error(`[MAIL] Could not deliver report ${report.id}`, error);
        throw new ApiError(502, 'Report was recorded but email delivery failed', [
            { field: 'report_id', message: report.id }
        ]);
    }
    return res.status(201).json({
        status: 'success',
        message: 'Report was sent to the administrator',
        data: { id: report.id, status: report.status }
    });
});
