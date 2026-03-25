const express = require('express');

const {
  register, login, getProfile, updateProfile, googleLogin,
  adminGetAllUsers, adminGetUser, adminUpdateUser, adminToggleLock, adminDeleteUser
} = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes Authentication
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

// Routes truy cập Profile (Yêu cầu đăng nhập)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// ===== ADMIN Routes (Yêu cầu ADMIN) =====
router.get('/admin/users', verifyToken, verifyAdmin, adminGetAllUsers);
router.get('/admin/users/:id', verifyToken, verifyAdmin, adminGetUser);
router.put('/admin/users/:id', verifyToken, verifyAdmin, adminUpdateUser);
router.patch('/admin/users/:id/toggle-lock', verifyToken, verifyAdmin, adminToggleLock);
router.delete('/admin/users/:id', verifyToken, verifyAdmin, adminDeleteUser);

module.exports = router;
