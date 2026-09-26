import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import * as controller from '../controllers/librarian.controller.js';
import {
    validateCreateLibrarian,
    validateLibrarianId,
    validateLibrarianQuery,
    validateProfileUpdate,
    validateUpdateLibrarian
} from '../validators/librarian.validator.js';

const router = express.Router();
router.use(loginRequired, checkRole('librarian'));

router.get('/me', controller.getMyProfile);
router.put('/me', validateProfileUpdate, validateRequest, controller.updateMyProfile);
router.get('/', validateLibrarianQuery, validateRequest, controller.listLibrarians);
router.post('/', validateCreateLibrarian, validateRequest, controller.createLibrarian);
router.get('/:id', validateLibrarianId, validateRequest, controller.getLibrarian);
router.put('/:id', validateUpdateLibrarian, validateRequest, controller.updateLibrarian);
router.patch('/:id/block', validateLibrarianId, validateRequest, controller.blockLibrarian);

export default router;
