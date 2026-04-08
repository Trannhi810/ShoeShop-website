const express = require('express');
const router  = express.Router();
const {
    getMyNotifications,
    markAllAsRead,
    markOneAsRead,
    deleteNotification,
    broadcastNotification
} = require('../controllers/notificationController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/',                    getMyNotifications);
router.patch('/read-all',          markAllAsRead);
router.post('/broadcast',          verifyAdmin, broadcastNotification);
router.patch('/:id/read',          markOneAsRead);
router.delete('/:id',              deleteNotification);

module.exports = router;
