const { createOrderFromCart, getOrdersByUser, getOrderDetailByUser, getAllOrdersAdmin, updateOrderStatusAdmin, cancelOrderUser } = require('../services/orderService');
const { sendSuccess } = require('../utils/responseHelper');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// POST /api/orders/checkout
const createOrder = async (req, res) => {
    try {
        const populatedOrder = await createOrderFromCart(req.user.id, req.body);
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
