// [CONTROLLER WEBHOOK]
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
/**
 * Tệp src/controllers/webhook.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { asyncHandler } from '../utils/async-handler.js';
// Import * as subscriptionService từ ../services/subscription.service.js để dùng trong module.
import * as subscriptionService from '../services/subscription.service.js';
// Import { timingSafeEqual } từ node:crypto để dùng trong module.
import { timingSafeEqual } from 'node:crypto';

// [SEPAY WEBHOOK] Xác thực API key, đối chiếu mã giao dịch/số tiền rồi tự kích hoạt thuê bao.
// Khai báo handleSepayWebhook nhận giá trị từ asyncHandler(async (req, res) => { const configuredKey . const giữ biến không gán lại; let cho phép cập nhật.
export const handleSepayWebhook = asyncHandler(async (req, res) => {
    // Khai báo configuredKey nhận giá trị từ String(process.env.SEPAY_WEBHOOK_API_KEY || ''). const giữ biến không gán lại; let cho phép cập nhật.
    const configuredKey = String(process.env.SEPAY_WEBHOOK_API_KEY || '');
    // Khai báo authorization nhận giá trị từ String(req.get('authorization') || ''). const giữ biến không gán lại; let cho phép cập nhật.
    const authorization = String(req.get('authorization') || '');
    // Khai báo suppliedKey nhận giá trị từ authorization.match(/^Apikey\s+(.+)$/i)?.[1] || ''. const giữ biến không gán lại; let cho phép cập nhật.
    const suppliedKey = authorization.match(/^Apikey\s+(.+)$/i)?.[1] || '';
    // Khai báo expected nhận giá trị từ Buffer.from(configuredKey). const giữ biến không gán lại; let cho phép cập nhật.
    const expected = Buffer.from(configuredKey);
    // Khai báo supplied nhận giá trị từ Buffer.from(suppliedKey). const giữ biến không gán lại; let cho phép cập nhật.
    const supplied = Buffer.from(suppliedKey);
    // if chỉ chạy nhánh này khi điều kiện !configuredKey || expected.length !== supplied.length || !timingSafeEqual(e đúng.
    if (!configuredKey || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        // return kết thúc hàm và trả res.status(configuredKey ? 401 : 503).json({ success: false, message: 'Webh về nơi gọi.
        return res.status(configuredKey ? 401 : 503).json({ success: false, message: 'Webhook authentication failed' });
    }

    // Khai báo result nhận giá trị từ await subscriptionService.processPaymentWebhook(req.bod. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await subscriptionService.processPaymentWebhook(req.body);
    // if chỉ chạy nhánh này khi điều kiện !result.matched đúng.
    if (!result.matched) {
        // Gọi/thực thi console.warn với các đối số để thực hiện thao tác: console.warn(`[SEPAY] Transaction ${String(req.body.id || 'unknown')} not a
        console.warn(`[SEPAY] Transaction ${String(req.body.id || 'unknown')} not applied: ${result.reason}`);
        // return kết thúc hàm và trả res.status(200).json({ success: true, matched: false, reason: result.reason về nơi gọi.
        return res.status(200).json({ success: true, matched: false, reason: result.reason });
    }
    // return kết thúc hàm và trả res.status(200).json({ success: true, matched: true, duplicate: result.dupl về nơi gọi.
    return res.status(200).json({ success: true, matched: true, duplicate: result.duplicate });
});
