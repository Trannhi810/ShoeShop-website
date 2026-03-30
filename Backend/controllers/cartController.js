const Cart = require('../schemas/cartSchema');
const CartItem = require('../schemas/cartItemSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({ userId });
        }
        
        // Fetch cart items
        const cartItems = await CartItem.find({ cartId: cart._id })
            .populate({
                path: 'variantId',
                populate: {
                    path: 'productId',
                    model: 'Product'
                }
            });

        // Format data cho frontend dễ dùng
        const formattedItems = cartItems.map(item => {
            const variant = item.variantId;
            const product = variant ? variant.productId : null;
            
            return {
                id: item._id, // cart item id
                variantId: variant ? variant._id : null,
                productId: product ? product._id : null,
                name: product ? product.name : 'Sản phẩm không tồn tại',
                image: product && product.images && product.images.length > 0 ? product.images[0] : '',
                price: variant ? variant.price : 0,
                size: variant ? variant.size : '',
                color: variant ? variant.color : '',
                quantity: item.quantity,
                stock: variant ? variant.stock : 0
            };
        });

        res.status(200).json({ cartId: cart._id, items: formattedItems });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        // Do hệ thống hiện tại chưa chia ProductVariant ở Frontend khi thêm sản phẩm (trang admin-products),
        // variantId được gửi lên thực chất là productId. 
        // Ta sẽ tự động tạo/lấy một variant mặc định cho Product này để thêm vào giỏ hàng.
        const { variantId: productId, quantity } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        // 1. Kiểm tra sản phẩm gốc có tồn tại không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // 2. Tìm hoặc tạo một Variant mặc định cho sản phẩm này
        let variant = await ProductVariant.findOne({ productId });
        if (!variant) {
            variant = await ProductVariant.create({
                productId,
                size: "Mặc định",
                color: "Mặc định",
                price: product.price,
                stock: product.stock > 0 ? product.stock : 100
            });
        }

        const actualVariantId = variant._id;

        // 3. Xử lý giỏ hàng
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({ userId });
        }

        let cartItem = await CartItem.findOne({ cartId: cart._id, variantId: actualVariantId });
        
        if (cartItem) {
            // Kiểm tra số lượng tồn kho trước khi cộng thêm
            if (cartItem.quantity + quantity > variant.stock) {
                return res.status(400).json({ message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.` });
            }
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // Kiểm tra số lượng tồn kho khi thêm mới
            if (quantity > variant.stock) {
                return res.status(400).json({ message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.` });
            }
            cartItem = await CartItem.create({
                cartId: cart._id,
                variantId: actualVariantId,
                quantity
            });
        }

        res.status(200).json({ message: "Đã thêm vào giỏ hàng", cartItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/cart/update/:itemId
const updateCartItemQty = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }

        const cartItem = await CartItem.findById(itemId).populate('variantId');
        if (!cartItem) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }

        const variant = cartItem.variantId;
        if (variant && quantity > variant.stock) {
            return res.status(400).json({ message: `Số lượng vượt quá tồn kho. Chỉ còn ${variant.stock} sản phẩm.` });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({ message: "Cập nhật số lượng thành công", cartItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/cart/remove/:itemId
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const cartItem = await CartItem.findByIdAndDelete(itemId);
        
        if (!cartItem) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }

        res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });
        if (cart) {
            await CartItem.deleteMany({ cartId: cart._id });
        }
        res.status(200).json({ message: "Đã làm sạch giỏ hàng" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart
};