
import './src/config/load-env.js';
import mongoose from 'mongoose';

async function testConnection() {
    try {
        const uri = process.env.MONGODB_URI;

        console.log('URI exists:', Boolean(uri));
        console.log('Uses mongodb+srv:', uri?.startsWith('mongodb+srv://'));

        if (!uri) {
            throw new Error('MONGODB_URI is missing');
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
        });

        console.log('MongoDB connected successfully');
        console.log('Connection state:', mongoose.connection.readyState);
    } catch (error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        for (const [host, server] of error.reason?.servers ?? []) {
            console.error(host, {
                type: server.type,
                error: server.error?.message,
            });
        }

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect().catch(() => {});
    }
}

testConnection();

