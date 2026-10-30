// Hàm toPlainObject: Chuyển Mongoose document sang object thuần trước khi ánh xạ trường API.
/**
 * Hàm toPlainObject: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toObject.
 */
/**
 * Tệp src/utils/api-dto.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
const toPlainObject = (value) => {
    // if chỉ chạy nhánh này khi điều kiện value && typeof value.toObject === 'function' đúng.
    if (value && typeof value.toObject === 'function') return value.toObject();
    // return kết thúc hàm và trả value về nơi gọi.
    return value;
};

// Hàm pick: Tạo object mới chỉ từ allowlist để tránh rò rỉ thuộc tính nội bộ của model.
/**
 * Hàm pick: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value, fields.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, fromEntries, filter, map.
 */
const pick = (value, fields) => {
    // Khai báo source nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const source = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !source || typeof source !== 'object' đúng.
    if (!source || typeof source !== 'object') return source ?? null;
    // return kết thúc hàm và trả Object.fromEntries(fields .filter((field) => source[field] !== undefined) . về nơi gọi.
    return Object.fromEntries(fields
        .filter((field) => source[field] !== undefined)
        .map((field) => [field, source[field]]));
};

// Hàm reference: Giữ ObjectId dạng chuỗi hoặc lọc document populate theo allowlist tham chiếu.
/**
 * Hàm reference: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value, fields.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toHexString, pick.
 */
const reference = (value, fields) => {
    // if chỉ chạy nhánh này khi điều kiện value == null đúng.
    if (value == null) return value;
    // if chỉ chạy nhánh này khi điều kiện typeof value !== 'object' || value instanceof Date đúng.
    if (typeof value !== 'object' || value instanceof Date) return value;
    // if chỉ chạy nhánh này khi điều kiện typeof value.toHexString === 'function' đúng.
    if (typeof value.toHexString === 'function') return value.toHexString();
    // return kết thúc hàm và trả pick(value, fields) về nơi gọi.
    return pick(value, fields);
};

// Khai báo identityFields nhận giá trị từ ['_id', 'id', 'createdAt', 'updatedAt']. const giữ biến không gán lại; let cho phép cập nhật.
const identityFields = ['_id', 'id', 'createdAt', 'updatedAt'];
// Khai báo userReferenceFields nhận giá trị từ ['_id', 'id', 'name', 'email', 'role']. const giữ biến không gán lại; let cho phép cập nhật.
const userReferenceFields = ['_id', 'id', 'name', 'email', 'role'];

// Hàm toUserDto: Chuyển user thành DTO an toàn, tính entitlement hiệu lực và loại password/token hash.
/**
 * Hàm toUserDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, toPublicJSON, Date, pick, Boolean.
 */
export const toUserDto = (value) => {
    // Khai báo user nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const user = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) return null;
    // if chỉ chạy nhánh này khi điều kiện typeof user.toPublicJSON === 'function' đúng.
    if (typeof user.toPublicJSON === 'function') return user.toPublicJSON();

    // Khai báo activePremium nhận giá trị từ user.role === 'ADMIN' || (user.is_premium && user.premi. const giữ biến không gán lại; let cho phép cập nhật.
    const activePremium = user.role === 'ADMIN' || (user.is_premium
        && user.premium_expires_at && new Date(user.premium_expires_at) > new Date());
    // Khai báo activeVip nhận giá trị từ user.role === 'ADMIN' || activePremium || (user.is_vip . const giữ biến không gán lại; let cho phép cập nhật.
    const activeVip = user.role === 'ADMIN' || activePremium || (user.is_vip
        && user.vip_expires_at && new Date(user.vip_expires_at) > new Date());
    // return kết thúc hàm và trả { ...pick(user, [...identityFields, 'name', 'email', 'phone_number', 'avata về nơi gọi.
    return {
        ...pick(user, [...identityFields, 'name', 'email', 'phone_number', 'avatar_url', 'role']),
        // Trường is_vip lưu Boolean(activeVip) làm giá trị trong object.
        is_vip: Boolean(activeVip),
        // Trường vip_expires_at lưu activeVip && user.role !== 'ADMIN' ? (activePremium ? u làm giá trị trong object.
        vip_expires_at: activeVip && user.role !== 'ADMIN' ? (activePremium ? user.premium_expires_at : user.vip_expires_at) : null,
        // Trường is_premium lưu Boolean(activePremium) làm giá trị trong object.
        is_premium: Boolean(activePremium),
        // Trường premium_expires_at lưu activePremium && user.role !== 'ADMIN' ? user.premium_e làm giá trị trong object.
        premium_expires_at: activePremium && user.role !== 'ADMIN'
            ? user.premium_expires_at : null
    };
};

