// [CONTROLLER THUÊ BAO] Tạo yêu cầu thanh toán tay và xử lý quyết định admin.
import mongoose from 'mongoose';
import Subscription from '../models/subscription.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { randomBytes } from 'node:crypto';

// [YÊU CẦU PREMIUM] Ghi nhận khoản chuyển khoản 20.000 VND; không bật Premium trước khi duyệt.
export const createSubscription = asyncHandler(async (req, res) => {
    const plan = req.body.plan;
    if (plan && !['monthly', 'premium_monthly'].includes(plan)) {
        throw new ApiError(400, 'Request validation failed', [
            { field: 'plan', message: 'Only the monthly Premium plan is supported' }
        ]);
    }
    const paymentReference = String(req.body.payment_reference || '').trim();
    if (paymentReference.length > 120) throw new ApiError(400, 'Payment reference must be at most 120 characters');
    const duplicatePending = await Subscription.exists({
        user: req.authUser._id, status: 'pending'
    });
    if (duplicatePending) throw new ApiError(409, 'A Premium payment request is already pending');
    const subscription = await Subscription.create({
        user: req.authUser._id,
        payment_reference: paymentReference || null,
        transfer_note: `OPENBOOK-${randomBytes(6).toString('hex').toUpperCase()}`
    });
    return res.status(201).json({
        status: 'success',
        message: 'Payment request submitted for manual review',
        data: {
            ...subscription.toObject(),
            payment_instructions: {
                amount_vnd: subscription.amount_vnd,
                transfer_note: subscription.transfer_note,
                bank_name: process.env.BANK_NAME || null,
                bank_account: process.env.BANK_ACCOUNT || null,
                bank_account_name: process.env.BANK_ACCOUNT_NAME || null
            }
        }
    });
});

// [LỊCH SỬ THUÊ BAO] Chỉ trả các yêu cầu thuộc tài khoản đăng nhập hiện tại.
export const getMySubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.authUser._id })
        .sort({ createdAt: -1 }).limit(1).lean();
    const subscription = subscriptions[0] || null;
    return res.json({ status: 'success', data: subscription ? {
        ...subscription,
        status: subscription.status === 'active' && subscription.expires_at <= new Date()
            ? 'expired' : subscription.status,
        startsAt: subscription.starts_at,
        expiresAt: subscription.expires_at
    } : null });
});

// [DUYỆT THUÊ BAO] Trong transaction, bật Premium một tháng và gắn người duyệt để tránh lệch trạng thái.
export const approveSubscription = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    let approved;
    try {
        await session.withTransaction(async () => {
            const subscription = await Subscription.findById(req.params.subscriptionId).session(session);
            if (!subscription) throw new ApiError(404, 'Subscription not found');
            if (subscription.status !== 'pending') throw new ApiError(409, 'Subscription is not pending');

            const user = await User.findById(subscription.user).session(session);
            if (!user) throw new ApiError(404, 'Subscription user no longer exists');
            const now = new Date();
            const startsAt = user.is_premium && user.premium_expires_at > now
                ? user.premium_expires_at : now;
            const expiresAt = new Date(startsAt);
            const targetDay = expiresAt.getUTCDate();
            expiresAt.setUTCDate(1);
            expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
            expiresAt.setUTCDate(Math.min(targetDay, new Date(Date.UTC(
                expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0
            )).getUTCDate()));
            user.is_premium = true;
            user.premium_expires_at = expiresAt;
            await user.save({ session });

            subscription.status = 'active';
            subscription.starts_at = startsAt;
            subscription.expires_at = expiresAt;
            subscription.reviewed_by = req.authUser._id;
            await subscription.save({ session });
            approved = subscription.toObject();
        });
    } finally {
        await session.endSession();
    }
    return res.json({ status: 'success', message: 'Premium activated', data: approved });
});

// [TỪ CHỐI THANH TOÁN] Lưu trạng thái từ chối mà không thay đổi quyền tài khoản.
export const rejectSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findOneAndUpdate(
        { _id: req.params.subscriptionId, status: 'pending' },
        { $set: { status: 'rejected', reviewed_by: req.authUser._id } },
        { new: true, runValidators: true }
    );
    if (!subscription) {
        const exists = await Subscription.exists({ _id: req.params.subscriptionId });
        throw new ApiError(exists ? 409 : 404, exists ? 'Subscription is not pending' : 'Subscription not found');
    }
    return res.json({ status: 'success', message: 'Payment request rejected', data: subscription });
});
