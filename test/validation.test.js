import test from 'node:test';
import assert from 'node:assert/strict';
import { modelValidation } from '../src/validations/model.validation.js';
import { slugify } from '../src/utils/slugify.js';
import { authValidation } from '../src/validations/auth.validation.js';

// Kiểm thử Joi: Chấp nhận tên thay thế full_name nhưng không cho đăng ký tự gán role quản trị.
test('user validation normalizes registration names and rejects client-selected roles', () => {
    const registration = modelValidation.user.create.validate({
        full_name: 'A Reader',
        email: 'reader@example.com',
        password: 'secure-pass-123'
    });
    assert.equal(registration.error, undefined);
    assert.equal(registration.value.name, 'A Reader');
    assert.ok(modelValidation.user.create.validate({
        name: 'A Reader',
        email: 'reader@example.com',
        password: 'secure-pass-123',
        role: 'ADMIN'
    }).error);
});

// Kiểm thử OTP: Chỉ chấp nhận email hợp lệ cùng mã xác minh đúng sáu chữ số.
test('email verification validation accepts six-digit OTPs and rejects malformed requests', () => {
    assert.equal(authValidation.verifyEmail.validate({
        email: 'reader@example.com',
        otp: '004219'
    }).error, undefined);
    assert.ok(authValidation.verifyEmail.validate({
        email: 'reader@example.com',
        otp: '4219'
    }).error);
    assert.ok(authValidation.resendVerification.validate({ email: 'not-an-email' }).error);
});

test('profile and password change validators reject privilege fields and require a valid OTP', () => {
    assert.equal(authValidation.updateProfile.validate({ name: ' Reader ' }).value.name, 'Reader');
    assert.ok(authValidation.updateProfile.validate({ role: 'ADMIN' }).error);
    assert.ok(authValidation.changePassword.validate({ otp: '123', new_password: 'secure-password' }).error);
    assert.ok(authValidation.changePassword.validate({ otp: '123456', new_password: 'short' }).error);
    assert.equal(authValidation.changePassword.validate({ otp: '123456', new_password: 'secure-password' }).error, undefined);
});

// Kiểm thử auth DTO đầu vào: Refresh token đúng cấu trúc JWT và đăng ký chỉ chọn một tên.
test('auth validation requires one registration name and a valid refresh JWT shape', () => {
    const baseRegistration = {
        email: 'reader@example.com',
        password: 'secure-pass-123'
    };
    assert.equal(authValidation.register.validate({ ...baseRegistration, name: 'Reader' }).error, undefined);
    assert.equal(authValidation.register.validate({
        ...baseRegistration, name: 'Reader', full_name: 'Reader'
    }).error.details[0].type, 'object.xor');
    assert.ok(authValidation.refresh.validate({ refresh_token: 'invalid-token' }).error);
    assert.equal(authValidation.refresh.validate({
        refresh_token: 'header.payload.signature',
        injected: true
    }, { stripUnknown: true }).value.injected, undefined);
});

// Kiểm thử Joi: Email báo cáo bắt buộc với khách vãng lai nhưng lấy từ tài khoản khi đã đăng nhập.
test('report validation requires email only for unauthenticated submissions', () => {
    const authenticatedReport = {
        subject: 'A request',
        message: 'Please help'
    };
    const guestReport = {
        ...authenticatedReport,
        email: 'reader@example.com'
    };
    assert.equal(modelValidation.report.create.validate(authenticatedReport, {
        context: { authenticated: true }
    }).error, undefined);
    assert.equal(modelValidation.report.create.validate(authenticatedReport, {
        context: { authenticated: false }
    }).error.details[0].path[0], 'email');
    assert.equal(modelValidation.report.create.validate(guestReport, {
        context: { authenticated: false }
    }).error, undefined);
});

// Kiểm thử Joi: Xác nhận schema bám Model và loại trường sở hữu không được khai báo.
test('book create/update validation strips unknown fields and accepts model fields', () => {
    const validBook = {
        title: 'A Book',
        author_name: 'An Author',
        category: 'ebook',
        owner: '507f1f77bcf86cd799439011'
    };
    const sanitized = modelValidation.book.create.validate(validBook, {
        stripUnknown: { objects: true }
    });
    assert.equal(sanitized.error, undefined);
    assert.equal(sanitized.value.owner, undefined);
    assert.equal(modelValidation.book.create.validate({
        title: 'A Book', author_name: 'An Author', category: 'ebook'
    }).error, undefined);
    assert.equal(modelValidation.book.update.validate({ description: 'Updated' }).error, undefined);
    assert.ok(modelValidation.book.update.validate({}).error);
    assert.equal(modelValidation.book.list.validate({
        category: 'comic',
        status: 'draft'
    }).error, undefined);
    assert.ok(modelValidation.book.list.validate({ status: 'archived' }).error);
});

// Kiểm thử Joi: Chỉ cho phép những gói thuê bao có trong enum của Subscription Model.
test('subscription validation accepts only model-defined plans', () => {
    assert.equal(modelValidation.subscription.create.validate({ plan: 'vip_monthly' }).error, undefined);
    assert.equal(modelValidation.subscription.create.validate({ plan: 'premium_monthly' }).error, undefined);
    assert.ok(modelValidation.subscription.create.validate({ plan: 'monthly' }).error);
});

// Kiểm thử Joi: Chặn giá trị ngoài giới hạn Mongoose của chapter, comment, report và tiến độ đọc.
test('content validation rejects values outside model constraints', () => {
    assert.ok(modelValidation.chapter.create.validate({
        book_id: '507f1f77bcf86cd799439011',
        title: 'Chapter',
        chapter_number: 0
    }).error);
    assert.ok(modelValidation.comment.create.validate({ body: 'Comment', rating: 6 }).error);
    assert.ok(modelValidation.report.update.validate({ status: 'deleted' }).error);
    assert.ok(modelValidation.readingProgress.update.validate({ chapters_since_ad: 3 }).error);
    assert.equal(modelValidation.readingProgress.list.validate({ page: '1', limit: '100' }).error, undefined);
    assert.ok(modelValidation.readingProgress.list.validate({ page: '1', limit: '101' }).error);
});

// Kiểm thử slug: Chuẩn hóa tiêu đề tiếng Việt thành slug URL không dấu, chữ thường và có dấu gạch nối.
test('slugify creates a stable SEO slug from Vietnamese titles', () => {
    assert.equal(slugify('  Truyện Đọc Hay: Chương 1!  '), 'truyen-doc-hay-chuong-1');
});
