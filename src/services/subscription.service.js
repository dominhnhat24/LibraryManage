import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import Subscription from '../models/subscription.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Tạo yêu cầu gói tháng và mã chuyển khoản riêng để webhook đối chiếu giao dịch.
export const createSubscription = async (userId, data = {}) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Subscription data must be an object');
    }
    
    if (!(await User.exists({ _id: userId }))) throw new ApiError(404, 'User not found');
    
    const duplicate = await Subscription.exists({ user: userId, status: 'pending' });
    if (duplicate) throw new ApiError(409, 'A subscription request is already pending');
    
    const plan = data.plan ?? 'premium_monthly';
    if (!['vip_monthly', 'premium_monthly'].includes(plan)) {
        throw new ApiError(400, 'Subscription plan is invalid');
    }

    const payload = {
        payment_reference: data.payment_reference,
        user: userId,
        plan,
        amount_vnd: plan === 'vip_monthly' ? 10000 : 20000,
        transfer_note: `HB${randomBytes(5).toString('hex').toUpperCase()}`,
        gateway: 'manual'
    };
    return Subscription.create(payload);
};

// [SERVICE TỰ ĐỘNG QUA WEBHOOK] Xử lý khi cổng thanh toán gọi về
export const processPaymentWebhook = async ({ id, transferType, transferAmount, content, code }) => {
    const transactionId = String(id ?? '').trim();
    const amount = Number(transferAmount);
    if (!transactionId || !Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, 'Webhook transaction ID and positive transfer amount are required');
    }
    if (String(transferType || '').toLowerCase() !== 'in') {
        return { matched: false, reason: 'not_incoming' };
    }

    const duplicate = await Subscription.findOne({ gateway: 'sepay', transaction_id: transactionId });
    if (duplicate) return { matched: true, duplicate: true, subscription: duplicate };

    const notePattern = /(?:HB[A-Z0-9]{10}|OPENBOOK-[A-F0-9]{12})/i;
    const paymentCode = String(code || '').trim();
    const referenceText = `${paymentCode} ${String(content || '')}`;
    const match = referenceText.match(notePattern);
    if (!match) return { matched: false, reason: 'payment_note_not_found' };
    const transferNote = match[0].toUpperCase();
    const pending = await Subscription.findOne({ transfer_note: transferNote, status: 'pending' });
    if (!pending) return { matched: false, reason: 'pending_subscription_not_found' };
    if (pending.amount_vnd !== amount) return { matched: false, reason: 'amount_mismatch' };

    try {
        const subscription = await approveSubscription(pending._id, null, {
            gateway: 'sepay', transactionId
        });
        return { matched: true, duplicate: false, subscription };
    } catch (error) {
        if (error?.code === 11000) {
            const processed = await Subscription.findOne({ gateway: 'sepay', transaction_id: transactionId });
            if (processed) return { matched: true, duplicate: true, subscription: processed };
        }
        throw error;
    }
};

// [CƠ CHẾ DỰ PHÒNG] Admin duyệt thủ công khi webhook gặp lỗi hoặc giao dịch treo
export const adminReviewSubscription = async (subscriptionId, adminId, action) => {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new ApiError(404, 'Subscription request not found');
    if (subscription.status !== 'pending') throw new ApiError(400, 'Subscription is not in pending status');

    if (action === 'approve') {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        subscription.status = 'active';
        subscription.starts_at = now;
        subscription.expires_at = expiresAt;
        subscription.reviewed_by = adminId;
        subscription.auto_approved = false; // Đánh dấu duyệt thủ công
    } else if (action === 'reject') {
        subscription.status = 'rejected';
        subscription.reviewed_by = adminId;
    } else {
        throw new ApiError(400, 'Invalid action');
    }

    await subscription.save();
    return subscription;
};

