import bcrypt from 'bcrypt';
import { Librarians } from '../models/init.js';
import apiError from '../utils/api-error.js';
import { emailInUse, normalizeEmail } from './email-identity.service.js';

const publicProjection = '-hash_pass';

const ensureLibrarian = async (librarianId) => {
    const librarian = await Librarians.findById(librarianId).select(publicProjection);
    if (!librarian) throw new apiError(404, 'Librarian not found');
    return librarian;
};

export const listLibrarians = async (query = {}) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
        filter.$or = ['user_name', 'full_name', 'email'].map((field) => ({
            [field]: { $regex: query.search, $options: 'i' }
        }));
    }

    const [data, total] = await Promise.all([
        Librarians.find(filter).select(publicProjection).sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Librarians.countDocuments(filter)
    ]);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getLibrarian = (librarianId) => ensureLibrarian(librarianId);

export const createLibrarian = async ({ user_name, email, password, full_name }) => {
    if (!password || password.length < 6) {
        throw new apiError(400, 'Password must be at least 6 characters long');
    }
    const normalizedEmail = email ? normalizeEmail(email) : undefined;
    const [usernameExists, duplicateEmail] = await Promise.all([
        Librarians.exists({ user_name }),
        normalizedEmail ? emailInUse(normalizedEmail) : false
    ]);
    if (usernameExists) throw new apiError(409, 'Username is already in use');
    if (duplicateEmail) throw new apiError(409, 'Email is already in use');

    const librarian = await Librarians.create({
        user_name,
        email: normalizedEmail,
        full_name,
        hash_pass: await bcrypt.hash(password, 10),
        roll: 'librarian',
        status: 'Active'
    });
    return Librarians.findById(librarian._id).select(publicProjection);
};

export const updateLibrarian = async (librarianId, data) => {
    const librarian = await ensureLibrarian(librarianId);
    const allowedFields = ['user_name', 'full_name', 'status'];
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) librarian[field] = data[field];
    }
    if (Object.prototype.hasOwnProperty.call(data, 'email')) {
        const email = normalizeEmail(data.email);
        if (await emailInUse(email, { excludeLibrarianId: librarianId })) {
            throw new apiError(409, 'Email is already in use');
        }
        librarian.email = email;
    }
    if (data.password !== undefined) {
        if (typeof data.password !== 'string' || data.password.length < 6) {
            throw new apiError(400, 'Password must be at least 6 characters long');
        }
        librarian.hash_pass = await bcrypt.hash(data.password, 10);
    }
    await librarian.save();
    return Librarians.findById(librarian._id).select(publicProjection);
};

export const blockLibrarian = async (librarianId) => {
    const librarian = await ensureLibrarian(librarianId);
    librarian.status = 'Blocked';
    await librarian.save();
    return librarian;
};
