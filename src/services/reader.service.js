import * as db from '../models/index.js';
import * as apiError from '../utils/api-error.js';

export const getAllReaders = async () => {
    return await db.Readers.find({}).sort({ createdAt: -1 });
}