const express = require('express');

const {
  register, login, getProfile, updateProfile, googleLogin,
  adminGetAllUsers, adminGetUser, adminUpdateUser, adminToggleLock, adminDeleteUser
} = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

router.get('/me', verifyToken, getProfile);
router.patch('/me', verifyToken, updateProfile);

// Admin Routes for Users
router.get('/', verifyToken, verifyAdmin, adminGetAllUsers);
router.get('/:id', verifyToken, verifyAdmin, adminGetUser);
router.put('/:id', verifyToken, verifyAdmin, adminUpdateUser);
router.patch('/:id/toggle-lock', verifyToken, verifyAdmin, adminToggleLock);
router.delete('/:id', verifyToken, verifyAdmin, adminDeleteUser);

module.exports = router;
