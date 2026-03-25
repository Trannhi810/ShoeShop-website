const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tất cả các route giỏ hàng đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update/:itemId', cartController.updateCartItemQty);
router.delete('/remove/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;