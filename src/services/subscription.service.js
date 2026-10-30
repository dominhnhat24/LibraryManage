// Import { randomBytes } từ node:crypto để dùng trong module.
/**
 * Tệp src/services/subscription.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { randomBytes } from 'node:crypto';
// Import mongoose từ mongoose để dùng trong module.
import mongoose from 'mongoose';
// Import Subscription từ ../models/subscription.model.js để dùng trong module.
import Subscription from '../models/subscription.model.js';
// Import User từ ../models/user.model.js để dùng trong module.
import User from '../models/user.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';

// Tạo yêu cầu gói tháng và mã chuyển khoản riêng để webhook đối chiếu giao dịch.
/**
 * Hàm createSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, data mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, isArray, exists, includes, randomBytes, toString, toUpperCase, create.
 */
export const createSubscription = async (userId, data = {}) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) throw new ApiError(401, 'Authentication is required');

    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Subscription data must be an object');
    }
    
    // if chỉ chạy nhánh này khi điều kiện !(await User.exists({ _id: userId })) đúng.
    if (!(await User.exists({ _id: userId }))) throw new ApiError(404, 'User not found');
    
    // Khai báo duplicate nhận giá trị từ await Subscription.exists({ user: userId, status: 'pend. const giữ biến không gán lại; let cho phép cập nhật.
    const duplicate = await Subscription.exists({ user: userId, status: 'pending' });
    // if chỉ chạy nhánh này khi điều kiện duplicate đúng.
    if (duplicate) throw new ApiError(409, 'A subscription request is already pending');
    
    // Khai báo plan nhận giá trị từ data.plan ?? 'premium_monthly'. const giữ biến không gán lại; let cho phép cập nhật.
    const plan = data.plan ?? 'premium_monthly';
    // if chỉ chạy nhánh này khi điều kiện !['vip_monthly', 'premium_monthly'].includes(plan) đúng.
    if (!['vip_monthly', 'premium_monthly'].includes(plan)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Subscription plan is invalid');
    }

    // Khai báo payload nhận giá trị từ { payment_reference: data.payment_reference, user: user. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = {
        // Trường payment_reference lưu data.payment_reference làm giá trị trong object.
        payment_reference: data.payment_reference,
        // Trường user lưu userId làm giá trị trong object.
        user: userId,
        // Khóa plan nhận biến cùng tên làm giá trị.
        plan,
        // Trường amount_vnd lưu plan === 'vip_monthly' ? 10000 : 20000 làm giá trị trong object.
        amount_vnd: plan === 'vip_monthly' ? 10000 : 20000,
        // Trường transfer_note lưu `HB${randomBytes(5).toString('hex').toUpperCase()}` làm giá trị trong object.
        transfer_note: `HB${randomBytes(5).toString('hex').toUpperCase()}`,
        // Trường gateway lưu 'manual' làm giá trị trong object.
        gateway: 'manual'
    };
    // return kết thúc hàm và trả Subscription.create(payload) về nơi gọi.
    return Subscription.create(payload);
};

// [SERVICE TỰ ĐỘNG QUA WEBHOOK] Xử lý khi cổng thanh toán gọi về
/**
 * Hàm processPaymentWebhook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { id, transferType, transferAmount, cont.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, Number, isFinite, ApiError, toLowerCase, findOne, match.
 */
