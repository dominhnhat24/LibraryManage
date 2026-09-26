import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import { getSummary } from '../controllers/dashboard.controller.js';

const router = express.Router();
router.get('/', loginRequired, checkRole('librarian'), getSummary);

export default router;
