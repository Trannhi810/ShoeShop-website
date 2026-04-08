const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Tất cả các route đơn hàng đều yêu cầu đăng nhập
router.use(verifyToken);

// --- Admin Routes ---
// Chú ý: Đặt /admin lên trước /:orderId để tránh bị nhầm lẫn route
router.get('/admin', verifyAdmin, orderController.getAllOrdersAdmin);
router.put('/admin/:orderId/status', verifyAdmin, orderController.updateOrderStatusAdmin);

// --- User Routes ---
router.post('/checkout', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.put('/:orderId/cancel', orderController.cancelOrder);
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
