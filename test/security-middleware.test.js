import test from 'node:test';
import assert from 'node:assert/strict';
import Joi from 'joi';
import {
    parseTrustProxy, sanitizeMongoInput
} from '../src/middlewares/security.middleware.js';
import { validateBody, validateQuery } from '../src/middlewares/validate.middleware.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import ApiError from '../src/utils/api-error.js';

// Hàm runMiddleware: Chạy middleware đồng bộ trong kiểm thử và trả lỗi nếu next nhận error.
const runMiddleware = (middleware, req) => new Promise((resolve, reject) => {
    middleware(req, {}, (error) => error ? reject(error) : resolve(req));
});

// Hàm createResponse: Tạo response giả tối thiểu để kiểm tra status và JSON lỗi.
const createResponse = () => ({
    statusCode: 200,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

// Kiểm thử sanitization: Loại toán tử MongoDB và khóa có dấu chấm khỏi mọi phần request.
test('Mongo input middleware removes operator and dotted keys', async () => {
    const req = {
        body: { filter: { ['$gt']: 1, title: 'OpenBook' } },
        params: { ['$where']: 'ignored' },
        headers: {},
        query: { ['filter.$ne']: 'ignored', page: '2' }
    };
    await runMiddleware(sanitizeMongoInput, req);
    assert.deepEqual(req.body, { filter: { title: 'OpenBook' } });
    assert.deepEqual(req.params, {});
    assert.deepEqual(req.query, { page: '2' });
});

// Kiểm thử trust proxy: Chỉ cho phép số hop hoặc proxy/CIDR chỉ định rõ, không tin toàn bộ proxy tùy ý.
test('trust proxy parser rejects wildcard trust and accepts explicit proxy configuration', () => {
    assert.equal(parseTrustProxy(), false);
    assert.equal(parseTrustProxy('1'), 1);
    assert.deepEqual(parseTrustProxy('127.0.0.1,10.0.0.0/8'), ['127.0.0.1', '10.0.0.0/8']);
    assert.throws(() => parseTrustProxy('true'), /hop count or explicit proxy/);
    assert.throws(() => parseTrustProxy('*'), /hop count or explicit proxy/);
});

// Kiểm thử validation: Strip trường không nằm trong schema và ép kiểu query theo Joi.
test('request validators strip unknown fields and convert query values', async () => {
    const bodyReq = { body: { title: 'Book', injected: true }, authUser: null };
    await runMiddleware(validateBody(Joi.object({ title: Joi.string().required() })), bodyReq);
    assert.deepEqual(bodyReq.body, { title: 'Book' });

    const queryReq = { query: { page: '2', ignored: 'value' }, authUser: null };
    await runMiddleware(validateQuery(Joi.object({ page: Joi.number().integer().required() })), queryReq);
    assert.deepEqual(queryReq.query, { page: 2 });
});

// Kiểm thử validation: Trả ApiError 400 cùng danh sách field khi đầu vào không hợp lệ.
test('request validators forward normalized bad-request errors', async () => {
    const req = { body: { count: 'not-a-number' }, authUser: null };
    await assert.rejects(
        runMiddleware(validateBody(Joi.object({ count: Joi.number().required() })), req),
        (error) => error instanceof ApiError && error.statusCode === 400
            && error.violations[0].field === 'count'
    );
});

// Kiểm thử error handler: Chuẩn hóa lỗi JWT và ApiError theo response JSON dùng chung.
test('global error handler maps JWT and ApiError responses safely', () => {
    const jwtResponse = createResponse();
    errorHandler({ name: 'TokenExpiredError' }, { method: 'GET', originalUrl: '/private' }, jwtResponse, () => {});
    assert.equal(jwtResponse.statusCode, 401);
    assert.deepEqual(jwtResponse.body, { status: 'error', message: 'Access token is invalid or expired' });

    const apiResponse = createResponse();
    errorHandler(new ApiError(403, 'Forbidden'), { method: 'GET', originalUrl: '/private' }, apiResponse, () => {});
    assert.equal(apiResponse.statusCode, 403);
    assert.deepEqual(apiResponse.body, { status: 'error', message: 'Forbidden' });
});
