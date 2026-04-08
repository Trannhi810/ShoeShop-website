const User = require('../schemas/userSchema');
const { AppError } = require('../utils/appError');

const adminGetAllUsers = async (queryParams) => {
    const { search, role, status, page = 1, limit = 10 } = queryParams;
    const query = {};

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'locked') query.isActive = false;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit);

    return { users, total, page: parsedPage, limit: parsedLimit };
};

const adminGetUser = async (id) => {
    const user = await User.findById(id).select('-password');
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
};

const adminUpdateUser = async (id, payload) => {
    const { fullName, email, phone, address, role } = payload;
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) throw new AppError('Email này đã được sử dụng', 400);
        user.email = email;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) user.role = role;

    const updated = await user.save();
    const { password: _password, ...result } = updated.toObject();
    return result;
};

const adminToggleLock = async (targetUserId, currentUserId) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    if (user._id.toString() === currentUserId) {
        throw new AppError('Không thể khóa chính tài khoản của bạn', 400);
    }

    user.isActive = !user.isActive;
    await user.save();
    return {
        message: user.isActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
        isActive: user.isActive
    };
};

const adminDeleteUser = async (targetUserId, currentUserId) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    if (user._id.toString() === currentUserId) {
        throw new AppError('Không thể xóa chính tài khoản của bạn', 400);
    }

    await User.findByIdAndDelete(targetUserId);
    return { message: 'Xóa tài khoản thành công' };
};

module.exports = {
    adminGetAllUsers,
    adminGetUser,
    adminUpdateUser,
    adminToggleLock,
    adminDeleteUser
};
