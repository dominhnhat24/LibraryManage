import 'dotenv/config';
import express from 'express';
import bookRouter from './src/routes/book.route.js';
import bookCopiesRouter from './src/routes/bookCopies.route.js';
import readerRouter from './src/routes/reader.route.js';
import { connectDB } from './src/models/init.js';
//import { notFoundHandler, errorHandler } from './middleware/errorHandlers.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware để đọc dữ liệu JSON từ request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gọi hàm kết nối MongoDB
connectDB();

app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API Running'
    });
});

app.use('/api/v1/books', bookRouter);
app.use('/api/v1/book-copies', bookCopiesRouter);
app.use('/api/v1/readers', readerRouter);


//app.use(notFoundHandler);
//app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});