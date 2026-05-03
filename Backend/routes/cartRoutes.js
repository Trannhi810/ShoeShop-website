const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.patch('/items/:itemId', cartController.updateCartItemQty);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;