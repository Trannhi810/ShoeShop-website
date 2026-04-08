const { 
    createOrderFromCart, 
    getOrdersByUser, 
    getOrderDetailByUser, 
    getAllOrdersAdmin, 
    updateOrderStatusAdmin, 
    cancelOrderUser 
} = require('../services/orderService');
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
// GET /api/orders/admin
const getAllOrdersAdminHandler = async (req, res) => {
    try {
        const { page, limit, status, search, date } = req.query;
        const result = await getAllOrdersAdmin({ page, limit, status, search, date });
        return sendSuccess(res, result, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        console.error('[getAllOrdersAdmin] Error:', error);
        return handleServiceError(res, error);
    }
};

// PUT /api/orders/admin/:orderId/status
const updateOrderStatusAdminHandler = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;
        const result = await updateOrderStatusAdmin(orderId, status, paymentStatus);
        return sendSuccess(res, result, 'Cập nhật trạng thái đơn hàng thành công');
    } catch (error) {
        console.error('[updateOrderStatusAdmin] Error:', error);
        return handleServiceError(res, error);
    }
};

// PUT /api/orders/:orderId/cancel
const cancelOrderHandler = async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await cancelOrderUser(req.user.id, orderId);
        return sendSuccess(res, result, 'Hủy đơn hàng thành công');
    } catch (error) {
        console.error('[cancelOrder] Error:', error);
        return handleServiceError(res, error);
    }
};

module.exports = { 
    createOrder, 
    getMyOrders, 
    getOrderById,
    getAllOrdersAdmin: getAllOrdersAdminHandler,
    updateOrderStatusAdmin: updateOrderStatusAdminHandler,
    cancelOrder: cancelOrderHandler
};
