import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import { getDashboardSummary } from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Dashboard summary retrieved successfully',
    data: await getDashboardSummary()
}));
