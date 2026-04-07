const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');
const { getOrCreateCart, clearCartItems, formatCartItem } = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getOrCreateCart(userId);

        const cartItems = await CartItem.find({ cartId: cart._id })
            .populate({
                path: 'variantId',
                model: 'ProductVariant',
                populate: { path: 'productId', model: 'Product' }
            });

        const formattedItems = cartItems.map(formatCartItem);

        return sendSuccess(res, { cartId: cart._id, items: formattedItems }, 'Lấy giỏ hàng thành công');
    } catch (error) {
        console.error('[getCart] Error:', error);
        return sendError(res, error.message);
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { variantId, quantity } = req.body;

        if (!variantId) {
            return sendError(res, 'Thiếu variantId', 400);
        }
        const qty = parseInt(quantity, 10);
        if (!qty || qty <= 0) {
            return sendError(res, 'Số lượng phải là số nguyên dương', 400);
        }

        // 1. Tìm Variant trước
        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            return sendError(res, 'Không tìm thấy biến thể sản phẩm (variantId không hợp lệ)', 404);
        }

        // 2. Từ variant suy ra Product cha
        const product = await Product.findById(variant.productId);
        if (!product) {
            return sendError(res, 'Không tìm thấy sản phẩm gốc', 404);
        }
        if (!product.isActive) {
            return sendError(res, 'Sản phẩm hiện không hoạt động', 400);
        }

        // 3. Kiểm tra tồn kho
        if (variant.stock <= 0) {
            return sendError(res, 'Sản phẩm đã hết hàng', 400);
        }

        // 4. Lấy hoặc tạo giỏ hàng
        const cart = await getOrCreateCart(userId);
        let cartItem = await CartItem.findOne({ cartId: cart._id, variantId: variant._id });

        if (cartItem) {
            const newQty = cartItem.quantity + qty;
            if (newQty > variant.stock) {
                return sendError(
                    res,
                    `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm (hiện có ${cartItem.quantity} trong giỏ).`,
                    400
                );
            }
            cartItem.quantity = newQty;
            await cartItem.save();
        } else {
            if (qty > variant.stock) {
                return sendError(res, `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`, 400);
            }
            cartItem = await CartItem.create({
                cartId: cart._id,
                variantId: variant._id,
                quantity: qty
            });
        }

        return sendSuccess(
            res,
            { id: cartItem._id, variantId: variant._id, productId: product._id, quantity: cartItem.quantity },
            'Đã thêm vào giỏ hàng'
        );
    } catch (error) {
        console.error('[addToCart] Error:', error);
        return sendError(res, error.message);
    }
};

// PUT /api/cart/update/:itemId
const updateCartItemQty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const qty = parseInt(req.body.quantity, 10);

        if (!qty || qty <= 0) {
            return sendError(res, 'Số lượng phải là số nguyên dương', 400);
        }

        // Bảo mật: tìm cart của user trước để xác minh ownership
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return sendError(res, 'Không tìm thấy giỏ hàng', 404);
        }

        const cartItem = await CartItem.findOne({ _id: itemId, cartId: cart._id }).populate('variantId');
        if (!cartItem) {
            return sendError(res, 'Không tìm thấy sản phẩm trong giỏ hàng của bạn', 404);
        }

        const variant = cartItem.variantId;
        if (variant && qty > variant.stock) {
            return sendError(res, `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`, 400);
        }

        cartItem.quantity = qty;
        await cartItem.save();

        return sendSuccess(res, { id: cartItem._id, quantity: cartItem.quantity }, 'Cập nhật số lượng thành công');
    } catch (error) {
        console.error('[updateCartItemQty] Error:', error);
        return sendError(res, error.message);
    }
};

// DELETE /api/cart/remove/:itemId
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        // Bảo mật: xác minh ownership trước khi xoá
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return sendError(res, 'Không tìm thấy giỏ hàng', 404);
        }

        const cartItem = await CartItem.findOneAndDelete({ _id: itemId, cartId: cart._id });
        if (!cartItem) {
            return sendError(res, 'Không tìm thấy sản phẩm trong giỏ hàng của bạn', 404);
        }

        return sendSuccess(res, null, 'Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
        console.error('[removeFromCart] Error:', error);
        return sendError(res, error.message);
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return sendSuccess(res, null, 'Giỏ hàng đã trống');
        }

        const result = await clearCartItems(cart._id);

        return sendSuccess(res, null, `Đã xóa ${result.deletedCount} sản phẩm khỏi giỏ hàng`);
    } catch (error) {
        console.error('[clearCart] Error:', error);
        return sendError(res, error.message);
    }
};

module.exports = { getCart, addToCart, updateCartItemQty, removeFromCart, clearCart };