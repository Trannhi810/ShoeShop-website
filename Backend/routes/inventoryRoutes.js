const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getInventoryOverview,
  getInventoryItems,
  getInventoryLogs,
  adjustInventory
} = require('../controllers/inventoryController');

router.use(verifyToken, verifyAdmin);
router.get('/overview', getInventoryOverview);
router.get('/items', getInventoryItems);
router.get('/logs', getInventoryLogs);
router.post('/adjust', adjustInventory);

module.exports = router;
