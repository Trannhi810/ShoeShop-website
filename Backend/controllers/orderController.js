const { createOrderFromCart, getOrdersByUser, getOrderDetailByUser, updateOrderStatus: updateOrderStatusService } = require('../services/orderService');
const { sendSuccess } = require('../utils/responseHelper');
const { handleServiceError } = require('../utils/serviceErrorHandler');
const Notification = require('../schemas/notificationSchema');
const socketUtils = require('../utils/socketUtils');

// POST /api/orders/checkout
const createOrder = async (req, res) => {
    try {
        const populatedOrder = await createOrderFromCart(req.user.id, req.body);
        
        // Notify user
        const orderCode = populatedOrder._id.toString().slice(-6).toUpperCase();
        const notification = await Notification.create({
            userId: req.user.id,
            title: "Trạng thái đơn hàng",
            message: `Đơn hàng #${orderCode} của bạn đã được đặt thành công!`
        });
        socketUtils.sendNotificationToUser(req.user.id, notification);

        return sendSuccess(res, populatedOrder, 'Đặt hàng thành công! Cảm ơn bạn đã mua hàng.', 201);
    } catch (error) {
        console.error('[createOrder] Error:', error);
        return handleServiceError(res, error, 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.');
    }
};

// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await getOrdersByUser(req.user.id);
        return sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        console.error('[getMyOrders] Error:', error);
        return handleServiceError(res, error);
    }
};

// GET /api/orders/:orderId
const getOrderById = async (req, res) => {
    try {
        const order = await getOrderDetailByUser(req.user.id, req.params.orderId);
        return sendSuccess(res, order, 'Lấy chi tiết đơn hàng thành công');
    } catch (error) {
        console.error('[getOrderById] Error:', error);
        return handleServiceError(res, error);
    }
};

// PATCH /api/orders/admin/:orderId/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.orderId;
        
        const updatedOrder = await updateOrderStatusService(orderId, status);
        
        // Notify Customer about status change
        let statusText = status;
        if (status === 'APPROVED') statusText = 'Đã duyệt';
        if (status === 'SHIPPING') statusText = 'Đang giao hàng';
        if (status === 'COMPLETED') statusText = 'Đã giao thành công';
        if (status === 'CANCELLED') statusText = 'Đã bị hủy';

        const orderCode = updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6).toUpperCase();
        
        const notification = await Notification.create({
            userId: updatedOrder.userId,
            title: "Cập nhật đơn hàng",
            message: `Đơn hàng #${orderCode} của bạn đã được chuyển sang trạng thái: ${statusText}`
        });
        
        socketUtils.sendNotificationToUser(updatedOrder.userId, notification);

        return sendSuccess(res, updatedOrder, 'Cập nhật trạng thái thành công');
    } catch (error) {
        console.error('[updateOrderStatus] Error:', error);
        return handleServiceError(res, error);
    }
};

module.exports = { createOrder, getMyOrders, getOrderById, updateOrderStatus };
