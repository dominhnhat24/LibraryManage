import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import validateRequest from '../middlewares/validate-request.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, validateRequest, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, validateRequest, authController.login);

export default router;