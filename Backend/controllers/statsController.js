const User     = require('../schemas/userSchema');
const Product  = require('../schemas/productSchema');
const Category = require('../schemas/categorySchema');
const Order    = require('../schemas/orderSchema');

// ─────────────────────────────────────────────
// [ADMIN] GET /api/stats/dashboard
// Trả về toàn bộ thống kê tổng quan cho Admin Dashboard
// Test Postman: GET http://localhost:5000/api/stats/dashboard
//              Header: Authorization: Bearer <admin_token>
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalProducts,
            totalCategories,
            totalOrders,
            pendingOrders,
            shippingOrders,
            completedOrders,
            cancelledOrders,
            revenueResult
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isLocked: false }),
            Product.countDocuments(),
            Category.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ status: 'PENDING' }),
            Order.countDocuments({ status: 'SHIPPING' }),
            Order.countDocuments({ status: 'COMPLETED' }),
            Order.countDocuments({ status: 'CANCELLED' }),
            Order.aggregate([
                { $match: { status: 'COMPLETED' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;

        res.json({
            users: {
                total:  totalUsers,
                active: activeUsers,
                locked: totalUsers - activeUsers
            },
            products: {
                total: totalProducts
            },
            categories: {
                total: totalCategories
            },
            orders: {
                total:     totalOrders,
                pending:   pendingOrders,
                shipping:  shippingOrders,
                completed: completedOrders,
                cancelled: cancelledOrders
            },
            revenue: {
                total: totalRevenue
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────
// [ADMIN/STAFF] GET /api/stats/staff
// Thống kê dành cho Staff Dashboard
// Test Postman: GET http://localhost:5000/api/stats/staff
//              Header: Authorization: Bearer <staff_token>
// ─────────────────────────────────────────────
const getStaffStats = async (req, res) => {
    try {
        const [
            totalProducts,
            pendingOrders,
            shippingOrders,
            totalOrders
        ] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments({ status: 'PENDING' }),
            Order.countDocuments({ status: 'SHIPPING' }),
            Order.countDocuments()
        ]);

        res.json({
            products: { total: totalProducts },
            orders: {
                total:    totalOrders,
                pending:  pendingOrders,
                shipping: shippingOrders
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getDashboardStats, getStaffStats };
