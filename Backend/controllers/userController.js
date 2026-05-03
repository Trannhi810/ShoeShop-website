const {
  register: registerService,
  login: loginService,
  getProfile: getProfileService,
  updateProfile: updateProfileService,
  googleLogin: googleLoginService
} = require('../services/authService');
const {
  adminGetAllUsers: adminGetAllUsersService,
  adminGetUser: adminGetUserService,
  adminUpdateUser: adminUpdateUserService,
  adminToggleLock: adminToggleLockService,
  adminDeleteUser: adminDeleteUserService
} = require('../services/userAdminService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

const register = async (req, res) => {
  try {
    const data = await registerService(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const data = await loginService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await getProfileService(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await updateProfileService(req.user.id, req.body);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const googleLogin = async (req, res) => {
  try {
    const data = await googleLoginService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// ===== ADMIN APIs =====

// Lấy danh sách tất cả người dùng
const adminGetAllUsers = async (req, res) => {
  try {
    const data = await adminGetAllUsersService(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// Lấy chi tiết 1 người dùng
const adminGetUser = async (req, res) => {
  try {
    const user = await adminGetUserService(req.params.id);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// Cập nhật thông tin + role
const adminUpdateUser = async (req, res) => {
  try {
    const result = await adminUpdateUserService(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// Khóa / Mở khóa tài khoản
const adminToggleLock = async (req, res) => {
  try {
    const data = await adminToggleLockService(req.params.id, req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// Xóa tài khoản
const adminDeleteUser = async (req, res) => {
  try {
    const data = await adminDeleteUserService(req.params.id, req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
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
