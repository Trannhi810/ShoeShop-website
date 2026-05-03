const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../schemas/userSchema');
const { generateToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/appError');

const GOOGLE_CLIENT_ID = '839295398542-omtv5qflf1qgej5b1dpotj95a4d80qeg.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const register = async ({ email, password, fullName, phone, address }) => {
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        address,
        role: 'CUSTOMER'
    });

    return {
        token: generateToken(user),
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address
        }
    };
};

const login = async ({ email, password }) => {
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }
    const user = await User.findOne({ email });
    if (!user || !user.password) {
        throw new AppError('Invalid email or password', 401);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new AppError('Invalid email or password', 401);
    }
    if (!user.isActive) {
        throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    return {
        token: generateToken(user),
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            isActive: user.isActive
        }
    };
};

const getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
};

const updateProfile = async (userId, { fullName, phone, address }) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    const updatedUser = await user.save();

    return {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        address: updatedUser.address
    };
};

const googleLogin = async ({ token }) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                fullName: name,
                googleId,
                role: 'CUSTOMER'
            });
        }

        return {
            token: generateToken(user),
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                picture
            }
        };
    } catch (error) {
        throw new AppError('Xác thực Google thất bại!', 401);
    }
};

module.exports = { register, login, getProfile, updateProfile, googleLogin };
