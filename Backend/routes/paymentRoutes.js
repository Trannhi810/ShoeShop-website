const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route tạo payment
router.post('/', verifyToken, paymentController.createPayment);

// Route nhận kết quả trả về từ VNPAY (return URL)
router.get('/vnpay-return', paymentController.vnpayReturn);

// Route nhận IPN (thường VNPAY sẽ gọi ngầm vào URL này)
router.get('/vnpay-ipn', paymentController.vnpayIpn);

module.exports = router;
