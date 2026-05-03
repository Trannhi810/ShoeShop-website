const {
    getMyNotifications: getMyNotificationsService,
    markAllAsRead: markAllAsReadService,
    markOneAsRead: markOneAsReadService,
    deleteNotification: deleteNotificationService,
    createNotification: createNotificationService,
    broadcastNotification: broadcastNotificationService
} = require('../services/notificationService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// ─────────────────────────────────────────────
// [ANY] GET /api/notifications
// Lấy thông báo của user đang đăng nhập
// Query: ?unread=true  →  chỉ lấy chưa đọc
// Test Postman: GET http://localhost:5000/api/notifications
//              Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
    try {
        const data = await getMyNotificationsService(req.user.id, req.query.unread);
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

// ─────────────────────────────────────────────
// [ANY] PATCH /api/notifications/read-all
// Đánh dấu tất cả thông báo là đã đọc
// Test Postman: PATCH http://localhost:5000/api/notifications/read-all
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
    try {
        const data = await markAllAsReadService(req.user.id);
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

// ─────────────────────────────────────────────
// [ANY] PATCH /api/notifications/:id/read
// Đánh dấu 1 thông báo là đã đọc
// Test Postman: PATCH http://localhost:5000/api/notifications/<id>/read
// ─────────────────────────────────────────────
const markOneAsRead = async (req, res) => {
    try {
        const data = await markOneAsReadService(req.params.id, req.user.id);
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

// ─────────────────────────────────────────────
// [ANY] DELETE /api/notifications/:id
// Xóa 1 thông báo của user
// Test Postman: DELETE http://localhost:5000/api/notifications/<id>
// ─────────────────────────────────────────────
const deleteNotification = async (req, res) => {
    try {
        const data = await deleteNotificationService(req.params.id, req.user.id);
        res.json(data);
    } catch (err) {
        return handleServiceError(res, err);
    }
};

// ─────────────────────────────────────────────
// [INTERNAL] Hàm tạo thông báo cho user (gọi từ controller khác)
// Ví dụ: tạo thông báo khi user đặt hàng thành công
// ─────────────────────────────────────────────
const createNotification = async (userId, title, message) => {
    return createNotificationService(userId, title, message);
};

// ─────────────────────────────────────────────
// [ADMIN] POST /api/notifications/broadcast
// Tạo thông báo gửi đến nhiều user (broadcast)
// Body: { userIds: [...], title, message }
// Test Postman: POST http://localhost:5000/api/notifications/broadcast
// ─────────────────────────────────────────────
const broadcastNotification = async (req, res) => {
    try {
        const data = await broadcastNotificationService(req.body);
        res.status(201).json(data);
    } catch (err) {
        return handleServiceError(res, err);
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
