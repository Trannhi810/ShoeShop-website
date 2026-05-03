const Notification = require('../schemas/notificationSchema');
const { AppError } = require('../utils/appError');

const getMyNotifications = async (userId, unread) => {
    const filter = { userId };
    if (unread === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    return { notifications, unreadCount };
};

const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
};

const markOneAsRead = async (id, userId) => {
    const notif = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
    );
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    return { message: 'Đã đánh dấu đã đọc', notification: notif };
};

const deleteNotification = async (id, userId) => {
    const notif = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    return { message: 'Đã xóa thông báo' };
};

const createNotification = async (userId, title, message) => {
    try {
        await Notification.create({ userId, title, message });
    } catch (error) {
        console.error('Lỗi tạo notification:', error.message);
    }
};

const broadcastNotification = async ({ userIds, title, message }) => {
    if (!userIds || !Array.isArray(userIds) || !title || !message) {
        throw new AppError('Thiếu thông tin: userIds (array), title, message', 400);
    }
    const docs = userIds.map((uid) => ({ userId: uid, title, message }));
    await Notification.insertMany(docs);
    return { message: `Đã gửi thông báo đến ${userIds.length} người dùng` };
};

module.exports = {
    getMyNotifications,
    markAllAsRead,
    markOneAsRead,
    deleteNotification,
    createNotification,
    broadcastNotification
};
