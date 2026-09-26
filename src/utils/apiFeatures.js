export const getPaginationAndFilter = (queryParams, searchableFields = []) => {
    // 1. Phân trang
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Xử lý Tìm kiếm động (Search) trên nhiều trường
    const filter = {};
    if (queryParams.search && searchableFields.length > 0) {
        filter.$or = searchableFields.map((field) => ({
            [field]: { $regex: queryParams.search, $options: 'i' }
        }));
    }

    // 3. Xử lý sắp xếp (Sort) - mặc định mới nhất lên đầu
    let sort = { createdAt: -1 };
    if (queryParams.sortBy) {
        const parts = queryParams.sortBy.split(':'); // Ví dụ: price:asc hoặc price:desc
        sort = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
    }

    return { filter, skip, limit, page, sort };
};