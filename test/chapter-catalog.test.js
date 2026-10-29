import test from 'node:test';
import assert from 'node:assert/strict';
import Chapter from '../src/models/chapter.model.js';
import { getReadableChapterAccessLevels } from '../src/controllers/chapter.controller.js';
import { getReadableChapters } from '../src/services/chapter.service.js';

test('chapter catalog access levels match active user entitlements', () => {
    assert.deepEqual(getReadableChapterAccessLevels({
        hasActivePremium: () => false,
        hasActiveVip: () => false
    }), ['free']);
    assert.deepEqual(getReadableChapterAccessLevels({
        hasActivePremium: () => true,
        hasActiveVip: () => false
    }), ['free', 'premium']);
    assert.deepEqual(getReadableChapterAccessLevels({
        hasActivePremium: () => true,
        hasActiveVip: () => true
    }), ['free', 'premium', 'vip']);
    assert.deepEqual(getReadableChapterAccessLevels(null), []);
});

test('readable chapter query is scoped to book/access and excludes content', async () => {
    const originalFind = Chapter.find;
    const originalCountDocuments = Chapter.countDocuments;
    let capturedQuery;
    let selectedFields;
    let skipped;
    let limited;

    const query = {
        select(fields) {
            selectedFields = fields;
            return this;
        },
        sort() {
            return this;
        },
        skip(value) {
            skipped = value;
            return this;
        },
        limit(value) {
            limited = value;
            return this;
        },
        lean: async () => [{ _id: 'chapter-1', title: 'Chapter 1' }]
    };
    Chapter.find = (filter) => {
        capturedQuery = filter;
        return query;
    };
    Chapter.countDocuments = async () => 21;

    try {
        const result = await getReadableChapters('book-1', ['free', 'premium'], { page: 2, limit: 10 });
        assert.deepEqual(capturedQuery, {
            book_id: 'book-1',
            access_level: { $in: ['free', 'premium'] }
        });
        assert.equal(selectedFields.includes('content'), false);
        assert.equal(skipped, 10);
        assert.equal(limited, 10);
        assert.deepEqual(result.pagination, { total: 21, page: 2, limit: 10, totalPages: 3 });
    } finally {
        Chapter.find = originalFind;
        Chapter.countDocuments = originalCountDocuments;
    }
});
