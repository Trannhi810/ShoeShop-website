const express = require('express');
const router = express.Router();
const { getAllColors, createColor, deleteColor } = require('../controllers/colorController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', getAllColors);
router.post('/', verifyToken, verifyAdmin, createColor);
router.delete('/:id', verifyToken, verifyAdmin, deleteColor);

module.exports = router;
