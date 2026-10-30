        // Import bcrypt từ bcryptjs để dùng trong module.
        /**
         * Tệp src/services/user.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
         */
        import bcrypt from 'bcryptjs';
        // Import mongoose từ mongoose để dùng trong module.
        import mongoose from 'mongoose';
        // Import User từ ../models/user.model.js để dùng trong module.
        import User from '../models/user.model.js';
        // Import Book từ ../models/book.model.js để dùng trong module.
        import Book from '../models/book.model.js';
        // Import Chapter từ ../models/chapter.model.js để dùng trong module.
        import Chapter from '../models/chapter.model.js';
        // Import Comment từ ../models/comment.model.js để dùng trong module.
        import Comment from '../models/comment.model.js';
        // Import Bookmark từ ../models/bookmarks.js để dùng trong module.
        import Bookmark from '../models/bookmarks.js';
        // Import ReadingProgress từ ../models/reading-progress.model.js để dùng trong module.
        import ReadingProgress from '../models/reading-progress.model.js';
        // Import Subscription từ ../models/subscription.model.js để dùng trong module.
        import Subscription from '../models/subscription.model.js';
        // Import Report từ ../models/report.model.js để dùng trong module.
        import Report from '../models/report.model.js';
        // Import ApiError từ ../utils/api-error.js để dùng trong module.
        import ApiError from '../utils/api-error.js';
        // Import { removePrivateBookFile } từ ../utils/private-book-storage.js để dùng trong module.
        import { removePrivateBookFile } from '../utils/private-book-storage.js';
        // Import { ROLES } từ ../constants/roles.constant.js để dùng trong module.
        import { ROLES } from '../constants/roles.constant.js';
        // Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
        import { PAGINATION } from '../constants/pagination.constant.js';

        // Hàm createUser: Băm mật khẩu, gán role mặc định USER và tạo tài khoản không nhận quyền/secret từ client.
        /**
         * Hàm createUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userData.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: isArray, ApiError, hash, create, toPublicJSON.
         */
        export const createUser = async (userData) => {
            // if chỉ chạy nhánh này khi điều kiện !userData || typeof userData !== 'object' || Array.isArray(userData) đúng.
            if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(400, 'User data must be an object');
            }
            // Khai báo { name, email, phone_number, password  nhận giá trị từ userData. const giữ biến không gán lại; let cho phép cập nhật.
            const { name, email, phone_number, password } = userData;
            // if chỉ chạy nhánh này khi điều kiện !name || !email || typeof password !== 'string' đúng.
            if (!name || !email || typeof password !== 'string') {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(400, 'Name, email and password are required');
            }
            // Khai báo payload nhận giá trị từ { name, email, phone_number: phone_number || null, pass. const giữ biến không gán lại; let cho phép cập nhật.
            const payload = {
                // Khóa name nhận biến cùng tên làm giá trị.
                name,
                // Khóa email nhận biến cùng tên làm giá trị.
                email,
                // Trường phone_number lưu phone_number || null làm giá trị trong object.
                phone_number: phone_number || null,
                // Trường password_hash lưu await bcrypt.hash(password, 12) làm giá trị trong object.
                password_hash: await bcrypt.hash(password, 12),
                // Trường role lưu ROLES.USER làm giá trị trong object.
                role: ROLES.USER
            };
            // Khai báo user nhận giá trị từ await User.create(payload). const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.create(payload);
            // return kết thúc hàm và trả user.toPublicJSON() về nơi gọi.
            return user.toPublicJSON();
        };

        // Hàm getAllUsers: Trả danh sách tài khoản phân trang, tìm theo tên/email và chỉ populate dữ liệu an toàn.
        /**
         * Hàm getAllUsers: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: filters mặc định {}.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: max, parseInt, min, values, includes, ApiError, trim, replace.
         */
        export const getAllUsers = async (filters = {}) => {
            // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
            const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
            // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
            const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
                Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
            // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
            const query = {};
            // if chỉ chạy nhánh này khi điều kiện filters.role đúng.
            if (filters.role) {
                // if chỉ chạy nhánh này khi điều kiện !Object.values(ROLES).includes(filters.role) đúng.
                if (!Object.values(ROLES).includes(filters.role)) throw new ApiError(400, 'User role filter is invalid');
                // Gọi/thực thi biểu thức để thực hiện thao tác: query.role = filters.role
                query.role = filters.role;
            }
            // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
            if (typeof filters.search === 'string' && filters.search.trim()) {
                // Khai báo escaped nhận giá trị từ filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\. const giữ biến không gán lại; let cho phép cập nhật.
                const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Gọi/thực thi biểu thức để thực hiện thao tác: query.$or = [ { name: { $regex: escaped, $options: 'i' } }, { email: { $reg
                query.$or = [
                    { name: { $regex: escaped, $options: 'i' } },
                    { email: { $regex: escaped, $options: 'i' } }
                ];
            }
            // Khai báo [users, total] nhận giá trị từ await Promise.all([ User.find(query).select('name email. const giữ biến không gán lại; let cho phép cập nhật.
            const [users, total] = await Promise.all([
                User.find(query).select('name email phone_number role is_premium premium_expires_at is_vip vip_expires_at createdAt')
                    .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
                User.countDocuments(query)
            ]);
            // return kết thúc hàm và trả { users, pagination: { total, page, limit, totalPages: Math.ceil(total / li về nơi gọi.
            return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
        };

        // Hàm getUserById: Nạp hồ sơ công khai theo ID và trả 404 khi không tồn tại.
        /**
         * Hàm getUserById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userId.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: findById, select, ApiError, toPublicJSON.
         */
        export const getUserById = async (userId) => {
            // Khai báo user nhận giá trị từ await User.findById(userId) .select('name email phone_n. const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.findById(userId)
                .select('name email phone_number role is_premium premium_expires_at is_vip vip_expires_at createdAt updatedAt');
            // if chỉ chạy nhánh này khi điều kiện !user đúng.
            if (!user) throw new ApiError(404, 'User not found');
            // return kết thúc hàm và trả user.toPublicJSON() về nơi gọi.
            return user.toPublicJSON();
        };

        // Hàm updateUser: Cập nhật thông tin được whitelist; mã hóa mật khẩu mới và chỉ cho Admin đổi role ADMIN/USER.
        /**
         * Hàm updateUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userId, updateData.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: isArray, ApiError, findById, fromEntries, entries, filter, includes, hash.
         */
        export const updateUser = async (userId, updateData) => {
            // if chỉ chạy nhánh này khi điều kiện !updateData || typeof updateData !== 'object' || Array.isArray(updateData) đúng.
            if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(400, 'User update must be an object');
            }
            // Khai báo user nhận giá trị từ await User.findById(userId). const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.findById(userId);
            // if chỉ chạy nhánh này khi điều kiện !user đúng.
            if (!user) throw new ApiError(404, 'User not found');
            // Khai báo allowedFields nhận giá trị từ ['name', 'email', 'phone_number', 'password', 'role']. const giữ biến không gán lại; let cho phép cập nhật.
            const allowedFields = ['name', 'email', 'phone_number', 'password', 'role'];
            // Khai báo payload nhận giá trị từ Object.fromEntries(Object.entries(updateData) .filter((. const giữ biến không gán lại; let cho phép cập nhật.
            const payload = Object.fromEntries(Object.entries(updateData)
                .filter(([field]) => allowedFields.includes(field)));
            // if chỉ chạy nhánh này khi điều kiện payload.password !== undefined đúng.
            if (payload.password !== undefined) {
                // await chờ tác vụ bất đồng bộ xong trước bước sau: payload.password_hash = await bcrypt.hash(payload.password, 12)
                payload.password_hash = await bcrypt.hash(payload.password, 12);
                // Gọi/thực thi biểu thức để thực hiện thao tác: delete payload.password
                delete payload.password;
            }
            // Gọi/thực thi Object.assign với các đối số để thực hiện thao tác: Object.assign(user, payload)
            Object.assign(user, payload);
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save()
            await user.save();
            // return kết thúc hàm và trả user.toPublicJSON() về nơi gọi.
            return user.toPublicJSON();
        };

        // Hàm deleteUser: Xóa user cùng dữ liệu cá nhân và nội dung sở hữu trong transaction, rồi dọn file sách riêng tư.
        /**
         * Hàm deleteUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userId.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: startSession, withTransaction, async, findById, session, ApiError, toPublicJSON, find.
         */
        export const deleteUser = async (userId) => {
            // Khai báo session nhận giá trị từ await mongoose.startSession(). const giữ biến không gán lại; let cho phép cập nhật.
            const session = await mongoose.startSession();
            // Khai báo deletedUser nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
            let deletedUser;
            // Khai báo privateFileKeys nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
            let privateFileKeys = [];
            // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
            try {
                // await chờ tác vụ bất đồng bộ xong trước bước sau: await session.withTransaction(async () => { const user = await User.findByI
                await session.withTransaction(async () => {
                    // Khai báo user nhận giá trị từ await User.findById(userId).session(session). const giữ biến không gán lại; let cho phép cập nhật.
                    const user = await User.findById(userId).session(session);
                    // if chỉ chạy nhánh này khi điều kiện !user đúng.
                    if (!user) throw new ApiError(404, 'User not found');
                    // Gọi/thực thi user.toPublicJSON với các đối số để thực hiện thao tác: deletedUser = user.toPublicJSON()
                    deletedUser = user.toPublicJSON();

                    // Khai báo ownedBooks nhận giá trị từ await Book.find({ owner: userId }) .select('+file_key'). const giữ biến không gán lại; let cho phép cập nhật.
                    const ownedBooks = await Book.find({ owner: userId })
                        .select('+file_key')
                        .session(session)
                        .lean();
                    // Khai báo ownedBookIds nhận giá trị từ ownedBooks.map((book) => book._id). const giữ biến không gán lại; let cho phép cập nhật.
                    const ownedBookIds = ownedBooks.map((book) => book._id);
                    // Gọi/thực thi ownedBooks.map với các đối số để thực hiện thao tác: privateFileKeys = ownedBooks.map((book) => book.file_key).filter(Boolean)
                    privateFileKeys = ownedBooks.map((book) => book.file_key).filter(Boolean);

                    // if chỉ chạy nhánh này khi điều kiện ownedBookIds.length > 0 đúng.
                    if (ownedBookIds.length > 0) {
                        // await chờ tác vụ bất đồng bộ xong trước bước sau: await Chapter.deleteMany({ book_id: { $in: ownedBookIds } }, { session })
                        await Chapter.deleteMany({ book_id: { $in: ownedBookIds } }, { session });
                    }
                    // Khai báo relatedBookFilter nhận giá trị từ ownedBookIds.length > 0 ? { $or: [{ user: userId }, { b. const giữ biến không gán lại; let cho phép cập nhật.
                    const relatedBookFilter = ownedBookIds.length > 0
                        ? { $or: [{ user: userId }, { book: { $in: ownedBookIds } }] }
                        : { user: userId };
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Comment.deleteMany(relatedBookFilter, { session })
                    await Comment.deleteMany(relatedBookFilter, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Bookmark.deleteMany(relatedBookFilter, { session })
                    await Bookmark.deleteMany(relatedBookFilter, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await ReadingProgress.deleteMany(relatedBookFilter, { session })
                    await ReadingProgress.deleteMany(relatedBookFilter, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Report.deleteMany({ user: userId }, { session })
                    await Report.deleteMany({ user: userId }, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Subscription.deleteMany({ user: userId }, { session })
                    await Subscription.deleteMany({ user: userId }, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Subscription.updateMany( { reviewed_by: userId }, { $set: { reviewed_
                    await Subscription.updateMany(
                        { reviewed_by: userId },
                        { $set: { reviewed_by: null } },
                        { session }
                    );
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Book.deleteMany({ owner: userId }, { session })
                    await Book.deleteMany({ owner: userId }, { session });
                    // await chờ tác vụ bất đồng bộ xong trước bước sau: await User.deleteOne({ _id: userId }, { session })
                    await User.deleteOne({ _id: userId }, { session });
                });
            } finally {
                // await chờ tác vụ bất đồng bộ xong trước bước sau: await session.endSession()
                await session.endSession();
            }

            // Khai báo fileCleanupResults nhận giá trị từ await Promise.allSettled(privateFileKeys.map(removePriv. const giữ biến không gán lại; let cho phép cập nhật.
            const fileCleanupResults = await Promise.allSettled(privateFileKeys.map(removePrivateBookFile));
            // Khai báo fileCleanupFailures nhận giá trị từ fileCleanupResults.filter((result) => result.status ===. const giữ biến không gán lại; let cho phép cập nhật.
            const fileCleanupFailures = fileCleanupResults.filter((result) => result.status === 'rejected');
            // if chỉ chạy nhánh này khi điều kiện fileCleanupFailures.length > 0 đúng.
            if (fileCleanupFailures.length > 0) {
                // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error(`[USER_DELETE] Could not remove ${fileCleanupFailures.length}
                console.error(`[USER_DELETE] Could not remove ${fileCleanupFailures.length} private book file(s)`);
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(500, 'User data was deleted, but one or more private book files could not be removed');
            }
            // return kết thúc hàm và trả deletedUser về nơi gọi.
            return deletedUser;
        };

        // Hàm grantVipToUser: Cấp quyền VIP cho USER đến một ngày tương lai mà không đổi role phân quyền; ADMIN không bị sửa.
        /**
         * Hàm grantVipToUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userId, expiresAtValue.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: Date, isNaN, getTime, ApiError, findOneAndUpdate, findById, select, toPublicJSON.
         */
        export const grantVipToUser = async (userId, expiresAtValue) => {
            // Khai báo expiresAt nhận giá trị từ new Date(expiresAtValue). const giữ biến không gán lại; let cho phép cập nhật.
            const expiresAt = new Date(expiresAtValue);
            // if chỉ chạy nhánh này khi điều kiện !expiresAtValue || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Da đúng.
            if (!expiresAtValue || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(400, 'A future vip_expires_at timestamp is required');
            }
            // Khai báo user nhận giá trị từ await User.findOneAndUpdate({ _id: userId, role: { $ne:. const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.findOneAndUpdate({
                // Trường _id lưu userId làm giá trị trong object.
                _id: userId,
                // Trường role lưu { $ne: ROLES.ADMIN } làm giá trị trong object.
                role: { $ne: ROLES.ADMIN }
            }, {
                // Trường $set lưu { is_vip: true, vip_expires_at: expiresAt } làm giá trị trong object.
                $set: { is_vip: true, vip_expires_at: expiresAt }
            }, { new: true, runValidators: true });
            // if chỉ chạy nhánh này khi điều kiện !user đúng.
            if (!user) {
                // Khai báo existingUser nhận giá trị từ await User.findById(userId).select('role'). const giữ biến không gán lại; let cho phép cập nhật.
                const existingUser = await User.findById(userId).select('role');
                // if chỉ chạy nhánh này khi điều kiện !existingUser đúng.
                if (!existingUser) throw new ApiError(404, 'User not found');
                // if chỉ chạy nhánh này khi điều kiện existingUser.role === ROLES.ADMIN đúng.
                if (existingUser.role === ROLES.ADMIN) throw new ApiError(409, 'Admin accounts cannot be changed to VIP');
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(409, 'User could not be granted VIP access');
            }
            // return kết thúc hàm và trả user.toPublicJSON() về nơi gọi.
            return user.toPublicJSON();
        };

        // Cấp quyền Premium có hạn; Premium cũng thừa hưởng quyền VIP qua entitlement của User model.
        /**
         * Hàm grantPremiumToUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: userId, expiresAtValue.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: Date, isNaN, getTime, ApiError, findOneAndUpdate, findById, select, toPublicJSON.
         */
        export const grantPremiumToUser = async (userId, expiresAtValue) => {
            // Khai báo expiresAt nhận giá trị từ new Date(expiresAtValue). const giữ biến không gán lại; let cho phép cập nhật.
            const expiresAt = new Date(expiresAtValue);
            // if chỉ chạy nhánh này khi điều kiện !expiresAtValue || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Da đúng.
            if (!expiresAtValue || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(400, 'A future premium_expires_at timestamp is required');
            }
            // Khai báo user nhận giá trị từ await User.findOneAndUpdate({ _id: userId, role: { $ne:. const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.findOneAndUpdate({ _id: userId, role: { $ne: ROLES.ADMIN } }, {
                // Trường $set lưu { is_premium: true, premium_expires_at: expiresAt } làm giá trị trong object.
                $set: { is_premium: true, premium_expires_at: expiresAt }
            }, { new: true, runValidators: true });
            // if chỉ chạy nhánh này khi điều kiện !user đúng.
            if (!user) {
                // Khai báo existingUser nhận giá trị từ await User.findById(userId).select('role'). const giữ biến không gán lại; let cho phép cập nhật.
                const existingUser = await User.findById(userId).select('role');
                // if chỉ chạy nhánh này khi điều kiện !existingUser đúng.
                if (!existingUser) throw new ApiError(404, 'User not found');
                // if chỉ chạy nhánh này khi điều kiện existingUser.role === ROLES.ADMIN đúng.
                if (existingUser.role === ROLES.ADMIN) throw new ApiError(409, 'Admin accounts cannot be changed to Premium');
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(409, 'User could not be granted Premium access');
            }
            // return kết thúc hàm và trả user.toPublicJSON() về nơi gọi.
            return user.toPublicJSON();
        };
