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

const updateOrderStatus = async (orderId, status) => {
    const validStatuses = ["PENDING", "APPROVED", "SHIPPING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
        throw new AppError('Trạng thái không hợp lệ', 400);
    }

    const order = await Order.findByIdAndUpdate(
        orderId, 
        { status }, 
        { new: true }
    );
    if (!order) {
        throw new AppError('Không tìm thấy đơn hàng', 404);
    }
    return order;
};

module.exports = { createOrderFromCart, getOrdersByUser, getOrderDetailByUser, updateOrderStatus };
