// [CONTROLLER WEBHOOK]
import { asyncHandler } from '../utils/async-handler.js';
import * as subscriptionService from '../services/subscription.service.js';

// [WEBHOOK CONTROLLER] Nhận thông báo giao dịch tự động từ bên thứ ba
export const handlePaymentWebhook = asyncHandler(async (req, res) => {
    // Tùy thuộc vào cấu trúc payload của bên cung cấp webhook (MoMo, Sepay, Casso...)
    // Ví dụ cấu trúc chung: content/description, amount, transId
    const { content, amount, transId, gateway } = req.body;

    const result = await subscriptionService.processPaymentWebhook({
        content: content || req.body.memo,
        transferAmount: Number(amount || req.body.transferAmount),
        transactionId: String(transId || req.body.id),
        gateway: gateway || 'momo'
    });

    if (!result) {
        // Vẫn trả về 200 cho bên thứ ba để họ không retry liên tục, 
        // đồng thời lưu vào log hệ thống để Admin kiểm tra thủ công.
        return res.status(200).json({
            status: 'success',
            message: 'Webhook received, but no matching pending subscription found. Logged for manual review.'
        });
    }

    return res.status(200).json({
        status: 'success',
        message: 'Subscription activated automatically via webhook',
        data: result
    });
}); 