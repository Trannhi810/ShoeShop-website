const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = "839295398542-omtv5qflf1qgej5b1dpotj95a4d80qeg.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const User = require('../schemas/userSchema');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev_jwt_secret',
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      address,
      role: 'CUSTOMER' // Bắt buộc mọi tài khoản đăng ký mới là Customer
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    const updatedUser = await user.save();
    return res.status(200).json({
      id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      address: updatedUser.address,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Nếu bạn muốn test thật thì điền GOOGLE_CLIENT_ID ở file .env
    // Còn nếu không, fake verify hoặc đổi audience cẩn thận 
    // Tuy nhiên ở code bài tập ta sẽ gọi chuẩn hàm verifyIdToken 
    // (Lưu ý: google auth library sẽ báo lỗi nếu xài ID sai, hãy dùng Client ID thật nếu cần)

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Nếu chưa tồn tại -> Tự động đăng ký
      user = await User.create({
        email,
        fullName: name,
        googleId,
        role: 'CUSTOMER', // Mặc định role là Customer
      });
    }

    // Đăng nhập thành công, tạo JWT nội bộ
    const appToken = generateToken(user);

    return res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        picture, 
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Xác thực Google thất bại!", error: error.message });
  }
};

// ===== ADMIN APIs =====

// Lấy danh sách tất cả người dùng
const adminGetAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'locked') query.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết 1 người dùng
const adminGetUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin + role
const adminUpdateUser = async (req, res) => {
  try {
    const { fullName, email, phone, address, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // Kiểm tra email trùng (nếu đổi email)
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email này đã được sử dụng' });
      user.email = email;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) user.role = role;

    const updated = await user.save();
    const { password: _, ...result } = updated.toObject();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Khóa / Mở khóa tài khoản
const adminToggleLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // Không cho tự khóa chính mình
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Không thể khóa chính tài khoản của bạn' });
    }

    user.isActive = !user.isActive;
    await user.save();
    return res.status(200).json({
      message: user.isActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
      isActive: user.isActive
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa tài khoản
const adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Không thể xóa chính tài khoản của bạn' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  googleLogin,
  // Admin
  adminGetAllUsers,
  adminGetUser,
  adminUpdateUser,
  adminToggleLock,
  adminDeleteUser,
};
