import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as service from '../services/fine.service.js';

export const listFines = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fines retrieved successfully', data: await service.listFines(req.query, req.user)
}));
export const getFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine retrieved successfully', data: await service.getFine(req.params.id, req.user)
}));
export const payFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine marked as paid', data: await service.payFine(req.params.id)
}));
export const waiveFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine waived', data: await service.waiveFine(req.params.id, req.body.waiverReason)
}));
