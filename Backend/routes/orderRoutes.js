const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tất cả các route đơn hàng đều yêu cầu đăng nhập
router.use(verifyToken);

router.post('/checkout', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
