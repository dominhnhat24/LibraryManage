import * as authService from '../services/auth.service.js';
import asyncHandler from '../middlewares/async-handler.js';

export const register = asyncHandler(async (req, res) => {
    const result = await authService.serviceRegister(req.body);

    return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.serviceLogin(email, password);

    return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
    });
});