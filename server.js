import 'dotenv/config';
import express from 'express';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import bookRouter from './src/routes/book.route.js';
import bookCopiesRouter from './src/routes/bookCopies.route.js';
import readerRouter from './src/routes/reader.route.js';
import authRouter from './src/routes/auth.route.js';
import { connectDB } from './src/models/init.js';
import errorHandler from './src/middlewares/error-handler.js';
import borrowCardRouter from './src/routes/borrowCard.route.js';
import fineRouter from './src/routes/fine.route.js';
import apiError from './src/utils/api-error.js';
import librarianRouter from './src/routes/librarian.route.js';

export const app = express();
const PORT = process.env.PORT || 5001;

// Middleware để đọc dữ liệu JSON từ request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gọi hàm kết nối MongoDB
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API Running'
    });
});

app.use('/api/v1/books', bookRouter);
app.use('/api/v1/book-copies', bookCopiesRouter);
app.use('/api/v1/readers', readerRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/borrow-cards', borrowCardRouter);
app.use('/api/v1/fines', fineRouter);
app.use('/api/v1/librarians', librarianRouter);

app.use((req, res, next) => next(new apiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));
app.use(errorHandler);

const startServer = async () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}