import { Librarians, Readers } from '../models/init.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const emailLookupPattern = (email) => new RegExp(`^${escapeRegex(normalizeEmail(email))}$`, 'i');

export const emailInUse = async (email, { excludeReaderId, excludeLibrarianId } = {}) => {
    const emailPattern = emailLookupPattern(email);
    const [reader, librarian] = await Promise.all([
        Readers.exists({
            email: emailPattern,
            ...(excludeReaderId ? { _id: { $ne: excludeReaderId } } : {})
        }),
        Librarians.exists({
            email: emailPattern,
            ...(excludeLibrarianId ? { _id: { $ne: excludeLibrarianId } } : {})
        })
    ]);
    return Boolean(reader || librarian);
};
