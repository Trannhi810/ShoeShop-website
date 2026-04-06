const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId });
    }
    return cart;
};

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getOrCreateCart(userId);
        const cartItems = await CartItem.find({ cartId: cart._id })
            .populate({
                path: 'variantId',
                model: 'ProductVariant',
                populate: {
                    path: 'productId',
                    model: 'Product'
                }
            });
        const formattedItems = cartItems.map(item => {
            const variant = item.variantId;
            const product = variant ? variant.productId : null;

            return {
                id: item._id,
                variantId: variant ? variant._id : null,
                productId: product ? product._id : null,
                name: product ? product.name : 'Sản phẩm không tồn tại',
                image: product && product.images && product.images.length > 0
                    ? product.images[0].url
                    : '',
                price: variant ? variant.price : 0,
                size: variant ? variant.size : '',
                color: variant ? variant.color : '',
                quantity: item.quantity,
                stock: variant ? variant.stock : 0
            };
        });

        return res.status(200).json({
            success: true,
            message: "Lấy giỏ hàng thành công",
            data: {
                cartId: cart._id,
                items: formattedItems
            }
        });
    } catch (error) {
        console.error('[getCart] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { variantId: productId, quantity } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Thiếu productId" });
        }
        const qty = parseInt(quantity, 10);
        if (!qty || qty <= 0) {
            return res.status(400).json({ success: false, message: "Số lượng phải là số nguyên dương" });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        if (!product.isActive) {
            return res.status(400).json({ success: false, message: "Sản phẩm hiện không hoạt động" });
        }
        let variant = await ProductVariant.findOne({ productId });
        if (!variant) {
            variant = await ProductVariant.create({
                productId,
                size: 'Mặc định',
                color: 'Mặc định',
                price: product.price,
                stock: product.stock > 0 ? product.stock : 100
            });
        }
        if (variant.stock <= 0) {
            return res.status(400).json({ success: false, message: "Sản phẩm đã hết hàng" });
        }
        const cart = await getOrCreateCart(userId);
        let cartItem = await CartItem.findOne({ cartId: cart._id, variantId: variant._id });
        if (cartItem) {
            const newQty = cartItem.quantity + qty;
            if (newQty > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm (hiện có ${cartItem.quantity} trong giỏ).`
                });
            }
            cartItem.quantity = newQty;
            await cartItem.save();
        } else {
            if (qty > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`
                });
            }
            cartItem = await CartItem.create({
                cartId: cart._id,
                variantId: variant._id,
                quantity: qty
            });
        }

        return res.status(200).json({
            success: true,
            message: "Đã thêm vào giỏ hàng",
            data: {
                id: cartItem._id,
                variantId: variant._id,
                productId: product._id,
                quantity: cartItem.quantity
            }
        });
    } catch (error) {
        console.error('[addToCart] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateCartItemQty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const qty = parseInt(req.body.quantity, 10);

        if (!qty || qty <= 0) {
            return res.status(400).json({ success: false, message: "Số lượng phải là số nguyên dương" });
        }
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng" });
        }
        const cartItem = await CartItem.findOne({
            _id: itemId,
            cartId: cart._id
        }).populate('variantId');

        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng của bạn" });
        }
        const variant = cartItem.variantId;
        if (variant && qty > variant.stock) {
            return res.status(400).json({
                success: false,
                message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`
            });
        }

        cartItem.quantity = qty;
        await cartItem.save();

        return res.status(200).json({
            success: true,
            message: "Cập nhật số lượng thành công",
            data: {
                id: cartItem._id,
                quantity: cartItem.quantity
            }
        });
    } catch (error) {
        console.error('[updateCartItemQty] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng" });
        }
        const cartItem = await CartItem.findOneAndDelete({
            _id: itemId,
            cartId: cart._id
        });

        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng của bạn" });
        }

        return res.status(200).json({
            success: true,
            message: "Đã xóa sản phẩm khỏi giỏ hàng"
        });
    } catch (error) {
        console.error('[removeFromCart] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(200).json({ success: true, message: "Giỏ hàng đã trống" });
        }

        const result = await CartItem.deleteMany({ cartId: cart._id });

        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} sản phẩm khỏi giỏ hàng`
        });
    } catch (error) {
        console.error('[clearCart] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart
};