// Hàm getAllSubscriptions: Lọc yêu cầu thuê bao, phân trang và populate hồ sơ an toàn của người đăng ký/người duyệt.
export const getAllSubscriptions = async (filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = {};
    if (filters.user) query.user = filters.user;
    if (filters.status) {
        if (!['pending', 'active', 'rejected', 'expired'].includes(filters.status)) {
            throw new ApiError(400, 'Subscription status filter is invalid');
        }
        query.status = filters.status;
    }
    if (filters.plan) {
        if (!['vip_monthly', 'premium_monthly'].includes(filters.plan)) {
            throw new ApiError(400, 'Subscription plan filter is invalid');
        }
        query.plan = filters.plan;
    }
    const [subscriptions, total] = await Promise.all([
        Subscription.find(query).populate('user', 'name email role')
            .populate('reviewed_by', 'name email role')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Subscription.countDocuments(query)
    ]);
    return { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getSubscriptionById: Tìm yêu cầu thuê bao theo ID và nạp thông tin tài khoản liên quan; trả 404 nếu thiếu.
export const getSubscriptionById = async (subscriptionId) => {
    const subscription = await Subscription.findById(subscriptionId)
        .populate('user', 'name email role').populate('reviewed_by', 'name email role');
    if (!subscription) throw new ApiError(404, 'Subscription not found');
    return subscription;
};

// Hàm getMySubscriptions: Chỉ trả các yêu cầu của user hiện tại theo thời gian tạo mới nhất.
export const getMySubscriptions = async (userId, filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const [subscriptions, total] = await Promise.all([
        Subscription.find({ user: userId }).sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Subscription.countDocuments({ user: userId })
    ]);
    return { subscriptions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm updateSubscription: Chỉ cập nhật thông tin tham chiếu thanh toán của yêu cầu còn chờ, không tự đổi trạng thái/quyền.
export const updateSubscription = async (subscriptionId, data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Subscription update must be an object');
    }
    if (!Object.hasOwn(data, 'payment_reference')) {
        throw new ApiError(400, 'Payment reference is required for an update');
    }
    const payload = { payment_reference: data.payment_reference };
    const subscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, status: 'pending' },
        { $set: payload },
        { new: true, runValidators: true }
    );
    if (!subscription) {
        const exists = await Subscription.exists({ _id: subscriptionId });
        throw new ApiError(exists ? 409 : 404, exists
            ? 'Only pending subscription requests can be updated' : 'Subscription not found');
    }
    return subscription;
};

// Hàm deleteSubscription: Xóa yêu cầu thuê bao tồn tại; trạng thái/quyền đã kích hoạt vẫn cần quản lý qua luồng xét duyệt.
export const deleteSubscription = async (subscriptionId) => {
    const subscription = await Subscription.findOneAndDelete({ _id: subscriptionId, status: 'pending' });
    if (!subscription) {
        const exists = await Subscription.exists({ _id: subscriptionId });
        throw new ApiError(exists ? 409 : 404, exists
            ? 'Only pending subscription requests can be deleted' : 'Subscription not found');
    }
    return subscription;
};

// Hàm approveSubscription: Duyệt yêu cầu pending trong transaction và cập nhật quyền VIP/Premium cùng hạn sử dụng nguyên tử.
export const approveSubscription = async (subscriptionId, reviewerId, payment = null) => {
    const session = await mongoose.startSession();
    let approved;
    try {
        await session.withTransaction(async () => {
            const subscription = await Subscription.findById(subscriptionId).session(session);
            if (!subscription) throw new ApiError(404, 'Subscription not found');
            if (subscription.status !== 'pending') throw new ApiError(409, 'Subscription is not pending');

            const user = await User.findById(subscription.user).session(session);
            if (!user) throw new ApiError(404, 'Subscription user no longer exists');
            const now = new Date();
            const isVipPlan = subscription.plan === 'vip_monthly';
            const currentExpiry = isVipPlan ? user.vip_expires_at : user.premium_expires_at;
            const isCurrentlyActive = isVipPlan ? user.hasActiveVip(now) : user.hasActivePremium(now);
            const startsAt = isCurrentlyActive && currentExpiry > now ? currentExpiry : now;
            const expiresAt = new Date(startsAt);
            const dayOfMonth = expiresAt.getUTCDate();
            expiresAt.setUTCDate(1);
            expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
            expiresAt.setUTCDate(Math.min(dayOfMonth, new Date(Date.UTC(
                expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0
            )).getUTCDate()));
            if (isVipPlan) {
                user.is_vip = true;
                user.vip_expires_at = expiresAt;
            } else {
                user.is_premium = true;
                user.premium_expires_at = expiresAt;
            }
            await user.save({ session });

            subscription.status = 'active';
            subscription.starts_at = startsAt;
            subscription.expires_at = expiresAt;
            subscription.reviewed_by = reviewerId;
            if (payment) {
                subscription.gateway = payment.gateway;
                subscription.transaction_id = payment.transactionId;
                subscription.auto_approved = true;
            }
            await subscription.save({ session });
            approved = subscription.toObject();
        });
    } finally {
        await session.endSession();
    }
    return approved;
};

// Hàm rejectSubscription: Chuyển yêu cầu pending thành rejected và ghi người duyệt, không cấp quyền tài khoản.
export const rejectSubscription = async (subscriptionId, reviewerId) => {
    const subscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, status: 'pending' },
        { $set: { status: 'rejected', reviewed_by: reviewerId } },
        { new: true, runValidators: true }
    );
    if (!subscription) {
        const exists = await Subscription.exists({ _id: subscriptionId });
        throw new ApiError(exists ? 409 : 404,
            exists ? 'Subscription is not pending' : 'Subscription not found');
    }
    return subscription;
};
