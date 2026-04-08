const express = require('express');
const router  = express.Router();
const { getDashboardStats, getStaffStats } = require('../controllers/statsController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Middleware cho Admin hoặc Staff
const verifyAdminOrStaff = (req, res, next) => {
    if (req.user && ['ADMIN', 'STAFF'].includes(req.user.role)) return next();
    return res.status(403).json({ message: 'Không có quyền truy cập!' });
};

// ─────────────────────────────────────────────
// GET /api/stats/dashboard  → Chỉ ADMIN
// GET /api/stats/staff      → ADMIN hoặc STAFF
// ─────────────────────────────────────────────
router.get('/dashboard', verifyToken, verifyAdmin,        getDashboardStats);
router.get('/staff',     verifyToken, verifyAdminOrStaff, getStaffStats);

module.exports = router;
