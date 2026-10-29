// Các trạng thái nghiệp vụ được dùng trong các Model hiện tại.
export const STATUS = Object.freeze({
    BOOK: Object.freeze({
        DRAFT: 'draft',
        PUBLISHED: 'published'
    }),
    SUBSCRIPTION: Object.freeze({
        PENDING: 'pending',
        ACTIVE: 'active',
        REJECTED: 'rejected',
        EXPIRED: 'expired'
    }),
    REPORT: Object.freeze({
        OPEN: 'open',
        IN_PROGRESS: 'in_progress',
        RESOLVED: 'resolved'
    })
});
