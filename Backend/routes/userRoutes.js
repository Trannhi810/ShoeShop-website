const express = require('express');

const { register, login, getProfile, updateProfile } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes Authentication
router.post('/register', register);
router.post('/login', login);

// Routes truy cập Profile (Yêu cầu đăng nhập)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
