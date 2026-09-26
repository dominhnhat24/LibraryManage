import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

test('MongoDB-backed reader borrowing and librarian return workflow', {
    skip: process.env.RUN_DB_INTEGRATION !== '1'
}, async () => {
    assert.ok(process.env.MONGODB_URI, 'MONGODB_URI is required for database integration tests');
    process.env.JWT_SECRET ||= randomBytes(32).toString('base64url');

    const mongoose = (await import('mongoose')).default;
    const { Books, BookCopy, BorrowCards, Fines, Librarians, Readers } = await import('../src/models/init.js');
    const { app } = await import('../server.js');
    const { createLibrarian } = await import('../src/services/librarian.service.js');

    const runId = randomUUID();
    const readerEmail = `reader-${runId}@example.test`;
    const librarianEmail = `librarian-${runId}@example.test`;
    const password = `test-${runId}`;
    const readerIds = [];
    const librarianIds = [];
    const bookIds = [];
    const copyIds = [];
    const cardIds = [];
    const fineIds = [];
    let server;

    const api = async (path, { token, method = 'GET', body } = {}) => fetch(
        `http://127.0.0.1:${server.address().port}${path}`,
        {
            method,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
                ...(body ? { 'content-type': 'application/json' } : {})
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        }
    );
    const readJson = async (response) => response.json();

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        server = app.listen(0);
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });

        const librarian = await createLibrarian({
            user_name: `librarian-${runId}`,
            email: librarianEmail,
            password,
            full_name: 'Integration Test Librarian'
        });
        librarianIds.push(librarian._id);

        const registerResponse = await api('/api/v1/auth/register', {
            method: 'POST',
            body: { full_name: 'Integration Test Reader', email: readerEmail, password }
        });
        assert.equal(registerResponse.status, 201);
        const registeredReader = (await readJson(registerResponse)).data;
        readerIds.push(registeredReader.id);
        assert.equal(registeredReader.role, 'reader');

        await assert.rejects(
            createLibrarian({
                user_name: `duplicate-${runId}`,
                email: readerEmail,
                password,
                full_name: 'Duplicate Email Librarian'
            }),
            (error) => error.statusCode === 409
        );

        const duplicateReaderResponse = await api('/api/v1/auth/register', {
            method: 'POST',
            body: { full_name: 'Duplicate Email Reader', email: librarianEmail, password }
        });
        assert.equal(duplicateReaderResponse.status, 400);

        const readerLoginResponse = await api('/api/v1/auth/login', {
            method: 'POST',
            body: { email: readerEmail, password }
        });
        assert.equal(readerLoginResponse.status, 200);
        const readerLogin = (await readJson(readerLoginResponse)).data;
        assert.equal(readerLogin.role, 'reader');

        const librarianLoginResponse = await api('/api/v1/auth/login', {
            method: 'POST',
            body: { email: librarianEmail, password }
        });
        assert.equal(librarianLoginResponse.status, 200);
        const librarianLogin = (await readJson(librarianLoginResponse)).data;
        assert.equal(librarianLogin.role, 'librarian');

        const librarianProfile = await api('/api/v1/librarians/me', { token: librarianLogin.accessToken });
        assert.equal(librarianProfile.status, 200);
        assert.ok(!Object.hasOwn((await readJson(librarianProfile)).data, 'hash_pass'));
        const profileUpdate = await api('/api/v1/librarians/me', {
            token: librarianLogin.accessToken,
            method: 'PUT',
            body: { full_name: 'Updated Integration Librarian' }
        });
        assert.equal(profileUpdate.status, 200);

        const managedLibrarianResponse = await api('/api/v1/librarians', {
            token: librarianLogin.accessToken,
            method: 'POST',
            body: {
                user_name: `managed-${runId}`,
                email: `managed-${runId}@example.test`,
                password,
                full_name: 'Managed Integration Librarian'
            }
        });
        assert.equal(managedLibrarianResponse.status, 201);
        const managedLibrarian = (await readJson(managedLibrarianResponse)).data;
        librarianIds.push(managedLibrarian._id);
        assert.ok(!Object.hasOwn(managedLibrarian, 'hash_pass'));
        const managedLibrarianDetail = await api(`/api/v1/librarians/${managedLibrarian._id}`, {
            token: librarianLogin.accessToken
        });
        assert.equal(managedLibrarianDetail.status, 200);
        const updateManagedLibrarian = await api(`/api/v1/librarians/${managedLibrarian._id}`, {
            token: librarianLogin.accessToken,
            method: 'PUT',
            body: { full_name: 'Updated Managed Librarian' }
        });
        assert.equal(updateManagedLibrarian.status, 200);
        const blockManagedLibrarian = await api(`/api/v1/librarians/${managedLibrarian._id}/block`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(blockManagedLibrarian.status, 200);
        const blockedLogin = await api('/api/v1/auth/login', {
            method: 'POST',
            body: { email: managedLibrarian.email, password }
        });
        assert.equal(blockedLogin.status, 403);

        const managedReaderResponse = await api('/api/v1/readers', {
            token: librarianLogin.accessToken,
            method: 'POST',
            body: {
                full_name: 'Managed Integration Reader',
                email: `managed-reader-${runId}@example.test`,
                phone: '0900000000',
                address: 'Integration test'
            }
        });
        assert.equal(managedReaderResponse.status, 201);
        const managedReader = (await readJson(managedReaderResponse)).data;
        readerIds.push(managedReader._id);
        const managedReaderDetail = await api(`/api/v1/readers/${managedReader._id}`, {
            token: librarianLogin.accessToken
        });
        assert.equal(managedReaderDetail.status, 200);
        const updateManagedReader = await api(`/api/v1/readers/${managedReader._id}`, {
            token: librarianLogin.accessToken,
            method: 'PUT',
            body: { phone: '0911111111' }
        });
        assert.equal(updateManagedReader.status, 200);
        const deleteManagedReader = await api(`/api/v1/readers/${managedReader._id}`, {
            token: librarianLogin.accessToken,
            method: 'DELETE'
        });
        assert.equal(deleteManagedReader.status, 200);

        const managedBookResponse = await api('/api/v1/books', {
            token: librarianLogin.accessToken,
            method: 'POST',
            body: { title: `CRUD Test Book ${runId}`, author: 'Integration Test', publish_year: 2026 }
        });
        assert.equal(managedBookResponse.status, 201);
        const managedBook = (await readJson(managedBookResponse)).data;
        bookIds.push(managedBook._id);
        const managedCopiesResponse = await api('/api/v1/book-copies', {
            token: librarianLogin.accessToken,
            method: 'POST',
            body: { bookId: managedBook._id, quantity: 2 }
        });
        assert.equal(managedCopiesResponse.status, 201);
        const managedCopies = (await readJson(managedCopiesResponse)).data;
        copyIds.push(...managedCopies.map((copy) => copy._id));
        const managedBookDetail = await api(`/api/v1/books/${managedBook._id}`);
        assert.equal(managedBookDetail.status, 200);
        assert.equal((await readJson(managedBookDetail)).data.copies.length, 2);
        const managedBookUpdate = await api(`/api/v1/books/${managedBook._id}`, {
            token: librarianLogin.accessToken,
            method: 'PUT',
            body: { title: `Updated CRUD Test Book ${runId}` }
        });
        assert.equal(managedBookUpdate.status, 200);
        const managedCopiesList = await api(`/api/v1/book-copies?bookId=${managedBook._id}`);
        assert.equal(managedCopiesList.status, 200);
        const managedCopyUpdate = await api(`/api/v1/book-copies/${managedCopies[0]._id}`, {
            token: librarianLogin.accessToken,
            method: 'PUT',
            body: { status: 'Maintenance' }
        });
        assert.equal(managedCopyUpdate.status, 200);
        const managedBookDeleteBlocked = await api(`/api/v1/books/${managedBook._id}`, {
            token: librarianLogin.accessToken,
            method: 'DELETE'
        });
        assert.equal(managedBookDeleteBlocked.status, 409);
        for (const copy of managedCopies) {
            const deleteCopyResponse = await api(`/api/v1/book-copies/${copy._id}`, {
                token: librarianLogin.accessToken,
                method: 'DELETE'
            });
            assert.equal(deleteCopyResponse.status, 200);
        }
        const deleteManagedBook = await api(`/api/v1/books/${managedBook._id}`, {
            token: librarianLogin.accessToken,
            method: 'DELETE'
        });
        assert.equal(deleteManagedBook.status, 200);

        const otherReader = await Readers.create({
            full_name: 'Other Integration Reader',
            email: `other-${runId}@example.test`,
            password_hash: await bcrypt.hash(password, 10)
        });
        readerIds.push(otherReader._id);
        const otherReaderToken = jwt.sign(
            { id: otherReader._id.toString(), role: 'reader' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const book = await Books.create({
            title: `Integration Test Book ${runId}`,
            author: 'Integration Test',
            publish_year: 2026
        });
        bookIds.push(book._id);
        const copies = await BookCopy.insertMany(
            Array.from({ length: 5 }, () => ({ bookId: book._id, status: 'Available' }))
        );
        copyIds.push(...copies.map((copy) => copy._id));
        const bookDetailResponse = await api(`/api/v1/books/${book._id}`);
        assert.equal(bookDetailResponse.status, 200);
        const bookDetail = (await readJson(bookDetailResponse)).data;
        assert.equal(bookDetail._id, book._id.toString());
        assert.equal(bookDetail.copies.length, 5);

        const createResponse = await api('/api/v1/borrow-cards', {
            token: readerLogin.accessToken,
            method: 'POST',
            body: {
                readerId: otherReader._id.toString(),
                copyIds: copies.slice(0, 2).map((copy) => copy._id.toString()),
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
            }
        });
        assert.equal(createResponse.status, 201);
        const card = (await readJson(createResponse)).data;
        cardIds.push(card._id);
        assert.equal(card.readerId, registeredReader.id);
        assert.equal(card.status, 'Pending');

        const outsiderCardResponse = await api(`/api/v1/borrow-cards/${card._id}`, {
            token: otherReaderToken
        });
        assert.equal(outsiderCardResponse.status, 403);
        const outsiderCardList = await api('/api/v1/borrow-cards', { token: otherReaderToken });
        assert.equal(outsiderCardList.status, 200);
        assert.ok(!(await readJson(outsiderCardList)).data.data.some((item) => item._id === card._id));

        const ownerCardList = await api('/api/v1/borrow-cards', { token: readerLogin.accessToken });
        assert.equal(ownerCardList.status, 200);
        assert.ok((await readJson(ownerCardList)).data.data.some((item) => item._id === card._id));

        const approveResponse = await api(`/api/v1/borrow-cards/${card._id}/approve`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(approveResponse.status, 200);
        assert.equal((await readJson(approveResponse)).data.status, 'Borrowing');
        assert.deepEqual(
            await BookCopy.find({ _id: { $in: copies.slice(0, 2).map((copy) => copy._id) } })
                .distinct('status'),
            ['Borrowed']
        );

        const repeatedApproval = await api(`/api/v1/borrow-cards/${card._id}/approve`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(repeatedApproval.status, 409);

        await BorrowCards.updateOne({ _id: card._id }, { dueDate: new Date(Date.now() - 2 * 86400000) });
        const firstCopyId = copies[0]._id.toString();
        const firstReturnResponse = await api(`/api/v1/borrow-cards/${card._id}/return`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { returns: [{ copyId: firstCopyId, condition: 'Good' }] }
        });
        assert.equal(firstReturnResponse.status, 200);
        assert.equal((await readJson(firstReturnResponse)).data.status, 'Overdue');
        assert.equal((await BookCopy.findById(copies[0]._id)).status, 'Available');

        const repeatedReturn = await api(`/api/v1/borrow-cards/${card._id}/return`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { returns: [{ copyId: firstCopyId, condition: 'Good' }] }
        });
        assert.equal(repeatedReturn.status, 409);

        const outsideCopyReturn = await api(`/api/v1/borrow-cards/${card._id}/return`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { returns: [{ copyId: copies[2]._id.toString(), condition: 'Good' }] }
        });
        assert.equal(outsideCopyReturn.status, 400);

        const secondReturnResponse = await api(`/api/v1/borrow-cards/${card._id}/return`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { returns: [{ copyId: copies[1]._id.toString(), condition: 'Lost' }] }
        });
        assert.equal(secondReturnResponse.status, 200);
        assert.equal((await readJson(secondReturnResponse)).data.status, 'Returned');
        assert.equal((await BookCopy.findById(copies[1]._id)).status, 'Lost');

        const cardFines = await Fines.find({ borrowCardId: card._id }).sort({ reason: 1 });
        fineIds.push(...cardFines.map((fine) => fine._id));
        assert.equal(cardFines.length, 2);
        assert.ok(cardFines.every((fine) => fine.status === 'Pending' && fine.amount > 0));

        const outsiderFineResponse = await api(`/api/v1/fines/${cardFines[0]._id}`, {
            token: otherReaderToken
        });
        assert.equal(outsiderFineResponse.status, 403);
        const outsiderFineList = await api('/api/v1/fines', { token: otherReaderToken });
        assert.equal(outsiderFineList.status, 200);
        assert.equal((await readJson(outsiderFineList)).data.data.length, 0);

        const borrowWithDebtResponse = await api('/api/v1/borrow-cards', {
            token: readerLogin.accessToken,
            method: 'POST',
            body: {
                copyIds: [copies[2]._id.toString()],
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
            }
        });
        assert.equal(borrowWithDebtResponse.status, 400);

        const payResponse = await api(`/api/v1/fines/${cardFines[0]._id}/pay`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(payResponse.status, 200);
        assert.equal((await readJson(payResponse)).data.status, 'Paid');

        const waiveResponse = await api(`/api/v1/fines/${cardFines[1]._id}/waive`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { waiverReason: 'Integration test waiver' }
        });
        assert.equal(waiveResponse.status, 200);
        assert.equal((await readJson(waiveResponse)).data.status, 'Waived');

        const damagedCardResponse = await api('/api/v1/borrow-cards', {
            token: readerLogin.accessToken,
            method: 'POST',
            body: {
                copyIds: [copies[2]._id.toString()],
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
            }
        });
        assert.equal(damagedCardResponse.status, 201);
        const damagedCard = (await readJson(damagedCardResponse)).data;
        cardIds.push(damagedCard._id);
        const damagedApproval = await api(`/api/v1/borrow-cards/${damagedCard._id}/approve`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(damagedApproval.status, 200);
        const damagedReturn = await api(`/api/v1/borrow-cards/${damagedCard._id}/return`, {
            token: librarianLogin.accessToken,
            method: 'PATCH',
            body: { returns: [{ copyId: copies[2]._id.toString(), condition: 'Damaged' }] }
        });
        assert.equal(damagedReturn.status, 200);
        assert.equal((await BookCopy.findById(copies[2]._id)).status, 'Damaged');
        const damagedFine = await Fines.findOne({ borrowCardId: damagedCard._id });
        assert.ok(damagedFine);
        fineIds.push(damagedFine._id);
        assert.equal(damagedFine.reason, 'Damaged');
        assert.equal(damagedFine.status, 'Pending');
        const damagedFinePay = await api(`/api/v1/fines/${damagedFine._id}/pay`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(damagedFinePay.status, 200);

        const cancelCardResponse = await api('/api/v1/borrow-cards', {
            token: readerLogin.accessToken,
            method: 'POST',
            body: {
                copyIds: [copies[3]._id.toString()],
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
            }
        });
        assert.equal(cancelCardResponse.status, 201);
        const cancelCard = (await readJson(cancelCardResponse)).data;
        cardIds.push(cancelCard._id);
        const cancelResponse = await api(`/api/v1/borrow-cards/${cancelCard._id}/cancel`, {
            token: readerLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(cancelResponse.status, 200);
        assert.equal((await readJson(cancelResponse)).data.status, 'Cancelled');
        assert.equal((await BookCopy.findById(copies[3]._id)).status, 'Available');

        const createRollbackCardResponse = await api('/api/v1/borrow-cards', {
            token: readerLogin.accessToken,
            method: 'POST',
            body: {
                copyIds: copies.slice(3, 5).map((copy) => copy._id.toString()),
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
            }
        });
        assert.equal(createRollbackCardResponse.status, 201);
        const rollbackCard = (await readJson(createRollbackCardResponse)).data;
        cardIds.push(rollbackCard._id);

        const rollbackCardDocument = await BorrowCards.findById(rollbackCard._id);
        const approvalDebt = await Fines.create({
            borrowCardId: rollbackCard._id,
            detailId: rollbackCardDocument.details[0]._id,
            readerId: registeredReader.id,
            amount: 1,
            reason: 'Overdue',
            status: 'Pending'
        });
        fineIds.push(approvalDebt._id);
        const approvalBlockedByDebt = await api(`/api/v1/borrow-cards/${rollbackCard._id}/approve`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(approvalBlockedByDebt.status, 400);
        assert.equal((await BorrowCards.findById(rollbackCard._id)).status, 'Pending');
        assert.equal((await BookCopy.findById(copies[3]._id)).status, 'Available');

        const payApprovalDebt = await api(`/api/v1/fines/${approvalDebt._id}/pay`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(payApprovalDebt.status, 200);
        await BookCopy.updateOne({ _id: copies[4]._id }, { status: 'Borrowed' });

        const failedApproval = await api(`/api/v1/borrow-cards/${rollbackCard._id}/approve`, {
            token: librarianLogin.accessToken,
            method: 'PATCH'
        });
        assert.equal(failedApproval.status, 409);
        assert.equal((await BorrowCards.findById(rollbackCard._id)).status, 'Pending');
        assert.equal((await BookCopy.findById(copies[3]._id)).status, 'Available');
    } finally {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
        if (mongoose.connection.readyState !== 0) {
            try {
                if (cardIds.length) {
                    await Fines.deleteMany({
                        $or: [
                            { _id: { $in: fineIds } },
                            { borrowCardId: { $in: cardIds } }
                        ]
                    });
                }
                if (cardIds.length) await BorrowCards.deleteMany({ _id: { $in: cardIds } });
                if (copyIds.length) await BookCopy.deleteMany({ _id: { $in: copyIds } });
                if (bookIds.length) await Books.deleteMany({ _id: { $in: bookIds } });
                if (readerIds.length) await Readers.deleteMany({ _id: { $in: readerIds } });
                if (librarianIds.length) await Librarians.deleteMany({ _id: { $in: librarianIds } });
            } finally {
                await mongoose.disconnect();
            }
        }
    }
});
