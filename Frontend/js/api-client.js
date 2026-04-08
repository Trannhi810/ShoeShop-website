/**
 * api-client.js
 * Tập hợp tất cả lời gọi API theo domain.
 * Yêu cầu admin-utils.js được load trước (để có apiFetch).
 */

// ===== COLOR API =====
const colorApi = {
    getAll() { return apiFetch('/api/colors'); },
    create(data) {
        return apiFetch('/api/colors', { method: 'POST', body: JSON.stringify(data) });
    },
    delete(id) { return apiFetch(`/api/colors/${id}`, { method: 'DELETE' }); }
};

// ===== USER API =====
const userApi = {
    /** Lấy danh sách users (admin). params: URLSearchParams hoặc string */
    getAll(params = '') {
        return apiFetch(`/api/users?${params}`);
    },
    /** Lấy chi tiết 1 user */
    getById(id) {
        return apiFetch(`/api/users/${id}`);
    },
    /** Cập nhật thông tin user */
    update(id, data) {
        return apiFetch(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    /** Khóa / Mở khóa tài khoản */
    toggleLock(id) {
        return apiFetch(`/api/users/${id}/toggle-lock`, { method: 'PATCH' });
    },
    /** Xóa tài khoản */
    delete(id) {
        return apiFetch(`/api/users/${id}`, { method: 'DELETE' });
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
        total()  { return apiFetch('/api/users?limit=1'); },
        active() { return apiFetch('/api/users?status=active&limit=1'); },
        locked() { return apiFetch('/api/users?status=locked&limit=1'); },
        admins() { return apiFetch('/api/users?role=ADMIN&limit=1'); },
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
            body: (data instanceof FormData) ? data : JSON.stringify(data)
        });
    },
    /** Cập nhật sản phẩm */
    update(id, data) {
        return apiFetch(`/api/products/${id}`, {
            method: 'PUT',
            body: (data instanceof FormData) ? data : JSON.stringify(data)
        });
    },
    /** Xóa sản phẩm */
    delete(id) {
        return apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    },
    uploadColorImage(id, colorId, data) {
        return apiFetch(`/api/products/${id}/colors/${colorId}/images`, {
            method: 'POST',
            body: data
        });
    },
    updateImageOrder(id, imageId, order) {
        return apiFetch(`/api/products/${id}/images/order`, {
            method: 'PATCH',
            body: JSON.stringify({ imageId, order })
        });
    },
    deleteColorImage(id, imageId) {
        return apiFetch(`/api/products/${id}/images/${imageId}`, { method: 'DELETE' });
    }
};

