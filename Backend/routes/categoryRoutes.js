const express = require('express');
const router  = express.Router();
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Public — ai cũng xem được danh mục để hiển thị shop
router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);

// Admin only
router.post('/',    verifyToken, verifyAdmin, createCategory);
router.put('/:id',  verifyToken, verifyAdmin, updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, deleteCategory);

module.exports = router;
