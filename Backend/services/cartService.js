const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');
const { AppError } = require('../utils/appError');

const getOrCreateCart = async (userId, session = null) => {
    const options = session ? { session } : {};
    let cart = await Cart.findOne({ userId }, null, options);
    if (!cart) {
        const created = await Cart.create([{ userId }], options);
        cart = created[0];
    }
    return cart;
};
const clearCartItems = async (cartId, session = null) => {
    const options = session ? { session } : {};
    return CartItem.deleteMany({ cartId }, options);
};

const formatCartItem = (item) => {
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
};

const getCartDetail = async (userId) => {
    const cart = await getOrCreateCart(userId);
    const cartItems = await CartItem.find({ cartId: cart._id }).populate({
        path: 'variantId',
        model: 'ProductVariant',
        populate: { path: 'productId', model: 'Product' }
    });
    return { cartId: cart._id, items: cartItems.map(formatCartItem) };
};

const addItemToCart = async (userId, { variantId, quantity }) => {
    if (!variantId) throw new AppError('Thiếu variantId', 400);
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) throw new AppError('Số lượng phải là số nguyên dương', 400);

    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
        throw new AppError('Không tìm thấy biến thể sản phẩm (variantId không hợp lệ)', 404);
    }
    const product = await Product.findById(variant.productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm gốc', 404);
    if (!product.isActive) throw new AppError('Sản phẩm hiện không hoạt động', 400);
    if (variant.stock <= 0) throw new AppError('Sản phẩm đã hết hàng', 400);

    const cart = await getOrCreateCart(userId);
    let cartItem = await CartItem.findOne({ cartId: cart._id, variantId: variant._id });

    if (cartItem) {
        const newQty = cartItem.quantity + qty;
        if (newQty > variant.stock) {
            throw new AppError(
                `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm (hiện có ${cartItem.quantity} trong giỏ).`,
                400
            );
        }
        cartItem.quantity = newQty;
        await cartItem.save();
    } else {
        if (qty > variant.stock) {
            throw new AppError(`Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`, 400);
        }
        cartItem = await CartItem.create({
            cartId: cart._id,
            variantId: variant._id,
            quantity: qty
        });
    }

    return { id: cartItem._id, variantId: variant._id, productId: product._id, quantity: cartItem.quantity };
};

const updateCartItemQuantity = async (userId, itemId, quantity) => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) throw new AppError('Số lượng phải là số nguyên dương', 400);

    const cart = await Cart.findOne({ userId });
    if (!cart) throw new AppError('Không tìm thấy giỏ hàng', 404);

    const cartItem = await CartItem.findOne({ _id: itemId, cartId: cart._id }).populate('variantId');
    if (!cartItem) throw new AppError('Không tìm thấy sản phẩm trong giỏ hàng của bạn', 404);

    const variant = cartItem.variantId;
    if (variant && qty > variant.stock) {
        throw new AppError(`Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.`, 400);
    }

    cartItem.quantity = qty;
    await cartItem.save();
    return { id: cartItem._id, quantity: cartItem.quantity };
};

const removeItemFromCart = async (userId, itemId) => {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new AppError('Không tìm thấy giỏ hàng', 404);

    const cartItem = await CartItem.findOneAndDelete({ _id: itemId, cartId: cart._id });
    if (!cartItem) throw new AppError('Không tìm thấy sản phẩm trong giỏ hàng của bạn', 404);
};

const clearCartByUser = async (userId) => {
    const cart = await Cart.findOne({ userId });
    if (!cart) return { deletedCount: 0 };
    const result = await clearCartItems(cart._id);
    return { deletedCount: result.deletedCount };
};

module.exports = {
    getOrCreateCart,
    clearCartItems,
    formatCartItem,
    getCartDetail,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCartByUser
};
