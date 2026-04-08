const { createOrderFromCart, getOrdersByUser, getOrderDetailByUser } = require('../services/orderService');
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

module.exports = { createOrder, getMyOrders, getOrderById };
