import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as librarianService from '../services/librarian.service.js';

const currentLibrarianId = (req) => req.user.sub || req.user.id;

export const listLibrarians = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarians retrieved successfully',
    data: await librarianService.listLibrarians(req.query)
}));

export const getLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian retrieved successfully',
    data: await librarianService.getLibrarian(req.params.id)
}));

export const getMyProfile = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian profile retrieved successfully',
    data: await librarianService.getLibrarian(currentLibrarianId(req))
}));

export const createLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    statusCode: 201,
    message: 'Librarian created successfully',
    data: await librarianService.createLibrarian(req.body)
}));

export const updateLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian updated successfully',
    data: await librarianService.updateLibrarian(req.params.id, req.body)
}));

export const updateMyProfile = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian profile updated successfully',
    data: await librarianService.updateLibrarian(currentLibrarianId(req), req.body)
}));

export const blockLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian blocked successfully',
    data: await librarianService.blockLibrarian(req.params.id)
}));
