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

const upload = require('../middlewares/uploadMiddleware');

// API Public (Ai cũng xem được)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// API Protected (Bắt buộc đăng nhập và là Admin)
router.post('/', verifyToken, verifyAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;