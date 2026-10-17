import slugifyPackage from 'slugify';

// Hàm slugify: Chuẩn hóa tiêu đề thành slug URL an toàn, bỏ dấu tiếng Việt và ký tự không phù hợp.
export const slugify = (value) => slugifyPackage(
    String(value).replace(/[đĐ]/g, (character) => character === 'Đ' ? 'D' : 'd'),
    {
        lower: true,
        strict: true,
        trim: true
    }
);

// Hàm createUniqueSlug: Tạo slug duy nhất bằng cách thêm hậu tố tăng dần khi slug đã tồn tại.
export const createUniqueSlug = async (Model, title, currentId = null) => {
    const baseSlug = slugify(title) || 'resource';
    let candidate = baseSlug;
    let suffix = 1;
    while (await Model.exists({
        slug: candidate,
        ...(currentId ? { _id: { $ne: currentId } } : {})
    })) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
    return candidate;
};