export const processPaymentWebhook = async ({ id, transferType, transferAmount, content, code }) => {
    // Khai báo transactionId nhận giá trị từ String(id ?? '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const transactionId = String(id ?? '').trim();
    // Khai báo amount nhận giá trị từ Number(transferAmount). const giữ biến không gán lại; let cho phép cập nhật.
    const amount = Number(transferAmount);
    // if chỉ chạy nhánh này khi điều kiện !transactionId || !Number.isFinite(amount) || amount <= 0 đúng.
    if (!transactionId || !Number.isFinite(amount) || amount <= 0) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Webhook transaction ID and positive transfer amount are required');
    }
    // if chỉ chạy nhánh này khi điều kiện String(transferType || '').toLowerCase() !== 'in' đúng.
    if (String(transferType || '').toLowerCase() !== 'in') {
        // return kết thúc hàm và trả { matched: false, reason: 'not_incoming' } về nơi gọi.
        return { matched: false, reason: 'not_incoming' };
    }

    // Khai báo duplicate nhận giá trị từ await Subscription.findOne({ gateway: 'sepay', transact. const giữ biến không gán lại; let cho phép cập nhật.
    const duplicate = await Subscription.findOne({ gateway: 'sepay', transaction_id: transactionId });
    // if chỉ chạy nhánh này khi điều kiện duplicate đúng.
    if (duplicate) return { matched: true, duplicate: true, subscription: duplicate };

    // Khai báo notePattern nhận giá trị từ /(?:HB[A-Z0-9]{10}|OPENBOOK-[A-F0-9]{12})/i. const giữ biến không gán lại; let cho phép cập nhật.
    const notePattern = /(?:HB[A-Z0-9]{10}|OPENBOOK-[A-F0-9]{12})/i;
    // Khai báo paymentCode nhận giá trị từ String(code || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const paymentCode = String(code || '').trim();
    // Khai báo referenceText nhận giá trị từ `${paymentCode} ${String(content || '')}`. const giữ biến không gán lại; let cho phép cập nhật.
    const referenceText = `${paymentCode} ${String(content || '')}`;
    // Khai báo match nhận giá trị từ referenceText.match(notePattern). const giữ biến không gán lại; let cho phép cập nhật.
    const match = referenceText.match(notePattern);
    // if chỉ chạy nhánh này khi điều kiện !match đúng.
    if (!match) return { matched: false, reason: 'payment_note_not_found' };
    // Khai báo transferNote nhận giá trị từ match[0].toUpperCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const transferNote = match[0].toUpperCase();
    // Khai báo pending nhận giá trị từ await Subscription.findOne({ transfer_note: transferNot. const giữ biến không gán lại; let cho phép cập nhật.
    const pending = await Subscription.findOne({ transfer_note: transferNote, status: 'pending' });
    // if chỉ chạy nhánh này khi điều kiện !pending đúng.
    if (!pending) return { matched: false, reason: 'pending_subscription_not_found' };
    // if chỉ chạy nhánh này khi điều kiện pending.amount_vnd !== amount đúng.
    if (pending.amount_vnd !== amount) return { matched: false, reason: 'amount_mismatch' };

    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Khai báo subscription nhận giá trị từ await approveSubscription(pending._id, null, { gateway:. const giữ biến không gán lại; let cho phép cập nhật.
        const subscription = await approveSubscription(pending._id, null, {
            // Trường gateway lưu 'sepay' làm giá trị trong object.
            gateway: 'sepay', transactionId
        });
        // return kết thúc hàm và trả { matched: true, duplicate: false, subscription } về nơi gọi.
        return { matched: true, duplicate: false, subscription };
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error?.code === 11000 đúng.
        if (error?.code === 11000) {
            // Khai báo processed nhận giá trị từ await Subscription.findOne({ gateway: 'sepay', transact. const giữ biến không gán lại; let cho phép cập nhật.
            const processed = await Subscription.findOne({ gateway: 'sepay', transaction_id: transactionId });
            // if chỉ chạy nhánh này khi điều kiện processed đúng.
            if (processed) return { matched: true, duplicate: true, subscription: processed };
        }
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
};

// [CƠ CHẾ DỰ PHÒNG] Admin duyệt thủ công khi webhook gặp lỗi hoặc giao dịch treo
/**
 * Hàm adminReviewSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId, adminId, action.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findById, ApiError, Date, setMonth, getMonth, save.
 */
export const adminReviewSubscription = async (subscriptionId, adminId, action) => {
    // Khai báo subscription nhận giá trị từ await Subscription.findById(subscriptionId). const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await Subscription.findById(subscriptionId);
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) throw new ApiError(404, 'Subscription request not found');
    // if chỉ chạy nhánh này khi điều kiện subscription.status !== 'pending' đúng.
    if (subscription.status !== 'pending') throw new ApiError(400, 'Subscription is not in pending status');

    // if chỉ chạy nhánh này khi điều kiện action === 'approve' đúng.
    if (action === 'approve') {
        // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
        const now = new Date();
        // Khai báo expiresAt nhận giá trị từ new Date(now). const giữ biến không gán lại; let cho phép cập nhật.
        const expiresAt = new Date(now);
        // Gọi/thực thi expiresAt.setMonth với các đối số để thực hiện thao tác: expiresAt.setMonth(expiresAt.getMonth() + 1)
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.status = 'active'
        subscription.status = 'active';
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.starts_at = now
        subscription.starts_at = now;
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.expires_at = expiresAt
        subscription.expires_at = expiresAt;
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.reviewed_by = adminId
        subscription.reviewed_by = adminId;
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.auto_approved = false
        subscription.auto_approved = false; // Đánh dấu duyệt thủ công
    } else if (action === 'reject') {
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.status = 'rejected'
        subscription.status = 'rejected';
        // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.reviewed_by = adminId
        subscription.reviewed_by = adminId;
    } else {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Invalid action');
    }

    // await chờ tác vụ bất đồng bộ xong trước bước sau: await subscription.save()
    await subscription.save();
    // return kết thúc hàm và trả subscription về nơi gọi.
    return subscription;
};

