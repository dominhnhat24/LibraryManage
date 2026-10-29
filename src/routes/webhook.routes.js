import { Router } from 'express';
import { handleSepayWebhook } from '../controllers/webhook.controller.js';

const router = Router();
router.post('/sepay', handleSepayWebhook);

export default router;
