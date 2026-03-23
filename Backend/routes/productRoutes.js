const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// API Public (Ai cũng xem được)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// API Protected (Bắt buộc đăng nhập và là Admin)
router.post('/', verifyToken, verifyAdmin, createProduct);
router.put('/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;