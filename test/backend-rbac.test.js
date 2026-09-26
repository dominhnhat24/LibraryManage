import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'backend-rbac-test-secret';
const { app } = await import('../server.js');
let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const tokenFor = (role) => jwt.sign({ id: '507f1f77bcf86cd799439011', role }, process.env.JWT_SECRET);

const request = (path, { role, method = 'GET', body } = {}) => fetch(`${baseUrl}${path}`, {
    method,
    headers: {
        ...(role ? { authorization: `Bearer ${tokenFor(role)}` } : {}),
        ...(body ? { 'content-type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
});

test('reader records require authentication and Librarian role', async () => {
    assert.equal((await request('/api/v1/readers')).status, 401);
    assert.equal((await request('/api/v1/readers', { role: 'reader' })).status, 403);
    assert.equal((await request('/api/v1/readers', { role: 'ADMIN', method: 'POST', body: {} })).status, 400);
    const missingPassword = await request('/api/v1/readers', {
        role: 'librarian',
        method: 'POST',
        body: { full_name: 'New Reader', email: 'reader@example.com' }
    });
    assert.equal(missingPassword.status, 400);
    const validation = await missingPassword.json();
    assert.ok(validation.violations.some(({ path }) => path === 'password'));
});

test('book and book-copy mutations require a Librarian token', async () => {
    const bookId = '507f1f77bcf86cd799439011';
    const copyId = '507f1f77bcf86cd799439012';
    const mutations = [
        ['/api/v1/books', 'POST', {}],
        [`/api/v1/books/${bookId}`, 'PUT', {}],
        [`/api/v1/books/${bookId}`, 'DELETE'],
        ['/api/v1/book-copies', 'POST', {}],
        [`/api/v1/book-copies/${copyId}`, 'PUT', {}],
        [`/api/v1/book-copies/${copyId}`, 'DELETE']
    ];
    for (const [path, method, body] of mutations) {
        assert.equal((await request(path, { method, body })).status, 401, `${method} ${path} should require login`);
        assert.equal((await request(path, { role: 'reader', method, body })).status, 403, `${method} ${path} should require librarian role`);
    }
});

test('Librarian management is not accessible to readers', async () => {
    assert.equal((await request('/api/v1/librarians')).status, 401);
    assert.equal((await request('/api/v1/librarians', { role: 'reader' })).status, 403);
});

test('dashboard summary requires an authenticated Librarian', async () => {
    assert.equal((await request('/api/v1/dashboard')).status, 401);
    assert.equal((await request('/api/v1/dashboard', { role: 'reader' })).status, 403);
});

test('borrow-card creation accepts librarian authorization and validates input', async () => {
    const response = await request('/api/v1/borrow-cards', {
        role: 'librarian',
        method: 'POST',
        body: {}
    });
    assert.equal(response.status, 400);
    const result = await response.json();
    assert.equal(result.status, 'error');
    assert.equal(result.message, 'Request validation failed');
    assert.equal((await request('/api/v1/borrow-cards/507f1f77bcf86cd799439011/cancel', {
        role: 'librarian',
        method: 'PATCH'
    })).status, 403);
});

test('approval, return, payment, and waiver actions are Librarian-only', async () => {
    const cardId = '507f1f77bcf86cd799439011';
    const fineId = '507f1f77bcf86cd799439012';
    assert.equal((await request(`/api/v1/borrow-cards/${cardId}/approve`, {
        role: 'reader',
        method: 'PATCH'
    })).status, 403);
    assert.equal((await request(`/api/v1/borrow-cards/${cardId}/return`, {
        role: 'reader',
        method: 'PATCH',
        body: { returns: [] }
    })).status, 403);
    assert.equal((await request(`/api/v1/fines/${fineId}/pay`, {
        role: 'reader',
        method: 'PATCH'
    })).status, 403);
    assert.equal((await request(`/api/v1/fines/${fineId}/waive`, {
        role: 'reader',
        method: 'PATCH',
        body: { waiverReason: 'test' }
    })).status, 403);
});

test('Librarian-only duplicate BorrowCard action namespace is removed', async () => {
    const response = await request('/api/v1/librarians/borrow-cards/507f1f77bcf86cd799439011/approve', {
        role: 'librarian',
        method: 'PATCH'
    });
    assert.equal(response.status, 404);
});

test('Auth validation uses the standard API error response', async () => {
    const response = await request('/api/v1/auth/login', {
        method: 'POST',
        body: {}
    });
    const result = await response.json();
    assert.equal(response.status, 400);
    assert.equal(result.status, 'error');
    assert.equal(result.message, 'Request validation failed');
    assert.ok(Array.isArray(result.violations));
});
