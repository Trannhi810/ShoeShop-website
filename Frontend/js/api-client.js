/**
 * api-client.js
 * Tập hợp tất cả lời gọi API theo domain.
 * Yêu cầu admin-utils.js được load trước (để có apiFetch).
 */

// ===== USER API =====
const userApi = {
    /** Lấy danh sách users (admin). params: URLSearchParams hoặc string */
    getAll(params = '') {
        return apiFetch(`/api/users/admin/users?${params}`);
    },
    /** Lấy chi tiết 1 user */
    getById(id) {
        return apiFetch(`/api/users/admin/users/${id}`);
    },
    /** Cập nhật thông tin user */
    update(id, data) {
        return apiFetch(`/api/users/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    /** Khóa / Mở khóa tài khoản */
    toggleLock(id) {
        return apiFetch(`/api/users/admin/users/${id}/toggle-lock`, { method: 'PATCH' });
    },
    /** Xóa tài khoản */
    delete(id) {
        return apiFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    },
    /** Đăng ký tài khoản mới (admin tạo) */
    register(data) {
        return apiFetch('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    /** Thống kê nhanh */
    stats: {
        total()  { return apiFetch('/api/users/admin/users?limit=1'); },
        active() { return apiFetch('/api/users/admin/users?status=active&limit=1'); },
        locked() { return apiFetch('/api/users/admin/users?status=locked&limit=1'); },
        admins() { return apiFetch('/api/users/admin/users?role=ADMIN&limit=1'); },
    }
};

// ===== PRODUCT API =====
const productApi = {
    /** Lấy danh sách sản phẩm. params: URLSearchParams hoặc string */
    getAll(params = '') {
        return apiFetch(`/api/products?${params}`);
    },
    /** Lấy chi tiết 1 sản phẩm */
    getById(id) {
        return apiFetch(`/api/products/${id}`);
    },
    /** Tạo mới sản phẩm */
    create(data) {
        return apiFetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    /** Cập nhật sản phẩm */
    update(id, data) {
        return apiFetch(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    /** Xóa sản phẩm */
    delete(id) {
        return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    },
};

// ===== CATEGORY API =====
const categoryApi = {
    /** Lấy tất cả danh mục (có đếm số sản phẩm) */
    getAll(params = '') {
        return apiFetch(`/api/categories?${params}`);
    },
    /** Lấy chi tiết 1 danh mục */
    getById(id) {
        return apiFetch(`/api/categories/${id}`);
    },
    /** Tạo mới danh mục */
    create(data) {
        return apiFetch('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    /** Cập nhật danh mục */
    update(id, data) {
        return apiFetch(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    /** Xóa danh mục */
    delete(id) {
        return apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    }
};

// ===== CART API =====
const cartApi = {
    /** Lấy giỏ hàng của user hiện tại */
    getCart() {
        return apiFetch('/api/cart');
    },
    /** Thêm sản phẩm vào giỏ hàng */
    addToCart(variantId, quantity = 1) {
        return apiFetch('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ variantId, quantity })
        });
    },
    /** Cập nhật số lượng item */
    updateQuantity(itemId, quantity) {
        return apiFetch(`/api/cart/update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    },
    /** Xóa 1 item khỏi giỏ hàng */
    removeItem(itemId) {
        return apiFetch(`/api/cart/remove/${itemId}`, { method: 'DELETE' });
    },
    /** Xóa toàn bộ giỏ hàng */
    clearCart() {
        return apiFetch('/api/cart/clear', { method: 'DELETE' });
    }
};