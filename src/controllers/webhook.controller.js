// [CONTROLLER WEBHOOK]
import { asyncHandler } from '../utils/async-handler.js';
import * as subscriptionService from '../services/subscription.service.js';
import { timingSafeEqual } from 'node:crypto';

// [SEPAY WEBHOOK] Xác thực API key, đối chiếu mã giao dịch/số tiền rồi tự kích hoạt thuê bao.
export const handleSepayWebhook = asyncHandler(async (req, res) => {
    const configuredKey = String(process.env.SEPAY_WEBHOOK_API_KEY || '');
    const authorization = String(req.get('authorization') || '');
    const suppliedKey = authorization.match(/^Apikey\s+(.+)$/i)?.[1] || '';
    const expected = Buffer.from(configuredKey);
    const supplied = Buffer.from(suppliedKey);
    if (!configuredKey || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        return res.status(configuredKey ? 401 : 503).json({ success: false, message: 'Webhook authentication failed' });
    }

    const result = await subscriptionService.processPaymentWebhook(req.body);
    if (!result.matched) {
        console.warn(`[SEPAY] Transaction ${String(req.body.id || 'unknown')} not applied: ${result.reason}`);
        return res.status(200).json({ success: true, matched: false, reason: result.reason });
    }
    return res.status(200).json({ success: true, matched: true, duplicate: result.duplicate });
});
