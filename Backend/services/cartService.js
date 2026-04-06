const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');

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

module.exports = { getOrCreateCart, clearCartItems, formatCartItem };
