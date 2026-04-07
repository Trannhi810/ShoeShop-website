const mongoose = require('mongoose');
const Order = require('../schemas/orderSchema');
const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');
const { getOrCreateCart, clearCartItems } = require('../services/cartService');
const { generateOrderNumber } = require('../utils/orderUtils');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// POST /api/orders/checkout
const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { shippingAddress, phone, paymentMethod = 'COD' } = req.body;

        // 1. Validate input
        if (!shippingAddress || !shippingAddress.trim()) {
            await session.abortTransaction();
            return sendError(res, 'Vui lòng nhập địa chỉ giao hàng', 400);
        }
        if (!phone || !phone.trim()) {
            await session.abortTransaction();
            return sendError(res, 'Vui lòng nhập số điện thoại', 400);
        }

        // 2. Lấy Cart và CartItems (trong session)
        const cart = await Cart.findOne({ userId }).session(session);
        if (!cart) {
            await session.abortTransaction();
            return sendError(res, 'Không tìm thấy giỏ hàng', 400);
        }

        // Populate 2 tầng: CartItem → ProductVariant → Product
        const cartItems = await CartItem.find({ cartId: cart._id })
            .session(session)
            .populate({
                path: 'variantId',
                model: 'ProductVariant',
                populate: { path: 'productId', model: 'Product' }
            });

        if (!cartItems || cartItems.length === 0) {
            await session.abortTransaction();
            return sendError(res, 'Giỏ hàng đang trống, không thể đặt hàng', 400);
        }

        // 3 & 4. Tính tiền từ DB + kiểm tra & trừ kho
        let totalAmount = 0;
        const orderItemsSnapshot = [];

        for (const cartItem of cartItems) {
            const variant = cartItem.variantId;

            if (!variant) {
                await session.abortTransaction();
                return sendError(res, 'Một sản phẩm trong giỏ hàng không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.', 400);
            }

            const product = variant.productId;
            const qty = cartItem.quantity;

            // Kiểm tra tồn kho
            if (variant.stock < qty) {
                await session.abortTransaction();
                const productName = product ? product.name : `Variant ${variant._id}`;
                return sendError(
                    res,
                    `Sản phẩm "${productName}" không đủ hàng. Chỉ còn ${variant.stock} sản phẩm, bạn đang đặt ${qty}.`,
                    400
                );
            }

            // Trừ kho trong transaction
            await ProductVariant.findByIdAndUpdate(
                variant._id,
                { $inc: { stock: -qty } },
                { session, returnDocument: 'after' }
            );

            // Tính giá từ DB (không tin Frontend)
            totalAmount += variant.price * qty;

            // Build snapshot nhúng vào Order.items
            orderItemsSnapshot.push({
                variantId: variant._id,
                productName: product ? product.name : 'Sản phẩm không xác định',
                productImage: product && product.images && product.images.length > 0
                    ? product.images[0].url
                    : '',
                size: variant.size || '',
                color: variant.color || '',
                price: variant.price,
                quantity: qty
            });
        }

        // 5. Tạo Order (gộp phone vào shippingAddress vì schema không có trường phone riêng)
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

        // 6. Xoá CartItems bằng service dùng chung
        await clearCartItems(cart._id, session);

        // 7. Commit
        await session.commitTransaction();

        // Populate để Frontend hiển thị trang "Cảm ơn"
        const populatedOrder = await Order.findById(order._id).populate({
            path: 'items.variantId',
            model: 'ProductVariant',
            populate: { path: 'productId', model: 'Product' }
        });

        return sendSuccess(res, populatedOrder, 'Đặt hàng thành công! Cảm ơn bạn đã mua hàng.', 201);

    } catch (error) {
        await session.abortTransaction();
        console.error('[createOrder] Unexpected error:', error);
        return sendError(res, 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.');
    } finally {
        session.endSession();
    }
};

// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .select('orderNumber status totalAmount createdAt items shippingAddress paymentMethod');

        return sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
        console.error('[getMyOrders] Error:', error);
        return sendError(res, error.message);
    }
};

// GET /api/orders/:orderId
const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, userId }).populate({
            path: 'items.variantId',
            model: 'ProductVariant',
            populate: { path: 'productId', model: 'Product' }
        });

        if (!order) {
            return sendError(res, 'Không tìm thấy đơn hàng', 404);
        }

        return sendSuccess(res, order, 'Lấy chi tiết đơn hàng thành công');
    } catch (error) {
        console.error('[getOrderById] Error:', error);
        return sendError(res, error.message);
    }
};

module.exports = { createOrder, getMyOrders, getOrderById };
