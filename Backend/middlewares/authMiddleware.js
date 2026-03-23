const jwt = require('jsonwebtoken');

// Middleware xác thực Token (Authentication)
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy token. Vui lòng đăng nhập!" });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        req.user = decoded; // Dữ liệu bên trong payload của token (id, role...)
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

// Middleware phân quyền Admin (Authorization)
const verifyAdmin = (req, res, next) => {
    // Phải chạy sau verifyToken để có req.user
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện thao tác này!" });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin
};
