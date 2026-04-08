const mongoose = require('mongoose');
const Order = require('../schemas/orderSchema');
const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const { clearCartItems } = require('./cartService');
const { generateOrderNumber } = require('../utils/orderUtils');
const { AppError } = require('../utils/appError');

const validateCheckoutInput = ({ shippingAddress, phone }) => {
    if (!shippingAddress || !shippingAddress.trim()) {
        throw new AppError('Vui lòng nhập địa chỉ giao hàng', 400);
    }
    if (!phone || !phone.trim()) {
        throw new AppError('Vui lòng nhập số điện thoại', 400);
    }
};

const loadCartItemsWithProduct = async (userId, session) => {
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
        throw new AppError('Không tìm thấy giỏ hàng', 400);
    }

    const cartItems = await CartItem.find({ cartId: cart._id })
        .session(session)
        .populate({
            path: 'variantId',
            model: 'ProductVariant',
            populate: { path: 'productId', model: 'Product' }
        });

    if (!cartItems || cartItems.length === 0) {
        throw new AppError('Giỏ hàng đang trống, không thể đặt hàng', 400);
    }

    return { cart, cartItems };
};

const buildOrderItemsAndDecreaseStock = async (cartItems, session) => {
    let totalAmount = 0;
    const orderItemsSnapshot = [];

    for (const cartItem of cartItems) {
        const variant = cartItem.variantId;
        if (!variant) {
            throw new AppError('Một sản phẩm trong giỏ hàng không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.', 400);
        }

        const product = variant.productId;
        const qty = cartItem.quantity;

        if (variant.stock < qty) {
            const productName = product ? product.name : `Variant ${variant._id}`;
            throw new AppError(
                `Sản phẩm "${productName}" không đủ hàng. Chỉ còn ${variant.stock} sản phẩm, bạn đang đặt ${qty}.`,
                400
            );
        }

        await ProductVariant.findByIdAndUpdate(
            variant._id,
            { $inc: { stock: -qty } },
            { session, returnDocument: 'after' }
        );

        totalAmount += variant.price * qty;
        orderItemsSnapshot.push({
            variantId: variant._id,
            productName: product ? product.name : 'Sản phẩm không xác định',
            productImage: product && product.images && product.images.length > 0 ? product.images[0].url : '',
            size: variant.size || '',
            color: variant.color || '',
            price: variant.price,
            quantity: qty
        });
    }

    return { totalAmount, orderItemsSnapshot };
};

const createOrderFromCart = async (userId, payload) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        validateCheckoutInput(payload);
        const { shippingAddress, phone, paymentMethod = 'COD' } = payload;

        const { cart, cartItems } = await loadCartItemsWithProduct(userId, session);
        const { totalAmount, orderItemsSnapshot } = await buildOrderItemsAndDecreaseStock(cartItems, session);

        const fullShippingAddress = `${shippingAddress.trim()} | SĐT: ${phone.trim()}`;
        const [order] = await Order.create(
            [{
                userId,
                orderNumber: generateOrderNumber(),
                items: orderItemsSnapshot,
                totalAmount,
                shippingAddress: fullShippingAddress,
                paymentMethod,
                status: 'PENDING',
                paymentStatus: 'PENDING'
            }],
            { session }
        );

        await clearCartItems(cart._id, session);
        await session.commitTransaction();

        return Order.findById(order._id).populate({
            path: 'items.variantId',
            model: 'ProductVariant',
            populate: { path: 'productId', model: 'Product' }
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const getOrdersByUser = async (userId) => {
    return Order.find({ userId })
        .sort({ createdAt: -1 })
        .select('orderNumber status totalAmount createdAt items shippingAddress paymentMethod');
};

const getOrderDetailByUser = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, userId }).populate({
        path: 'items.variantId',
        model: 'ProductVariant',
        populate: { path: 'productId', model: 'Product' }
    });

    if (!order) {
        throw new AppError('Không tìm thấy đơn hàng', 404);
    }
    return order;
};

const getAllOrdersAdmin = async ({ page = 1, limit = 10, status, search, date }) => {
    const query = {};
    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23,59,59,999);
        query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { shippingAddress: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
        .populate('userId', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalOrders = await Order.countDocuments(query);

    return {
        orders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: Number(page),
        totalOrders
    };
};

const updateOrderStatusAdmin = async (orderId, status, paymentStatus) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new AppError('Không tìm thấy đơn hàng', 404);
        }

        // Hoàn lại kho khi đơn hàng bị HỦY hoặc TRẢ LẠI
        if (status && (status === 'CANCELLED' || status === 'RETURNED') && order.status !== 'CANCELLED' && order.status !== 'RETURNED') {
            for (const item of order.items) {
                if (item.variantId) {
                    await ProductVariant.findByIdAndUpdate(
                        item.variantId,
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            }
        }

        // Trừ lại kho khi khôi phục từ HỦY hoặc TRẢ LẠI
        if (status && (order.status === 'CANCELLED' || order.status === 'RETURNED') && status !== 'CANCELLED' && status !== 'RETURNED') {
            for (const item of order.items) {
                if (item.variantId) {
                    const variant = await ProductVariant.findById(item.variantId).session(session);
                    if (!variant || variant.stock < item.quantity) {
                        throw new AppError(`Sản phẩm ${item.productName} không đủ tồn kho để khôi phục đơn hàng`, 400);
                    }
                    await ProductVariant.findByIdAndUpdate(
                        item.variantId,
                        { $inc: { stock: -item.quantity } },
                        { session }
                    );
                }
            }
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save({ session });
        await session.commitTransaction();

        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const cancelOrderUser = async (userId, orderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findOne({ _id: orderId, userId }).session(session);
        if (!order) {
            throw new AppError('Không tìm thấy đơn hàng', 404);
        }

        if (order.status !== 'PENDING') {
            throw new AppError('Không thể hủy đơn hàng đang được xử lý hoặc đã hoàn thành', 400);
        }

        order.status = 'CANCELLED';

        // Hoàn lại kho
        for (const item of order.items) {
            if (item.variantId) {
                await ProductVariant.findByIdAndUpdate(
                    item.variantId,
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
        }

        await order.save({ session });
        await session.commitTransaction();

        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = { 
    createOrderFromCart, 
    getOrdersByUser, 
    getOrderDetailByUser,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    cancelOrderUser
};

