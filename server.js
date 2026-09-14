import 'dotenv/config';
import express from 'express';
import bookRoutes from './src/routes/bookRoutes.js';
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

// Main challenge routes. Use /api prefix to keep API URLs organized.
app.use('/api/books', bookRoutes);

// Temporary aliases keep your old URLs working while you learn the /api convention.
app.use('/books', bookRoutes);

//app.use(notFoundHandler);
//app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});