import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import User from '../src/models/user.model.js';
import { ROLES } from '../src/constants/roles.constant.js';

// Hàm migrateUserRoles: Đổi role cũ thành ADMIN/USER mà không thay đổi các trường quyền thuê bao VIP/Premium.
const migrateUserRoles = async () => {
    try {
        await connectDB();
        const legacyRoles = ['admin', 'free', 'vip', 'premium', 'author'];
        const allowedRoles = [...legacyRoles, ...Object.values(ROLES)];
        const unsupportedRoles = await User.collection.distinct('role', {
            role: { $nin: allowedRoles }
        });
        if (unsupportedRoles.length) {
            throw new Error(`Unsupported existing user roles: ${unsupportedRoles.join(', ')}`);
        }

        const [admins, users] = await Promise.all([
            User.collection.updateMany({ role: 'admin' }, { $set: { role: ROLES.ADMIN } }),
            User.collection.updateMany(
                { role: { $in: ['free', 'vip', 'premium', 'author'] } },
                { $set: { role: ROLES.USER } }
            )
        ]);
        console.info(`Migrated ${admins.modifiedCount} ADMIN and ${users.modifiedCount} USER accounts`);
    } finally {
        await mongoose.disconnect();
    }
};

await migrateUserRoles();
