import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/user.model.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import Comment from '../src/models/comment.model.js';
import Bookmark from '../src/models/bookmarks.js';
import ReadingProgress from '../src/models/reading-progress.model.js';
import Subscription from '../src/models/subscription.model.js';
import Report from '../src/models/report.model.js';
import { deleteUser } from '../src/services/user.service.js';

test('user deletion cascades related records transactionally and clears reviewer references', async () => {
    const originals = {
        startSession: mongoose.startSession,
        userFindById: User.findById,
        userDeleteOne: User.deleteOne,
        bookFind: Book.find,
        bookDeleteMany: Book.deleteMany,
        chapterDeleteMany: Chapter.deleteMany,
        commentDeleteMany: Comment.deleteMany,
        bookmarkDeleteMany: Bookmark.deleteMany,
        progressDeleteMany: ReadingProgress.deleteMany,
        reportDeleteMany: Report.deleteMany,
        subscriptionDeleteMany: Subscription.deleteMany,
        subscriptionUpdateMany: Subscription.updateMany
    };
    const calls = [];
    const session = {
        withTransaction: async (callback) => callback(),
        endSession: async () => {}
    };
    const user = { toPublicJSON: () => ({ id: 'user-1', email: 'reader@example.com' }) };
    const ownedBooks = [{ _id: 'book-1', file_key: null }];
    const recordDelete = (name) => async (...args) => {
        calls.push({ name, args });
    };

    mongoose.startSession = async () => session;
    User.findById = () => ({ session: async () => user });
    User.deleteOne = recordDelete('user');
    Book.find = () => ({
        select() { return this; },
        session() { return this; },
        lean: async () => ownedBooks
    });
    Book.deleteMany = recordDelete('book');
    Chapter.deleteMany = recordDelete('chapter');
    Comment.deleteMany = recordDelete('comment');
    Bookmark.deleteMany = recordDelete('bookmark');
    ReadingProgress.deleteMany = recordDelete('progress');
    Report.deleteMany = recordDelete('report');
    Subscription.deleteMany = recordDelete('subscription');
    Subscription.updateMany = recordDelete('reviewer');

    try {
        const result = await deleteUser('user-1');
        assert.deepEqual(result, { id: 'user-1', email: 'reader@example.com' });
        assert.deepEqual(calls.map(({ name }) => name), [
            'chapter', 'comment', 'bookmark', 'progress', 'report',
            'subscription', 'reviewer', 'book', 'user'
        ]);
        const reviewerUpdate = calls.find(({ name }) => name === 'reviewer');
        assert.deepEqual(reviewerUpdate.args[0], { reviewed_by: 'user-1' });
        assert.deepEqual(reviewerUpdate.args[1], { $set: { reviewed_by: null } });
        const ownedDataFilter = { $or: [{ user: 'user-1' }, { book: { $in: ['book-1'] } }] };
        for (const name of ['comment', 'bookmark', 'progress']) {
            assert.deepEqual(calls.find((call) => call.name === name).args[0], ownedDataFilter);
        }
    } finally {
        mongoose.startSession = originals.startSession;
        User.findById = originals.userFindById;
        User.deleteOne = originals.userDeleteOne;
        Book.find = originals.bookFind;
        Book.deleteMany = originals.bookDeleteMany;
        Chapter.deleteMany = originals.chapterDeleteMany;
        Comment.deleteMany = originals.commentDeleteMany;
        Bookmark.deleteMany = originals.bookmarkDeleteMany;
        ReadingProgress.deleteMany = originals.progressDeleteMany;
        Report.deleteMany = originals.reportDeleteMany;
        Subscription.deleteMany = originals.subscriptionDeleteMany;
        Subscription.updateMany = originals.subscriptionUpdateMany;
    }
});
