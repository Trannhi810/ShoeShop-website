const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');
const Order = require('../schemas/orderSchema');

/**
 * Sắp xếp object theo thứ tự alphabet và URL-encode key + value.
 * Đây là chuẩn chính thức từ tài liệu VNPAY Node.js.
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

exports.createPaymentUrl = (req, res) => {
    try {
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        ipAddr = (ipAddr.split(',')[0].trim());
        if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
            ipAddr = '127.0.0.1';
        }

        const tmnCode   = (process.env.VNP_TMN_CODE    || '').trim();
        const secretKey = (process.env.VNP_HASH_SECRET  || '').trim();
        const vnpUrl    = (process.env.VNP_URL           || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html').trim();
        const returnUrl = (process.env.VNP_RETURN_URL    || 'http://localhost:3000/api/payment/vnpay_return').trim();

        const date       = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId    = req.body.orderId || moment(date).format('DDHHmmss');
        const amount     = req.body.amount;
        const bankCode   = req.body.bankCode || '';
        const locale     = req.body.language || 'vn';

        let vnp_Params = {};
        vnp_Params['vnp_Version']   = '2.1.0';
        vnp_Params['vnp_Command']   = 'pay';
        vnp_Params['vnp_TmnCode']   = tmnCode;
        vnp_Params['vnp_Locale']    = locale;
        vnp_Params['vnp_CurrCode']  = 'VND';
        vnp_Params['vnp_TxnRef']    = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount']    = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr']    = ipAddr;
        vnp_Params['vnp_CreateDate']= createDate;

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Bước 1: Sort & URL-encode (chuẩn chính thức VNPAY)
        vnp_Params = sortObject(vnp_Params);

        // Bước 2: Tạo chuỗi để băm (giá trị đã được encode từ sortObject)
        const signData = qs.stringify(vnp_Params, { encode: false });

        // Bước 3: Băm HMAC-SHA512
        const hmac   = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Bước 4: Gắn chữ ký vào params và tạo URL
        vnp_Params['vnp_SecureHash'] = signed;
        const finalUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

        console.log('============= VNPAY DEBUG ==============');
        console.log('TmnCode:', tmnCode);
        console.log('SecretKey:', secretKey);
        console.log('SignData:', signData);
        console.log('Signed:', signed);
        console.log('FinalUrl:', finalUrl);
        console.log('========================================');

        return res.status(200).json({ success: true, code: '00', paymentUrl: finalUrl });
    } catch (error) {
        console.error('[createPaymentUrl] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi tạo URL thanh toán' });
    }
};

exports.vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };

        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey  = (process.env.VNP_HASH_SECRET || '').trim();
        const signData   = qs.stringify(vnp_Params, { encode: false });
        const hmac       = crypto.createHmac('sha512', secretKey);
        const signed     = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const rspCode = vnp_Params['vnp_ResponseCode'];
            const orderId = vnp_Params['vnp_TxnRef'];

            try {
                if (rspCode === '00') {
                    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'PAID' });
                } else {
                    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'FAILED' });
                }
            } catch (dbErr) {
                console.error('[vnpayReturn] DB Update Error:', dbErr);
            }

            res.redirect(`/pages/customer/payment-result.html?code=${rspCode}&amount=${vnp_Params['vnp_Amount']}`);
        } else {
            console.warn('[vnpayReturn] Invalid hash! received:', secureHash, 'expected:', signed);
            res.redirect('/pages/customer/payment-result.html?code=97');
        }
    } catch (error) {
        console.error('[vnpayReturn] Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xử lý kết quả VNPAY' });
    }
};

exports.vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey  = (process.env.VNP_HASH_SECRET || '').trim();
        const signData   = qs.stringify(vnp_Params, { encode: false });
        const hmac       = crypto.createHmac('sha512', secretKey);
        const signed     = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];

            try {
                // If payment was successful
                if (rspCode === '00') {
                    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'PAID' });
                } else {
                    // Payment failed or was canceled
                    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'FAILED' });
                }
            } catch (err) {
                console.error('[vnpayIpn] Database error:', err);
                return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
            }

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }
    } catch (error) {
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};
