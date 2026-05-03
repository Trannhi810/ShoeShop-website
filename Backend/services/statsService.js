const User = require('../schemas/userSchema');
const Product = require('../schemas/productSchema');
const Category = require('../schemas/categorySchema');
const Order = require('../schemas/orderSchema');

const getDashboardStats = async () => {
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
    return {
        users: {
            total: totalUsers,
            active: activeUsers,
            locked: totalUsers - activeUsers
        },
        products: { total: totalProducts },
        categories: { total: totalCategories },
        orders: {
            total: totalOrders,
            pending: pendingOrders,
            shipping: shippingOrders,
            completed: completedOrders,
            cancelled: cancelledOrders
        },
        revenue: { total: totalRevenue }
    };
};

const getStaffStats = async () => {
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

    return {
        products: { total: totalProducts },
        orders: {
            total: totalOrders,
            pending: pendingOrders,
            shipping: shippingOrders
        }
    };
};

module.exports = { getDashboardStats, getStaffStats };
