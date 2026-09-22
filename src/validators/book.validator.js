import { body, query, param } from 'express-validator';
import * as db from '../models/init.js';
import * as apiError from '../utils/api-error.js';

const allowedBookFields = ['bookId', 'title', 'author', 'publishYear', 'categoryId'];

// Hàm kiểm tra sách có tồn tại trong DB không
const bookMustExist = async (bookId) => {
    if (!bookId) return;
    
    // Nếu dùng Mongoose (MongoDB): db.Books.findById(bookId)
    // Nếu dùng Sequelize (SQL): db.Books.findByPk(bookId)
    const book = await db.Books.findByPk(bookId);
    
    if (!book) {
        throw new Error('bookId không tồn tại trên hệ thống');
    }
};

// 1. Validate TẠO SÁCH MỚI (POST /api/books)
// Note: Không validate book_id vì ID do Database tự sinh
export const validateCreateBook = [
    body('title')
        .exists({ checkFalsy: true })
        .withMessage('title is required')
        .bail()
        .isLength({ min: 2, max: 255 })
        .withMessage('title must be between 2 and 255 characters')
];

// 2. Validate CẬP NHẬT SÁCH (PUT/PATCH /api/books/:id)
export const validateUpdateBook = [
    // Bắt buộc phải truyền ít nhất 1 trường hợp lệ trong allowedBookFields
    body()
        // value là object req.body (lớp JSON mà client gửi lên)
        //field là tên của trường dữ liệu đang được xét tới trong mản allowedBookFields
        //hasOwnProperty(field): Dùng để kiểm tra xem value có thực sự chứa trực tiếp thuộc tính field đó hay không.
        //Object.prototype là một hàm kế thừa của JS mà mọi Object đều có thể sử dụng
        //trong Object.prototype có hàm hasOwnProperty
        //hàm hasOwnProperty và some 
        //some quét qua các field có trong mảng của allowedBookFields 

        /*hasOwnProperty sẽ kiểm tra các field đó 
        có thật sự tồn tại không khi some quét qua và trả về kiểu dữ liệu Bool */
        
        .custom((value) => allowedBookFields.some((field) => Object.prototype.hasOwnProperty.call(value, field)))
        .withMessage('At least one book field must be provided'),

    body('book_id')
        .optional()
        .isMongoId() // Đã bỏ { min: 1 } sai cú pháp
        .withMessage('book_id must be a valid MongoDB ObjectId')
        .bail()
        .custom(bookMustExist),

    body('title')
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage('title must be between 2 and 255 characters')
];

// 3. Validate LẤY DẠNH SÁCH SÁCH (GET /api/books?page=1&limit=10)
export const validateGetAllBook = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page phải là số nguyên từ 1 trở lên')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit phải từ 1 đến 100')
        .toInt(),

    query('search')
        .optional()
        .isString()
        .withMessage('search phải là chuỗi')
        .trim(),

    query('categoryId')
        .optional()
        .isMongoId()
        .withMessage('categoryId không đúng định dạng')
];

// 4. Validate XEM CHI TIẾT SÁCH THEO ID (GET /api/books/:id)
export const validateGetBookById = [
    param('id')
        .isMongoId()
        .withMessage('ID sách không đúng định dạng MongoDB')
        .bail()
        .custom(bookMustExist)
];