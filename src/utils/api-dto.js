// Hàm toPlainObject: Chuyển Mongoose document sang object thuần trước khi ánh xạ trường API.
const toPlainObject = (value) => {
    if (value && typeof value.toObject === 'function') return value.toObject();
    return value;
};

// Hàm pick: Tạo object mới chỉ từ allowlist để tránh rò rỉ thuộc tính nội bộ của model.
const pick = (value, fields) => {
    const source = toPlainObject(value);
    if (!source || typeof source !== 'object') return source ?? null;
    return Object.fromEntries(fields
        .filter((field) => source[field] !== undefined)
        .map((field) => [field, source[field]]));
};

// Hàm reference: Giữ ObjectId dạng chuỗi hoặc lọc document populate theo allowlist tham chiếu.
const reference = (value, fields) => {
    if (value == null) return value;
    if (typeof value !== 'object' || value instanceof Date) return value;
    if (typeof value.toHexString === 'function') return value.toHexString();
    return pick(value, fields);
};

const identityFields = ['_id', 'id', 'createdAt', 'updatedAt'];
const userReferenceFields = ['_id', 'id', 'name', 'email', 'role'];

// Hàm toUserDto: Chuyển user thành DTO an toàn, tính entitlement hiệu lực và loại password/token hash.
export const toUserDto = (value) => {
    const user = toPlainObject(value);
    if (!user) return null;
    if (typeof user.toPublicJSON === 'function') return user.toPublicJSON();

    const activeVip = user.role === 'ADMIN' || (user.is_vip
        && user.vip_expires_at && new Date(user.vip_expires_at) > new Date());
    const activePremium = user.role === 'ADMIN' || activeVip || (user.is_premium
        && user.premium_expires_at && new Date(user.premium_expires_at) > new Date());
    return {
        ...pick(user, [...identityFields, 'name', 'email', 'phone_number', 'role']),
        is_vip: Boolean(activeVip),
        vip_expires_at: activeVip && user.role !== 'ADMIN' ? user.vip_expires_at : null,
        is_premium: Boolean(activePremium),
        premium_expires_at: activePremium && user.role !== 'ADMIN'
            ? (activeVip ? user.vip_expires_at : user.premium_expires_at) : null
    };
};

// Hàm toBookDto: Chỉ xuất metadata sách được phép công khai và loại file key/tên file nội bộ.
export const toBookDto = (value, { publicView = false, canReadPaid = false } = {}) => {
    const book = toPlainObject(value);
    if (!book) return null;
    const dto = pick(book, [
        ...identityFields, 'title', 'slug', 'author_name', 'category', 'publication_year',
        'description', 'cover_url', 'access_level', 'owner', 'status'
    ]);
    if (dto.owner !== undefined) dto.owner = reference(dto.owner, userReferenceFields);
    if (publicView) {
        dto.author = dto.author_name;
        dto.coverImage = dto.cover_url;
        dto.publishedAt = dto.publication_year ? String(dto.publication_year) : dto.createdAt;
    }
    if (Array.isArray(book.chapters)) {
        dto.chapters = book.chapters.map((chapter) => {
            const chapterDto = toChapterDto(chapter);
            if (publicView && book.access_level !== 'free' && !canReadPaid) {
                delete chapterDto.content;
                chapterDto.locked = true;
            }
            return chapterDto;
        });
    }
    return dto;
};

// Hàm toChapterDto: Ánh xạ chương cùng sách cha đã populate, không trả thuộc tính Mongoose nội bộ.
export const toChapterDto = (value) => {
    const chapter = toPlainObject(value);
    if (!chapter) return null;
    const dto = pick(chapter, [
        ...identityFields, 'book_id', 'title', 'slug', 'content',
        'chapter_number', 'access_level', 'published_at'
    ]);
    if (dto.book_id !== undefined) {
        dto.book_id = reference(dto.book_id, [...identityFields, 'title', 'slug', 'category', 'cover_url']);
    }
    return dto;
};

// Hàm toSubscriptionDto: Chuyển thuê bao và user/người duyệt sang DTO không để lộ trường schema ngoài API.
export const toSubscriptionDto = (value) => {
    const subscription = toPlainObject(value);
    if (!subscription) return null;
    const dto = pick(subscription, [
        ...identityFields, 'plan', 'amount_vnd', 'status', 'starts_at', 'expires_at',
        'payment_reference', 'transfer_note', 'user', 'reviewed_by'
    ]);
    for (const field of ['user', 'reviewed_by']) {
        if (dto[field] !== undefined) dto[field] = reference(dto[field], userReferenceFields);
    }
    return dto;
};

// Hàm toCommentDto: Chỉ trả nội dung bình luận, rating và hồ sơ công khai của tác giả/sách.
export const toCommentDto = (value) => {
    const comment = toPlainObject(value);
    if (!comment) return null;
    const dto = pick(comment, [...identityFields, 'body', 'rating', 'book', 'user']);
    if (dto.user !== undefined) dto.user = reference(dto.user, userReferenceFields);
    if (dto.book !== undefined) {
        dto.book = reference(dto.book, [...identityFields, 'title', 'slug']);
    }
    return dto;
};

// Hàm toBookmarkDto: Trả liên kết bookmark và thông tin sách/chương cần thiết mà không lộ dữ liệu owner.
export const toBookmarkDto = (value) => {
    const bookmark = toPlainObject(value);
    if (!bookmark) return null;
    const dto = pick(bookmark, [...identityFields, 'book', 'chapter']);
    if (dto.book !== undefined) {
        dto.book = reference(dto.book, [...identityFields, 'title', 'slug', 'cover_url']);
    }
    if (dto.chapter !== undefined) {
        dto.chapter = reference(dto.chapter, [...identityFields, 'title', 'slug', 'chapter_number']);
    }
    return dto;
};

// Hàm toReadingProgressDto: Trả bộ đếm tiến độ đọc và metadata sách, nhưng không xuất ID chủ sở hữu.
export const toReadingProgressDto = (value) => {
    const progress = toPlainObject(value);
    if (!progress) return null;
    const dto = pick(progress, [
        ...identityFields, 'book', 'chapters_since_ad', 'total_chapter_reads'
    ]);
    if (dto.book !== undefined) {
        dto.book = reference(dto.book, [...identityFields, 'title', 'slug', 'cover_url']);
    }
    return dto;
};

// Hàm toReportDto: Chỉ trả trường nghiệp vụ của báo cáo và thông tin định danh công khai người gửi.
export const toReportDto = (value) => {
    const report = toPlainObject(value);
    if (!report) return null;
    const dto = pick(report, [
        ...identityFields, 'email', 'subject', 'message', 'type', 'status', 'user'
    ]);
    if (dto.user !== undefined) dto.user = reference(dto.user, userReferenceFields);
    return dto;
};

// Hàm mapDtoList: Áp dụng một DTO mapper cho từng phần tử của danh sách API.
export const mapDtoList = (values, mapper) => values.map(mapper);
