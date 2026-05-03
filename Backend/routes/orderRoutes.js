const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Admin Routes
router.get('/', verifyAdmin, orderController.getAllOrdersAdmin);
router.patch('/:orderId/status', verifyAdmin, orderController.updateOrderStatus);

// User Routes
router.post('/', orderController.createOrder); // Checkout
router.get('/mine', orderController.getMyOrders); // My orders
router.get('/:orderId', orderController.getOrderById); // Order detail
router.patch('/:orderId/cancel', orderController.cancelOrder); // Cancel order

module.exports = router;
