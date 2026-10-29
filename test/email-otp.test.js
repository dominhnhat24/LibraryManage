import test from 'node:test';
import assert from 'node:assert/strict';
import { getSmtpSettings, sendRegistrationOtp } from '../src/config/mailer.js';

// Kiểm thử cấu hình SMTP: Khi thiếu cấu hình mailer, đăng ký nhận lỗi 503 rõ ràng thay vì thành công giả.
test('registration email reports unavailable SMTP configuration', async () => {
    const keys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM'];
    const previous = new Map(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];

    try {
        await assert.rejects(
            sendRegistrationOtp('reader@example.com', '123456'),
            (error) => error.statusCode === 503 && /SMTP is not configured/.test(error.message)
        );
    } finally {
        for (const [key, value] of previous) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

// Kiểm thử tương thích: Các biến SMTP_* đang có trong môi trường được ánh xạ đúng sang cấu hình Nodemailer.
test('SMTP configuration supports legacy SMTP environment variable names', () => {
    const keys = [
        'MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM',
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'
    ];
    const previous = new Map(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'reader@example.com';
    process.env.SMTP_PASS = 'test-app-password';

    try {
        assert.deepEqual(getSmtpSettings(), {
            host: 'smtp.gmail.com',
            port: 587,
            user: 'reader@example.com',
            password: 'test-app-password',
            from: 'reader@example.com'
        });
    } finally {
        for (const [key, value] of previous) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});
