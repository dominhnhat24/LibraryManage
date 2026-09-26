import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as service from '../services/borrowCard.service.js';

export const createBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    statusCode: 201, message: 'Borrow card created successfully',
    data: await service.createBorrowCard({
        readerId: req.user.sub || req.user.id,
        copyIds: req.body.copyIds,
        dueDate: req.body.dueDate
    })
}));
export const listBorrowCards = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow cards retrieved successfully', data: await service.listBorrowCards(req.query, req.user)
}));
export const getBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card retrieved successfully', data: await service.getBorrowCard(req.params.id, req.user)
}));
export const cancelBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card cancelled successfully', data: await service.cancelBorrowCard(req.params.id, req.user)
}));
export const approveBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card approved successfully',
    data: await service.approveBorrow(req.params.id, req.user.sub || req.user.id)
}));
export const returnBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Books returned successfully',
    data: await service.returnBook(req.params.id, req.body.returns, req.user.sub || req.user.id)
}));
