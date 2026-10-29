import { asyncHandler } from '../utils/async-handler.js';
import { removeAvatar, resolveAvatar, saveAvatar } from '../utils/avatar-storage.js';
import { toUserDto } from '../utils/api-dto.js';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';

const avatarKeyFromUrl = (value) => {
    const prefix = '/api/v1/auth/avatars/';
    return typeof value === 'string' && value.startsWith(prefix) ? value.slice(prefix.length) : null;
};

export const uploadMyAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Avatar image is required');
    const stored = await saveAvatar(req.file);
    const avatarUrl = `/api/v1/auth/avatars/${stored.key}`;
    const oldKey = avatarKeyFromUrl(req.authUser.avatar_url);
    let user;
    try {
        user = await User.findByIdAndUpdate(req.authUser._id, { $set: { avatar_url: avatarUrl } },
            { new: true, runValidators: true });
        if (!user) throw new ApiError(404, 'User not found');
    } catch (error) {
        await removeAvatar(stored.key).catch(() => {});
        throw error;
    }
    if (oldKey && oldKey !== stored.key) await removeAvatar(oldKey).catch(() => {});
    return res.json({ status: 'success', data: toUserDto(user) });
});

export const serveAvatar = asyncHandler(async (req, res) => {
    const avatar = await resolveAvatar(req.params.key);
    return res.sendFile(avatar.path, { headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': avatar.content_type,
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline'
    } });
});