// Hàm getAllSubscriptions: Lọc yêu cầu thuê bao, phân trang và populate hồ sơ an toàn của người đăng ký/người duyệt.
/**
 * Hàm getAllSubscriptions: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, includes, ApiError, all, find, populate.
 */
export const getAllSubscriptions = async (filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const query = {};
    // if chỉ chạy nhánh này khi điều kiện filters.user đúng.
    if (filters.user) query.user = filters.user;
    // if chỉ chạy nhánh này khi điều kiện filters.status đúng.
    if (filters.status) {
        // if chỉ chạy nhánh này khi điều kiện !['pending', 'active', 'rejected', 'expired'].includes(filters.status) đúng.
        if (!['pending', 'active', 'rejected', 'expired'].includes(filters.status)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Subscription status filter is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.status = filters.status
        query.status = filters.status;
    }
    // if chỉ chạy nhánh này khi điều kiện filters.plan đúng.
    if (filters.plan) {
        // if chỉ chạy nhánh này khi điều kiện !['vip_monthly', 'premium_monthly'].includes(filters.plan) đúng.
        if (!['vip_monthly', 'premium_monthly'].includes(filters.plan)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Subscription plan filter is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.plan = filters.plan
        query.plan = filters.plan;
    }
    // Khai báo [subscriptions, total] nhận giá trị từ await Promise.all([ Subscription.find(query).populate('. const giữ biến không gán lại; let cho phép cập nhật.
    const [subscriptions, total] = await Promise.all([
        Subscription.find(query).populate('user', 'name email role')
            .populate('reviewed_by', 'name email role')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Subscription.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(to về nơi gọi.
    return { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getSubscriptionById: Tìm yêu cầu thuê bao theo ID và nạp thông tin tài khoản liên quan; trả 404 nếu thiếu.
/**
 * Hàm getSubscriptionById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findById, populate, ApiError.
 */
export const getSubscriptionById = async (subscriptionId) => {
    // Khai báo subscription nhận giá trị từ await Subscription.findById(subscriptionId) .populate('. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await Subscription.findById(subscriptionId)
        .populate('user', 'name email role').populate('reviewed_by', 'name email role');
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) throw new ApiError(404, 'Subscription not found');
    // return kết thúc hàm và trả subscription về nơi gọi.
    return subscription;
};

// Hàm getMySubscriptions: Chỉ trả các yêu cầu của user hiện tại theo thời gian tạo mới nhất.
/**
 * Hàm getMySubscriptions: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, all, find, sort, skip, limit.
 */
export const getMySubscriptions = async (userId, filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo [subscriptions, total] nhận giá trị từ await Promise.all([ Subscription.find({ user: userId }). const giữ biến không gán lại; let cho phép cập nhật.
    const [subscriptions, total] = await Promise.all([
        Subscription.find({ user: userId }).sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Subscription.countDocuments({ user: userId })
    ]);
    // return kết thúc hàm và trả { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(to về nơi gọi.
    return { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm updateSubscription: Chỉ cập nhật thông tin tham chiếu thanh toán của yêu cầu còn chờ, không tự đổi trạng thái/quyền.
/**
 * Hàm updateSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, hasOwn, findOneAndUpdate, exists.
 */
export const updateSubscription = async (subscriptionId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Subscription update must be an object');
    }
    // if chỉ chạy nhánh này khi điều kiện !Object.hasOwn(data, 'payment_reference') đúng.
    if (!Object.hasOwn(data, 'payment_reference')) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Payment reference is required for an update');
    }
    // Khai báo payload nhận giá trị từ { payment_reference: data.payment_reference }. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = { payment_reference: data.payment_reference };
    // Khai báo subscription nhận giá trị từ await Subscription.findOneAndUpdate( { _id: subscriptio. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, status: 'pending' },
        { $set: payload },
        { new: true, runValidators: true }
    );
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) {
        // Khai báo exists nhận giá trị từ await Subscription.exists({ _id: subscriptionId }). const giữ biến không gán lại; let cho phép cập nhật.
        const exists = await Subscription.exists({ _id: subscriptionId });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(exists ? 409 : 404, exists
            ? 'Only pending subscription requests can be updated' : 'Subscription not found');
    }
    // return kết thúc hàm và trả subscription về nơi gọi.
    return subscription;
};

// Hàm deleteSubscription: Xóa yêu cầu thuê bao tồn tại; trạng thái/quyền đã kích hoạt vẫn cần quản lý qua luồng xét duyệt.
/**
 * Hàm deleteSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOneAndDelete, exists, ApiError.
 */
export const deleteSubscription = async (subscriptionId) => {
    // Khai báo subscription nhận giá trị từ await Subscription.findOneAndDelete({ _id: subscription. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await Subscription.findOneAndDelete({ _id: subscriptionId, status: 'pending' });
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) {
        // Khai báo exists nhận giá trị từ await Subscription.exists({ _id: subscriptionId }). const giữ biến không gán lại; let cho phép cập nhật.
        const exists = await Subscription.exists({ _id: subscriptionId });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(exists ? 409 : 404, exists
            ? 'Only pending subscription requests can be deleted' : 'Subscription not found');
    }
    // return kết thúc hàm và trả subscription về nơi gọi.
    return subscription;
};

// Hàm approveSubscription: Duyệt yêu cầu pending trong transaction và cập nhật quyền VIP/Premium cùng hạn sử dụng nguyên tử.
/**
 * Hàm approveSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId, reviewerId, payment mặc định null.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: startSession, withTransaction, async, findById, session, ApiError, Date, hasActiveVip.
 */
export const approveSubscription = async (subscriptionId, reviewerId, payment = null) => {
    // Khai báo session nhận giá trị từ await mongoose.startSession(). const giữ biến không gán lại; let cho phép cập nhật.
    const session = await mongoose.startSession();
    // Khai báo approved nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let approved;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await session.withTransaction(async () => { const subscription = await Subs
        await session.withTransaction(async () => {
            // Khai báo subscription nhận giá trị từ await Subscription.findById(subscriptionId).session(ses. const giữ biến không gán lại; let cho phép cập nhật.
            const subscription = await Subscription.findById(subscriptionId).session(session);
            // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
            if (!subscription) throw new ApiError(404, 'Subscription not found');
            // if chỉ chạy nhánh này khi điều kiện subscription.status !== 'pending' đúng.
            if (subscription.status !== 'pending') throw new ApiError(409, 'Subscription is not pending');

            // Khai báo user nhận giá trị từ await User.findById(subscription.user).session(session). const giữ biến không gán lại; let cho phép cập nhật.
            const user = await User.findById(subscription.user).session(session);
            // if chỉ chạy nhánh này khi điều kiện !user đúng.
            if (!user) throw new ApiError(404, 'Subscription user no longer exists');
            // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
            const now = new Date();
            // Khai báo isVipPlan nhận giá trị từ subscription.plan === 'vip_monthly'. const giữ biến không gán lại; let cho phép cập nhật.
            const isVipPlan = subscription.plan === 'vip_monthly';
            // Khai báo currentExpiry nhận giá trị từ isVipPlan ? user.vip_expires_at : user.premium_expires_. const giữ biến không gán lại; let cho phép cập nhật.
            const currentExpiry = isVipPlan ? user.vip_expires_at : user.premium_expires_at;
            // Khai báo isCurrentlyActive nhận giá trị từ isVipPlan ? user.hasActiveVip(now) : user.hasActivePrem. const giữ biến không gán lại; let cho phép cập nhật.
            const isCurrentlyActive = isVipPlan ? user.hasActiveVip(now) : user.hasActivePremium(now);
            // Khai báo startsAt nhận giá trị từ isCurrentlyActive && currentExpiry > now ? currentExpir. const giữ biến không gán lại; let cho phép cập nhật.
            const startsAt = isCurrentlyActive && currentExpiry > now ? currentExpiry : now;
            // Khai báo expiresAt nhận giá trị từ new Date(startsAt). const giữ biến không gán lại; let cho phép cập nhật.
            const expiresAt = new Date(startsAt);
            // Khai báo dayOfMonth nhận giá trị từ expiresAt.getUTCDate(). const giữ biến không gán lại; let cho phép cập nhật.
            const dayOfMonth = expiresAt.getUTCDate();
            // Gọi/thực thi expiresAt.setUTCDate với các đối số để thực hiện thao tác: expiresAt.setUTCDate(1)
            expiresAt.setUTCDate(1);
            // Gọi/thực thi expiresAt.setUTCMonth với các đối số để thực hiện thao tác: expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1)
            expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
            // Gọi/thực thi expiresAt.setUTCDate với các đối số để thực hiện thao tác: expiresAt.setUTCDate(Math.min(dayOfMonth, new Date(Date.UTC( expiresAt.getU
            expiresAt.setUTCDate(Math.min(dayOfMonth, new Date(Date.UTC(
                expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0
            )).getUTCDate()));
            // if chỉ chạy nhánh này khi điều kiện isVipPlan đúng.
            if (isVipPlan) {
                // Gọi/thực thi biểu thức để thực hiện thao tác: user.is_vip = true
                user.is_vip = true;
                // Gọi/thực thi biểu thức để thực hiện thao tác: user.vip_expires_at = expiresAt
                user.vip_expires_at = expiresAt;
            } else {
                // Gọi/thực thi biểu thức để thực hiện thao tác: user.is_premium = true
                user.is_premium = true;
                // Gọi/thực thi biểu thức để thực hiện thao tác: user.premium_expires_at = expiresAt
                user.premium_expires_at = expiresAt;
            }
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save({ session })
            await user.save({ session });

            // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.status = 'active'
            subscription.status = 'active';
            // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.starts_at = startsAt
            subscription.starts_at = startsAt;
            // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.expires_at = expiresAt
            subscription.expires_at = expiresAt;
            // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.reviewed_by = reviewerId
            subscription.reviewed_by = reviewerId;
            // if chỉ chạy nhánh này khi điều kiện payment đúng.
            if (payment) {
                // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.gateway = payment.gateway
                subscription.gateway = payment.gateway;
                // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.transaction_id = payment.transactionId
                subscription.transaction_id = payment.transactionId;
                // Gọi/thực thi biểu thức để thực hiện thao tác: subscription.auto_approved = true
                subscription.auto_approved = true;
            }
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await subscription.save({ session })
            await subscription.save({ session });
            // Gọi/thực thi subscription.toObject với các đối số để thực hiện thao tác: approved = subscription.toObject()
            approved = subscription.toObject();
        });
    } finally {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await session.endSession()
        await session.endSession();
    }
    // return kết thúc hàm và trả approved về nơi gọi.
    return approved;
};

// Hàm rejectSubscription: Chuyển yêu cầu pending thành rejected và ghi người duyệt, không cấp quyền tài khoản.
/**
 * Hàm rejectSubscription: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: subscriptionId, reviewerId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOneAndUpdate, exists, ApiError.
 */
export const rejectSubscription = async (subscriptionId, reviewerId) => {
    // Khai báo subscription nhận giá trị từ await Subscription.findOneAndUpdate( { _id: subscriptio. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, status: 'pending' },
        { $set: { status: 'rejected', reviewed_by: reviewerId } },
        { new: true, runValidators: true }
    );
    // if chỉ chạy nhánh này khi điều kiện !subscription đúng.
    if (!subscription) {
        // Khai báo exists nhận giá trị từ await Subscription.exists({ _id: subscriptionId }). const giữ biến không gán lại; let cho phép cập nhật.
        const exists = await Subscription.exists({ _id: subscriptionId });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(exists ? 409 : 404,
            exists ? 'Subscription is not pending' : 'Subscription not found');
    }
    // return kết thúc hàm và trả subscription về nơi gọi.
    return subscription;
};
