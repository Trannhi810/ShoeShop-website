const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route tạo URL thanh toán
router.post('/create_payment_url', verifyToken, paymentController.createPaymentUrl);

// Route nhận kết quả trả về từ VNPAY (return URL)
router.get('/vnpay_return', paymentController.vnpayReturn);

// Route nhận IPN (thường VNPAY sẽ gọi ngầm vào URL này)
router.get('/vnpay_ipn', paymentController.vnpayIpn);

module.exports = router;
