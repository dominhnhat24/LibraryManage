import {body} from 'express-validator';
import * as db from '../models/init.js';
import * as apiError from '../utils/api-error.js';

const allowedClassFields = ['course_id', 'class_name'];

const courseMustExist = async (bookId) => {
    const course = await db.courses.findByPk(courseId);

    if (!course) {
        throw new Error('course_id does not exist');
    }
};

// Create requires course_id and class_name because both columns are NOT NULL.
const validateCreateClass = [
    body('course_id')
        .exists({ checkFalsy: true })
        .withMessage('course_id is required')
        .bail()
        .isInt({ min: 1 })
        .withMessage('course_id must be a positive integer')
        .toInt()
        .bail()
        .custom(courseMustExist),

    body('class_name')
        .exists({ checkFalsy: true })
        .withMessage('class_name is required')
        .bail()
        .isLength({ min: 2, max: 255 })
        .withMessage('class_name must be between 2 and 255 characters')
];

// Update accepts partial data, but at least one editable field must be provided.
const validateUpdateClass = [
    body()
        .custom((value) => allowedClassFields.some((field) => Object.prototype.hasOwnProperty.call(value, field)))
        .withMessage('At least one class field must be provided'),

    body('course_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('course_id must be a positive integer')
        .toInt()
        .bail()
        .custom(courseMustExist),

    body('class_name')
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage('class_name must be between 2 and 255 characters')
];

module.exports = {
    validateCreateClass,
    validateUpdateClass
};
