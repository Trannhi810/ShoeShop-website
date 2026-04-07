const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadColorImage,
    updateImageOrder,
    deleteColorImage
} = require('../controllers/productController');
const {
    getVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    batchUpdateVariantPrice
} = require('../controllers/productVariantController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');

// API Public (Ai cũng xem được)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// API Protected (Bắt buộc đăng nhập và là Admin)
router.post('/', verifyToken, verifyAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

// API Product Images (Color grouping & ordering)
router.post('/:id/colors/:colorId/images', verifyToken, verifyAdmin, upload.single('image'), uploadColorImage);
router.patch('/:id/images/order', verifyToken, verifyAdmin, updateImageOrder);
router.delete('/:id/images/:imageId', verifyToken, verifyAdmin, deleteColorImage);

// API Variants
router.get('/:productId/variants', getVariants);
router.post('/:productId/variants', verifyToken, verifyAdmin, upload.single('image'), addVariant);
router.put('/variants/:variantId', verifyToken, verifyAdmin, upload.single('image'), updateVariant);
router.delete('/variants/:variantId', verifyToken, verifyAdmin, deleteVariant);
router.patch('/:productId/variants/batch-price', verifyToken, verifyAdmin, batchUpdateVariantPrice);

module.exports = router;