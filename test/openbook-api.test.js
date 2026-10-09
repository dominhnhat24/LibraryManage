// [KIỂM THỬ API] Kiểm tra hợp đồng không cần MongoDB cho health check, xác thực và gỡ API thư viện cũ.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

// [KHỞI TẠO ỨNG DỤNG] Đặt secret trước khi nạp server; import app không mở kết nối MongoDB.
process.env.JWT_SECRET = 'openbook-test-secret-with-more-than-32-characters';
const { app } = await import('../server.js');
let server;
let baseUrl;

// [MỞ CỔNG KIỂM THỬ] Dùng cổng ngẫu nhiên để test song song không tranh cổng cố định.
before(async () => {
    server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// [DỌN SERVER] Đóng listener sau test để tiến trình Node kết thúc ổn định.
after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

// [GỬI REQUEST] Tạo request JSON tới app đang chạy và giải mã kết quả.
const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'content-type': 'application/json' } : {}),
            ...options.headers
        }
    });
    return { response, body: await response.json() };
};

// [HEALTH CHECK] Xác nhận API khởi động được mà không cần cấu hình cơ sở dữ liệu.
test('health check is available without a database connection', async () => {
    const { response, body } = await request('/');
    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
});

// [VALIDATION AUTH] Dữ liệu đăng ký/đăng nhập thiếu trường bị từ chối rõ ràng trước khi truy cập DB.
test('auth endpoints validate missing fields with a stable error envelope', async () => {
    const register = await request('/api/v1/auth/register', {
        method: 'POST', body: JSON.stringify({})
    });

    // [BODY REQUEST] Request body bị thiếu hoặc JSON hỏng không được biến thành lỗi 500.
    test('missing or malformed request bodies return client errors', async () => {
        const empty = await request('/api/v1/auth/login', { method: 'POST' });
        assert.equal(empty.response.status, 400);

        const malformed = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{"name":'
        });
        assert.equal(malformed.status, 400);
    });

    // [VALIDATION TÌM KIẾM] Danh mục không thuộc catalog được từ chối trước khi truy cập cơ sở dữ liệu.
    test('book search rejects unsupported content categories', async () => {
        const { response, body } = await request('/api/v1/books?category=physical');
        assert.equal(response.status, 400);
        assert.equal(body.status, 'error');
    });
    assert.equal(register.response.status, 400);
    assert.equal(register.body.message, 'Request validation failed');
    assert.ok(register.body.violations.some(({ field }) => field === 'password'));

    const login = await request('/api/v1/auth/login', {
        method: 'POST', body: JSON.stringify({})
    });
    assert.equal(login.response.status, 400);
    assert.equal(login.body.status, 'error');
});

// [BẢO VỆ API] Tải xuống, đọc chương và quản trị chặn request chưa có access token.
test('protected reading, download, subscription and admin routes require authentication', async () => {
    const paths = [
        ['/api/v1/downloads/507f1f77bcf86cd799439011', 'GET'],
        ['/api/v1/books/507f1f77bcf86cd799439011/stream', 'GET'],
        ['/api/v1/books/507f1f77bcf86cd799439011/chapters/507f1f77bcf86cd799439012/read', 'POST'],
        ['/api/v1/subscriptions', 'POST'],
        ['/api/v1/admin/users/recent', 'GET']
    ];
    for (const [path, method] of paths) {
        const { response } = await request(path, {
            method,
            ...(method !== 'GET' ? { body: '{}' } : {})
        });
        assert.equal(response.status, 401, `${method} ${path} must require authentication`);
    }
});

// [GỠ API CŨ] Các namespace phiếu mượn, thủ thư và tiền phạt không còn được đăng ký.
test('legacy circulation endpoints are no longer registered', async () => {
    for (const path of ['/api/v1/borrow-cards', '/api/v1/librarians', '/api/v1/fines']) {
        const { response, body } = await request(path);
        assert.equal(response.status, 404);
        assert.equal(body.status, 'error');
    }
});
