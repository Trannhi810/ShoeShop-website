const Notification = require('../schemas/notificationSchema');

// ─────────────────────────────────────────────
// [ANY] GET /api/notifications
// Lấy thông báo của user đang đăng nhập
// Query: ?unread=true  →  chỉ lấy chưa đọc
// Test Postman: GET http://localhost:5000/api/notifications
//              Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
    try {
        const filter = { userId: req.user.id };
        if (req.query.unread === 'true') filter.isRead = false;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// [ANY] PATCH /api/notifications/read-all
// Đánh dấu tất cả thông báo là đã đọc
// Test Postman: PATCH http://localhost:5000/api/notifications/read-all
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// [ANY] PATCH /api/notifications/:id/read
// Đánh dấu 1 thông báo là đã đọc
// Test Postman: PATCH http://localhost:5000/api/notifications/<id>/read
// ─────────────────────────────────────────────
const markOneAsRead = async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.json({ message: 'Đã đánh dấu đã đọc', notification: notif });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// [ANY] DELETE /api/notifications/:id
// Xóa 1 thông báo của user
// Test Postman: DELETE http://localhost:5000/api/notifications/<id>
// ─────────────────────────────────────────────
const deleteNotification = async (req, res) => {
    try {
        const notif = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!notif) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.json({ message: 'Đã xóa thông báo' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// [INTERNAL] Hàm tạo thông báo cho user (gọi từ controller khác)
// Ví dụ: tạo thông báo khi user đặt hàng thành công
// ─────────────────────────────────────────────
const createNotification = async (userId, title, message) => {
    try {
        await Notification.create({ userId, title, message });
    } catch (err) {
        console.error('Lỗi tạo notification:', err.message);
    }
};

// ─────────────────────────────────────────────
// [ADMIN] POST /api/notifications/broadcast
// Tạo thông báo gửi đến nhiều user (broadcast)
// Body: { userIds: [...], title, message }
// Test Postman: POST http://localhost:5000/api/notifications/broadcast
// ─────────────────────────────────────────────
const broadcastNotification = async (req, res) => {
    try {
        const { userIds, title, message } = req.body;
        if (!userIds || !Array.isArray(userIds) || !title || !message) {
            return res.status(400).json({ message: 'Thiếu thông tin: userIds (array), title, message' });
        }

        const docs = userIds.map(uid => ({ userId: uid, title, message }));
        await Notification.insertMany(docs);

        res.status(201).json({ message: `Đã gửi thông báo đến ${userIds.length} người dùng` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getMyNotifications,
    markAllAsRead,
    markOneAsRead,
    deleteNotification,
    createNotification,
    broadcastNotification
};
