const {
    getCartDetail,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCartByUser
} = require('../services/cartService');
const { sendSuccess } = require('../utils/responseHelper');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const data = await getCartDetail(req.user.id);
        return sendSuccess(res, data, 'Lấy giỏ hàng thành công');
    } catch (error) {
        console.error('[getCart] Error:', error);
        return handleServiceError(res, error);
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const data = await addItemToCart(req.user.id, req.body);
        return sendSuccess(
            res,
            data,
            'Đã thêm vào giỏ hàng'
        );
    } catch (error) {
        console.error('[addToCart] Error:', error);
        return handleServiceError(res, error);
    }
};

// PUT /api/cart/update/:itemId
const updateCartItemQty = async (req, res) => {
    try {
        const { itemId } = req.params;
        const data = await updateCartItemQuantity(req.user.id, itemId, req.body.quantity);
        return sendSuccess(res, data, 'Cập nhật số lượng thành công');
    } catch (error) {
        console.error('[updateCartItemQty] Error:', error);
        return handleServiceError(res, error);
    }
};

// DELETE /api/cart/remove/:itemId
const removeFromCart = async (req, res) => {
    try {
        await removeItemFromCart(req.user.id, req.params.itemId);
        return sendSuccess(res, null, 'Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
        console.error('[removeFromCart] Error:', error);
        return handleServiceError(res, error);
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const result = await clearCartByUser(req.user.id);
        if (!result.deletedCount) {
            return sendSuccess(res, null, 'Giỏ hàng đã trống');
        }
        return sendSuccess(res, null, `Đã xóa ${result.deletedCount} sản phẩm khỏi giỏ hàng`);
    } catch (error) {
        console.error('[clearCart] Error:', error);
        return handleServiceError(res, error);
    }
};

module.exports = { getCart, addToCart, updateCartItemQty, removeFromCart, clearCart };