const express = require('express');
const router  = express.Router();
const {
    getMyNotifications,
    markAllAsRead,
    markOneAsRead,
    deleteNotification,
    broadcastNotification
} = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(verifyToken);

// ─────────────────────────────────────────────
// GET    /api/notifications           → Lấy thông báo của tôi (?unread=true)
// PATCH  /api/notifications/read-all  → Đánh dấu tất cả đã đọc
// PATCH  /api/notifications/:id/read  → Đánh dấu 1 thông báo đã đọc
// DELETE /api/notifications/:id       → Xóa thông báo
// POST   /api/notifications/broadcast → Gửi hàng loạt (Admin only)
// ─────────────────────────────────────────────

router.get('/',                    getMyNotifications);
router.patch('/read-all',          markAllAsRead);
router.post('/broadcast',          verifyAdmin, broadcastNotification);
router.patch('/:id/read',          markOneAsRead);
router.delete('/:id',              deleteNotification);

module.exports = router;
