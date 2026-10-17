// [CONTROLLER THUÊ BAO] Tạo yêu cầu thanh toán tay và xử lý quyết định admin.
import { asyncHandler } from '../utils/async-handler.js';
import * as subscriptionService from '../services/subscription.service.js';
import { mapDtoList, toSubscriptionDto } from '../utils/api-dto.js';

// [YÊU CẦU PREMIUM] Ghi nhận khoản chuyển khoản 20.000 VND; không bật Premium trước khi duyệt.
export const createSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.createSubscription(req.authUser._id, { ...req.body });
    return res.status(201).json({
        status: 'success',
        message: 'Payment request submitted for manual review',
        data: {
            ...toSubscriptionDto(subscription),
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
    const result = await subscriptionService.getMySubscriptions(req.authUser._id, { page: 1, limit: 1 });
    const subscription = result.subscriptions[0] || null;
    return res.json({ status: 'success', data: subscription ? {
        ...toSubscriptionDto(subscription),
        status: subscription.status === 'active' && subscription.expires_at <= new Date()
            ? 'expired' : subscription.status,
        startsAt: subscription.starts_at,
        expiresAt: subscription.expires_at,
        payment_instructions: subscription.status === 'pending' ? {
            amount_vnd: subscription.amount_vnd,
            transfer_note: subscription.transfer_note,
            bank_name: process.env.BANK_NAME || null,
            bank_account: process.env.BANK_ACCOUNT || null,
            bank_account_name: process.env.BANK_ACCOUNT_NAME || null
        } : undefined
    } : null });
});

// Hàm getAllSubscriptions: Gọi service phân trang/lọc các yêu cầu thanh toán và trả metadata cho Admin.
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    const result = await subscriptionService.getAllSubscriptions({ ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.subscriptions, toSubscriptionDto),
        pagination: result.pagination
    });
});

// Hàm getSubscription: Lấy chi tiết một yêu cầu thuê bao theo ID qua service.
export const getSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.getSubscriptionById(req.params.subscriptionId);
    return res.json({ status: 'success', data: toSubscriptionDto(subscription) });
});

// Hàm updateSubscription: Chỉ cập nhật tham chiếu chuyển khoản khi yêu cầu còn chờ, không đổi quyền hoặc trạng thái.
export const updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.updateSubscription(
        req.params.subscriptionId, { ...req.body }
    );
    return res.json({ status: 'success', data: toSubscriptionDto(subscription) });
});

// Hàm deleteSubscription: Xóa yêu cầu đang chờ duyệt qua service và trả bản ghi đã xóa.
export const deleteSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.deleteSubscription(req.params.subscriptionId);
    return res.json({
        status: 'success',
        message: 'Subscription request deleted',
        data: toSubscriptionDto(subscription)
    });
});

// Hàm approveSubscription: Duyệt yêu cầu trong transaction, cấp đúng quyền VIP/Premium một tháng và ghi người duyệt.
export const approveSubscription = asyncHandler(async (req, res) => {
    const approved = await subscriptionService.approveSubscription(
        req.params.subscriptionId, req.authUser._id
    );
    return res.json({
        status: 'success',
        message: 'Subscription activated',
        data: toSubscriptionDto(approved)
    });
});

// Hàm rejectSubscription: Từ chối yêu cầu đang chờ trong DB mà không thay đổi quyền thuê bao của user.
export const rejectSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.rejectSubscription(
        req.params.subscriptionId, req.authUser._id
    );
    return res.json({
        status: 'success',
        message: 'Payment request rejected',
        data: toSubscriptionDto(subscription)
    });
});