// Hàm toBookDto: Chỉ xuất metadata sách được phép công khai và loại file key/tên file nội bộ.
/**
 * Hàm toBookDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value, { publicView = false, canReadPaid = fals mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference, String, isArray, map, toChapterDto.
 */
export const toBookDto = (value, { publicView = false, canReadPaid = false } = {}) => {
    // Khai báo book nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const book = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !book đúng.
    if (!book) return null;
    // Khai báo dto nhận giá trị từ pick(book, [ ...identityFields, 'title', 'slug', 'autho. const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(book, [
        ...identityFields, 'title', 'slug', 'author_name', 'category', 'genre', 'publication_year',
        'description', 'cover_url', 'access_level', 'owner', 'status', 'import_source',
        'source_id', 'source_url', 'license_name', 'license_url', 'cover_source_url',
        'cover_license_name', 'cover_license_url', 'cover_attribution', 'language', 'file_format',
        'file_size', 'verified_at'
    ]);
    // if chỉ chạy nhánh này khi điều kiện dto.owner !== undefined đúng.
    if (dto.owner !== undefined) dto.owner = reference(dto.owner, userReferenceFields);
    // if chỉ chạy nhánh này khi điều kiện publicView đúng.
    if (publicView) {
        // Gọi/thực thi biểu thức để thực hiện thao tác: dto.author = dto.author_name
        dto.author = dto.author_name;
        // Gọi/thực thi biểu thức để thực hiện thao tác: dto.coverImage = dto.cover_url
        dto.coverImage = dto.cover_url;
        // Gọi/thực thi String với các đối số để thực hiện thao tác: dto.publishedAt = dto.publication_year ? String(dto.publication_year) : dto
        dto.publishedAt = dto.publication_year ? String(dto.publication_year) : dto.createdAt;
    }
    // if chỉ chạy nhánh này khi điều kiện Array.isArray(book.chapters) đúng.
    if (Array.isArray(book.chapters)) {
        // Gọi/thực thi book.chapters.map với các đối số để thực hiện thao tác: dto.chapters = book.chapters.map((chapter) => { const chapterDto = toChapte
        dto.chapters = book.chapters.map((chapter) => {
            // Khai báo chapterDto nhận giá trị từ toChapterDto(chapter). const giữ biến không gán lại; let cho phép cập nhật.
            const chapterDto = toChapterDto(chapter);
            // if chỉ chạy nhánh này khi điều kiện publicView && book.access_level !== 'free' && !canReadPaid đúng.
            if (publicView && book.access_level !== 'free' && !canReadPaid) {
                // Gọi/thực thi biểu thức để thực hiện thao tác: delete chapterDto.content
                delete chapterDto.content;
                // Gọi/thực thi biểu thức để thực hiện thao tác: chapterDto.locked = true
                chapterDto.locked = true;
            }
            // return kết thúc hàm và trả chapterDto về nơi gọi.
            return chapterDto;
        });
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toChapterDto: Ánh xạ chương cùng sách cha đã populate, không trả thuộc tính Mongoose nội bộ.
/**
 * Hàm toChapterDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toChapterDto = (value) => {
    // Khai báo chapter nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) return null;
    // Khai báo dto nhận giá trị từ pick(chapter, [ ...identityFields, 'book_id', 'title', . const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(chapter, [
        ...identityFields, 'book_id', 'title', 'slug', 'content',
        'chapter_number', 'access_level', 'published_at'
    ]);
    // if chỉ chạy nhánh này khi điều kiện dto.book_id !== undefined đúng.
    if (dto.book_id !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.book_id = reference(dto.book_id, [...identityFields, 'title', 'slug', '
        dto.book_id = reference(dto.book_id, [...identityFields, 'title', 'slug', 'category', 'cover_url']);
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toSubscriptionDto: Chuyển thuê bao và user/người duyệt sang DTO không để lộ trường schema ngoài API.
/**
 * Hàm toSubscriptionDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toSubscriptionDto = (value) => {
    // Khai báo subscription nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) return null;
    // Khai báo dto nhận giá trị từ pick(subscription, [ ...identityFields, 'plan', 'amount. const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(subscription, [
        ...identityFields, 'plan', 'amount_vnd', 'status', 'starts_at', 'expires_at',
        'payment_reference', 'transfer_note', 'user', 'reviewed_by'
    ]);
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const field of ['user', 'reviewed_by']) {
        // if chỉ chạy nhánh này khi điều kiện dto[field] !== undefined đúng.
        if (dto[field] !== undefined) dto[field] = reference(dto[field], userReferenceFields);
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toCommentDto: Chỉ trả nội dung bình luận, rating và hồ sơ công khai của tác giả/sách.
/**
 * Hàm toCommentDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toCommentDto = (value) => {
    // Khai báo comment nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const comment = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !comment đúng.
    if (!comment) return null;
    // Khai báo dto nhận giá trị từ pick(comment, [...identityFields, 'body', 'rating', 'bo. const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(comment, [...identityFields, 'body', 'rating', 'book', 'user']);
    // if chỉ chạy nhánh này khi điều kiện dto.user !== undefined đúng.
    if (dto.user !== undefined) dto.user = reference(dto.user, userReferenceFields);
    // if chỉ chạy nhánh này khi điều kiện dto.book !== undefined đúng.
    if (dto.book !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.book = reference(dto.book, [...identityFields, 'title', 'slug'])
        dto.book = reference(dto.book, [...identityFields, 'title', 'slug']);
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toBookmarkDto: Trả liên kết bookmark và thông tin sách/chương cần thiết mà không lộ dữ liệu owner.
/**
 * Hàm toBookmarkDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toBookmarkDto = (value) => {
    // Khai báo bookmark nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !bookmark đúng.
    if (!bookmark) return null;
    // Khai báo dto nhận giá trị từ pick(bookmark, [...identityFields, 'book', 'chapter']). const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(bookmark, [...identityFields, 'book', 'chapter']);
    // if chỉ chạy nhánh này khi điều kiện dto.book !== undefined đúng.
    if (dto.book !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.book = reference(dto.book, [...identityFields, 'title', 'author_name',
        dto.book = reference(dto.book, [...identityFields, 'title', 'author_name', 'slug', 'cover_url']);
    }
    // if chỉ chạy nhánh này khi điều kiện dto.chapter !== undefined đúng.
    if (dto.chapter !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.chapter = reference(dto.chapter, [...identityFields, 'title', 'slug', '
        dto.chapter = reference(dto.chapter, [...identityFields, 'title', 'slug', 'chapter_number']);
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toReadingProgressDto: Trả bộ đếm tiến độ đọc và metadata sách, nhưng không xuất ID chủ sở hữu.
/**
 * Hàm toReadingProgressDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toReadingProgressDto = (value) => {
    // Khai báo progress nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const progress = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) return null;
    // Khai báo dto nhận giá trị từ pick(progress, [ ...identityFields, 'book', 'chapters_s. const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(progress, [
        ...identityFields, 'book', 'chapters_since_ad', 'total_chapter_reads',
        'completed_chapter_count', 'completed_chapters_since_ad', 'last_read_chapter'
    ]);
    // if chỉ chạy nhánh này khi điều kiện dto.book !== undefined đúng.
    if (dto.book !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.book = reference(dto.book, [...identityFields, 'title', 'author_name',
        dto.book = reference(dto.book, [...identityFields, 'title', 'author_name', 'slug', 'cover_url']);
    }
    // if chỉ chạy nhánh này khi điều kiện dto.last_read_chapter !== undefined đúng.
    if (dto.last_read_chapter !== undefined) {
        // Gọi/thực thi reference với các đối số để thực hiện thao tác: dto.last_read_chapter = reference(dto.last_read_chapter, [...identityFields
        dto.last_read_chapter = reference(dto.last_read_chapter,
            [...identityFields, 'title', 'slug', 'chapter_number', 'access_level']);
    }
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm toReportDto: Chỉ trả trường nghiệp vụ của báo cáo và thông tin định danh công khai người gửi.
/**
 * Hàm toReportDto: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: toPlainObject, pick, reference.
 */
export const toReportDto = (value) => {
    // Khai báo report nhận giá trị từ toPlainObject(value). const giữ biến không gán lại; let cho phép cập nhật.
    const report = toPlainObject(value);
    // if chỉ chạy nhánh này khi điều kiện !report đúng.
    if (!report) return null;
    // Khai báo dto nhận giá trị từ pick(report, [ ...identityFields, 'email', 'subject', '. const giữ biến không gán lại; let cho phép cập nhật.
    const dto = pick(report, [
        ...identityFields, 'email', 'subject', 'message', 'type', 'status', 'user'
    ]);
    // if chỉ chạy nhánh này khi điều kiện dto.user !== undefined đúng.
    if (dto.user !== undefined) dto.user = reference(dto.user, userReferenceFields);
    // return kết thúc hàm và trả dto về nơi gọi.
    return dto;
};

// Hàm mapDtoList: Áp dụng một DTO mapper cho từng phần tử của danh sách API.
/**
 * Hàm mapDtoList: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: values, mapper.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: map.
 */
export const mapDtoList = (values, mapper) => values.map(mapper);