// ===== VARIANT API =====
const variantApi = {
    getAll(productId, params = '') {
        return apiFetch(`/api/products/${productId}/variants?${params}`);
    },
    add(productId, data) {
        return apiFetch(`/api/products/${productId}/variants`, {
            method: 'POST',
            body: data // FormData
        });
    },
    update(variantId, data) {
        return apiFetch(`/api/products/variants/${variantId}`, {
            method: 'PUT',
            body: data // FormData
        });
    },
    delete(variantId) {
        return apiFetch(`/api/products/variants/${variantId}`, { method: 'DELETE' });
    },
    batchUpdatePrice(productId, colorId, price) {
        return apiFetch(`/api/products/${productId}/variants/batch-price`, {
            method: 'PATCH',
            body: JSON.stringify({ colorId, price })
        });
    }
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
        return apiFetch('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ variantId, quantity })
        });
    },
    /** Cập nhật số lượng item */
    updateQuantity(itemId, quantity) {
        return apiFetch(`/api/cart/items/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity })
        });
    },
    /** Xóa 1 item khỏi giỏ hàng */
    removeItem(itemId) {
        return apiFetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
    },
    /** Xóa toàn bộ giỏ hàng */
    clearCart() {
        return apiFetch('/api/cart', { method: 'DELETE' });
    }
};

// ===== INVENTORY API =====
const inventoryApi = {
    overview() {
        return apiFetch('/api/inventory/overview');
    },
    getItems(params = '') {
        return apiFetch(`/api/inventory/items?${params}`);
    },
    getLogs(params = '') {
        return apiFetch(`/api/inventory/logs?${params}`);
    },
    adjust(data) {
        return apiFetch('/api/inventory/adjust', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
// ===== ORDER API =====
const orderApi = {
    // Admin APIs
    getAllAdmin(params = '') {
        return apiFetch(`/api/orders?${params}`);
    },
    updateStatusAdmin(orderId, statusData) {
        return apiFetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        });
    },
    
    // User APIs
    getMyOrders() {
        return apiFetch('/api/orders/mine');
    },
    getById(orderId) {
        return apiFetch(`/api/orders/${orderId}`);
    },
    create(data) {
        return apiFetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    cancel(orderId) {
        return apiFetch(`/api/orders/${orderId}/cancel`, {
            method: 'PATCH'
        });
    }
};

// ===== GLOBAL HEADER UI LOGIC =====
window.syncCartCountFromAPI = async function() {
    const token = localStorage.getItem("shoeshop_token") || localStorage.getItem("token");
    if (!token) {
        localStorage.removeItem('shoeshop_cart_count');
        updateGlobalCartBadge();
        return;
    }
    try {
        const res = await fetch("http://localhost:3000/api/cart", {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            const cartData = await res.json();
            const items = (cartData.data && cartData.data.items) || [];
            const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            localStorage.setItem('shoeshop_cart_count', totalItems);
            updateGlobalCartBadge();
        }
    } catch (e) {
        console.log("Lỗi đồng bộ số lượng giỏ hàng", e);
    }
};

window.updateGlobalCartBadge = function() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = parseInt(localStorage.getItem('shoeshop_cart_count') || '0', 10);
        cartCount.textContent = totalItems > 99 ? '99+' : totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
};

// Initial sync on startup
setTimeout(() => {
    if (typeof window.syncCartCountFromAPI === 'function') {
        window.syncCartCountFromAPI();
    }
}, 500);

// Polling local storage to keep tabs in sync easily
setInterval(() => {
    if (typeof window.updateGlobalCartBadge === 'function') {
        window.updateGlobalCartBadge();
    }
}, 1000);

// ===== NOTIFICATION API =====
window.renderNotificationBell = async function() {
    const area = document.getElementById("notificationBellArea");
    const token = localStorage.getItem('shoeshop_token') || localStorage.getItem('token');
    if (!area || !token) return;
    area.innerHTML = `
        <a href="/pages/customer/notifications.html" style="position:relative; display:inline-block; margin-right: 15px; color:#333; text-decoration:none; font-size: 18px;">
            🛎️
            <span id="bellBadgeCount" style="display:none; position:absolute; top:-8px; right:-10px; background:#e63946; color:#fff; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:50%;">0</span>
        </a>
    `;
    try {
        const res = await fetch('http://localhost:3000/api/notifications', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (data && data.notifications) {
            const unreadCount = data.unreadCount || 0;
            const badge = document.getElementById("bellBadgeCount");
            if (unreadCount > 0 && badge) {
                badge.textContent = unreadCount;
                badge.style.display = 'inline-block';
            }
        }
    } catch(e) {}
};

const notificationApi = {
    getMyNotifications() { return apiFetch('/api/notifications'); },
    markAsRead(id) { return apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }); },
    markAllAsRead() { return apiFetch('/api/notifications/read-all', { method: 'PATCH' }); }
};

// ===== SOCKET.IO REALTIME NOTIFICATION INIT =====
function initSocket() {
    const user = JSON.parse(localStorage.getItem("shoeshop_user")) || JSON.parse(localStorage.getItem("shoeshop_current_user_v1"));
    if (!user) return; // Do not connect if not logged in

    const script = document.createElement('script');
    script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    script.onload = () => {
        const socket = io('http://localhost:3000');
        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('register', user._id || user.id);
        });

        socket.on('notification', (data) => {
            console.log('Received notification:', data);
            showNotificationToast(data.title, data.message);
            // Cập nhật icon chuông nếu cần thiết
            const bellCount = document.getElementById('bellBadgeCount');
            if (bellCount) {
                let current = parseInt(bellCount.textContent || '0');
                bellCount.textContent = current + 1;
                bellCount.style.display = 'inline-block';
            }
        });
    };
    document.head.appendChild(script);
}

function showNotificationToast(title, message) {
    let container = document.getElementById('toastWrap');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastWrap';
        container.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
        `;
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #fff; border-left: 5px solid #1a73e8; border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 15px 20px;
        min-width: 250px; transform: translateX(120%); transition: transform 0.3s ease;
    `;
    toast.innerHTML = `
        <strong style="color:#333; display:block; margin-bottom:5px; font-size:14px">${title}</strong>
        <p style="margin:0; color:#666; font-size:13px">${message}</p>
    `;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    
    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    initSocket();
});

