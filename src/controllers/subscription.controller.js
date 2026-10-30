// [CONTROLLER THUÊ BAO] Tạo yêu cầu thanh toán tay và xử lý quyết định admin.
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
/**
 * Tệp src/controllers/subscription.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { asyncHandler } from '../utils/async-handler.js';
// Import * as subscriptionService từ ../services/subscription.service.js để dùng trong module.
import * as subscriptionService from '../services/subscription.service.js';
// Import { mapDtoList, toSubscriptionDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toSubscriptionDto } from '../utils/api-dto.js';

// [YÊU CẦU THÀNH VIÊN] Ghi nhận yêu cầu gói VIP/Premium; chỉ bật quyền sau khi ADMIN duyệt.
// Khai báo createSubscription nhận giá trị từ asyncHandler(async (req, res) => { const subscription =. const giữ biến không gán lại; let cho phép cập nhật.
export const createSubscription = asyncHandler(async (req, res) => {
    // Khai báo subscription nhận giá trị từ await subscriptionService.createSubscription(req.authUs. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await subscriptionService.createSubscription(req.authUser._id, { ...req.body });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', message: 'Payment request submitt về nơi gọi.
    return res.status(201).json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Payment request submitted; waiting for payment confirm làm giá trị trong object.
        message: 'Payment request submitted; waiting for payment confirmation',
        // Trường data lưu { ...toSubscriptionDto(subscription), payment_instructi làm giá trị trong object.
        data: {
            ...toSubscriptionDto(subscription),
            // Trường payment_instructions lưu { amount_vnd: subscription.amount_vnd, transfer_note: s làm giá trị trong object.
            payment_instructions: {
                // Trường amount_vnd lưu subscription.amount_vnd làm giá trị trong object.
                amount_vnd: subscription.amount_vnd,
                // Trường transfer_note lưu subscription.transfer_note làm giá trị trong object.
                transfer_note: subscription.transfer_note,
                // Trường bank_name lưu process.env.BANK_NAME || null làm giá trị trong object.
                bank_name: process.env.BANK_NAME || null,
                // Trường bank_account lưu process.env.BANK_ACCOUNT || null làm giá trị trong object.
                bank_account: process.env.BANK_ACCOUNT || null,
                // Trường bank_account_name lưu process.env.BANK_ACCOUNT_NAME || null làm giá trị trong object.
                bank_account_name: process.env.BANK_ACCOUNT_NAME || null
            }
        }
    });
});

// [LỊCH SỬ THUÊ BAO] Chỉ trả các yêu cầu thuộc tài khoản đăng nhập hiện tại.
// Khai báo getMySubscriptions nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getMySubscriptions = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await subscriptionService.getMySubscriptions(req.authUs. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await subscriptionService.getMySubscriptions(req.authUser._id, { page: 1, limit: 1 });
    // Khai báo subscription nhận giá trị từ result.subscriptions[0] || null. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = result.subscriptions[0] || null;
    // return kết thúc hàm và trả res.json({ status: 'success', data: subscription ? { ...toSubscriptionDto(s về nơi gọi.
    return res.json({ status: 'success', data: subscription ? {
        ...toSubscriptionDto(subscription),
        // Trường status lưu subscription.status === 'active' && subscription.expire làm giá trị trong object.
        status: subscription.status === 'active' && subscription.expires_at <= new Date()
            ? 'expired' : subscription.status,
        // Trường startsAt lưu subscription.starts_at làm giá trị trong object.
        startsAt: subscription.starts_at,
        // Trường expiresAt lưu subscription.expires_at làm giá trị trong object.
        expiresAt: subscription.expires_at,
        // Trường payment_instructions lưu subscription.status === 'pending' ? { amount_vnd: subsc làm giá trị trong object.
        payment_instructions: subscription.status === 'pending' ? {
            // Trường amount_vnd lưu subscription.amount_vnd làm giá trị trong object.
            amount_vnd: subscription.amount_vnd,
            // Trường transfer_note lưu subscription.transfer_note làm giá trị trong object.
            transfer_note: subscription.transfer_note,
            // Trường bank_name lưu process.env.BANK_NAME || null làm giá trị trong object.
            bank_name: process.env.BANK_NAME || null,
            // Trường bank_account lưu process.env.BANK_ACCOUNT || null làm giá trị trong object.
            bank_account: process.env.BANK_ACCOUNT || null,
            // Trường bank_account_name lưu process.env.BANK_ACCOUNT_NAME || null làm giá trị trong object.
            bank_account_name: process.env.BANK_ACCOUNT_NAME || null
        } : undefined
    } : null });
});

// Hàm getAllSubscriptions: Gọi service phân trang/lọc các yêu cầu thanh toán và trả metadata cho Admin.
// Khai báo getAllSubscriptions nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await subscriptionService.getAllSubscriptions({ ...req.. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await subscriptionService.getAllSubscriptions({ ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.subscriptions, toSubs về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.subscriptions, toSubscriptionDto) làm giá trị trong object.
        data: mapDtoList(result.subscriptions, toSubscriptionDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getSubscription: Lấy chi tiết một yêu cầu thuê bao theo ID qua service.
// Khai báo getSubscription nhận giá trị từ asyncHandler(async (req, res) => { const subscription =. const giữ biến không gán lại; let cho phép cập nhật.
export const getSubscription = asyncHandler(async (req, res) => {
    // Khai báo subscription nhận giá trị từ await subscriptionService.getSubscriptionById(req.param. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await subscriptionService.getSubscriptionById(req.params.subscriptionId);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toSubscriptionDto(subscription) }) về nơi gọi.
    return res.json({ status: 'success', data: toSubscriptionDto(subscription) });
});

// Hàm updateSubscription: Chỉ cập nhật tham chiếu chuyển khoản khi yêu cầu còn chờ, không đổi quyền hoặc trạng thái.
// Khai báo updateSubscription nhận giá trị từ asyncHandler(async (req, res) => { const subscription =. const giữ biến không gán lại; let cho phép cập nhật.
export const updateSubscription = asyncHandler(async (req, res) => {
    // Khai báo subscription nhận giá trị từ await subscriptionService.updateSubscription( req.param. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await subscriptionService.updateSubscription(
        req.params.subscriptionId, { ...req.body }
    );
    // return kết thúc hàm và trả res.json({ status: 'success', data: toSubscriptionDto(subscription) }) về nơi gọi.
    return res.json({ status: 'success', data: toSubscriptionDto(subscription) });
});

// Hàm deleteSubscription: Xóa yêu cầu đang chờ duyệt qua service và trả bản ghi đã xóa.
// Khai báo deleteSubscription nhận giá trị từ asyncHandler(async (req, res) => { const subscription =. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteSubscription = asyncHandler(async (req, res) => {
    // Khai báo subscription nhận giá trị từ await subscriptionService.deleteSubscription(req.params. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await subscriptionService.deleteSubscription(req.params.subscriptionId);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Subscription request deleted', data về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Subscription request deleted' làm giá trị trong object.
        message: 'Subscription request deleted',
        // Trường data lưu toSubscriptionDto(subscription) làm giá trị trong object.
        data: toSubscriptionDto(subscription)
    });
});

// Hàm approveSubscription: Duyệt yêu cầu trong transaction, cấp đúng quyền VIP/Premium một tháng và ghi người duyệt.
// Khai báo approveSubscription nhận giá trị từ asyncHandler(async (req, res) => { const approved = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const approveSubscription = asyncHandler(async (req, res) => {
    // Khai báo approved nhận giá trị từ await subscriptionService.approveSubscription( req.para. const giữ biến không gán lại; let cho phép cập nhật.
    const approved = await subscriptionService.approveSubscription(
        req.params.subscriptionId, req.authUser._id
    );
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Subscription activated', data: toSu về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Subscription activated' làm giá trị trong object.
        message: 'Subscription activated',
        // Trường data lưu toSubscriptionDto(approved) làm giá trị trong object.
        data: toSubscriptionDto(approved)
    });
});

// Hàm rejectSubscription: Từ chối yêu cầu đang chờ trong DB mà không thay đổi quyền thuê bao của user.
// Khai báo rejectSubscription nhận giá trị từ asyncHandler(async (req, res) => { const subscription =. const giữ biến không gán lại; let cho phép cập nhật.
export const rejectSubscription = asyncHandler(async (req, res) => {
    // Khai báo subscription nhận giá trị từ await subscriptionService.rejectSubscription( req.param. const giữ biến không gán lại; let cho phép cập nhật.
    const subscription = await subscriptionService.rejectSubscription(
        req.params.subscriptionId, req.authUser._id
    );
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Payment request rejected', data: to về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Payment request rejected' làm giá trị trong object.
        message: 'Payment request rejected',
        // Trường data lưu toSubscriptionDto(subscription) làm giá trị trong object.
        data: toSubscriptionDto(subscription)
    });
});
