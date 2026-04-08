// USER_KEY đã được khai báo bởi notify.js ('shoeshop_current_user_v1')
const ORDERS_TOKEN_KEY = 'shoeshop_token';

function getToken() { return localStorage.getItem(ORDERS_TOKEN_KEY); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('shoeshop_current_user_v1') || 'null'); }

function formatCurrency(amount) {
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ===== SHOW / HIDE STATES =====
function showState(state) {
    document.getElementById('stateLoading').hidden = (state !== 'loading');
    document.getElementById('stateEmpty').hidden = (state !== 'empty');
    document.getElementById('ordersList').hidden = (state !== 'list');
}

function setEmptyState(icon, title, desc, actionText, actionHref) {
    document.getElementById('emptyIcon').textContent = icon;
    document.getElementById('emptyTitle').textContent = title;
    document.getElementById('emptyDesc').textContent = desc;
    document.getElementById('emptyAction').textContent = actionText;
    document.getElementById('emptyAction').href = actionHref;
    showState('empty');
}

// ===== STATUS / PAYMENT MAPS =====
const STATUS_MAP = {
    'PENDING': { label: 'Chờ xử lý', dot: '🟡' },
    'CONFIRMED': { label: 'Đã xác nhận', dot: '🔵' },
    'SHIPPING': { label: 'Đang giao', dot: '🟣' },
    'COMPLETED': { label: 'Hoàn tất', dot: '🟢' },
    'CANCELLED': { label: 'Đã hủy', dot: '🔴' },
};

const PAYMENT_MAP = {
    'COD': { label: 'Thanh toán khi nhận hàng', icon: '💵' },
    'Banking': { label: 'Chuyển khoản ngân hàng', icon: '🏦' },
    'Momo': { label: 'Ví Momo', icon: '📱' },
};

// ===== FETCH ORDERS =====
async function fetchMyOrders() {
    const res = await fetch('/api/orders/my-orders', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi không xác định');
    return data.data || [];
}

// ===== TẠO PHẦN TỬ ĐƠN HÀNG (DOM API, KHÔNG innerHTML string) =====
function createOrderCard(order) {
    const statusInfo = STATUS_MAP[order.status] || { label: order.status, dot: '⚪' };
    const paymentInfo = PAYMENT_MAP[order.paymentMethod] || { label: order.paymentMethod, icon: '💳' };

    // Card wrapper
    const card = document.createElement('div');
    card.className = 'order-card';

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'order-card-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'order-card-header-left';

    const numEl = document.createElement('div');
    numEl.className = 'order-number';
    numEl.textContent = `Đơn hàng #${order.orderNumber || order._id.slice(-8).toUpperCase()}`;

    const dateEl = document.createElement('div');
    dateEl.className = 'order-date';
    dateEl.textContent = `📅 ${formatDate(order.createdAt)}`;

    headerLeft.append(numEl, dateEl);

    const badge = document.createElement('span');
    badge.className = `order-status-badge status-${order.status}`;
    badge.textContent = `${statusInfo.dot} ${statusInfo.label}`;

    header.append(headerLeft, badge);

    // --- Body ---
    const body = document.createElement('div');
    body.className = 'order-card-body';

    // Shipping info row
    const shipRow = document.createElement('div');
    shipRow.className = 'order-shipping-info';

    const shipIcon = document.createElement('div');
    shipIcon.className = 'ship-icon';
    shipIcon.textContent = '🚚';

    const shipText = document.createElement('div');
    const shipTitle = document.createElement('strong');
    shipTitle.textContent = 'Địa chỉ giao hàng';
    const shipAddr = document.createTextNode(' ' + (order.shippingAddress || 'Chưa có thông tin'));
    shipText.append(shipTitle, document.createElement('br'), shipAddr);

    shipRow.append(shipIcon, shipText);

    // Items label
    const itemsLabel = document.createElement('div');
    itemsLabel.className = 'order-items-label';
    itemsLabel.textContent = `Sản phẩm (${(order.items || []).length} món)`;

    // Items list
    const itemsList = document.createElement('div');
    itemsList.className = 'order-items-list';

    (order.items || []).forEach(item => {
        const row = document.createElement('div');
        row.className = 'order-item-row';

        // Ảnh
        if (item.productImage) {
            const img = document.createElement('img');
            img.className = 'order-item-img';
            img.src = item.productImage;
            img.alt = item.productName;
            img.onerror = () => {
                const ph = document.createElement('div');
                ph.className = 'order-item-img-placeholder';
                ph.textContent = '👟';
                img.replaceWith(ph);
            };
            row.appendChild(img);
        } else {
            const ph = document.createElement('div');
            ph.className = 'order-item-img-placeholder';
            ph.textContent = '👟';
            row.appendChild(ph);
        }

        // Info
        const info = document.createElement('div');
        info.className = 'order-item-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'order-item-name';
        nameEl.textContent = item.productName || 'Sản phẩm';

        const metaParts = [];
        if (item.size) metaParts.push(`Size: ${item.size}`);
        if (item.color) metaParts.push(`Màu: ${item.color}`);
        metaParts.push(`x${item.quantity}`);

        const metaEl = document.createElement('div');
        metaEl.className = 'order-item-meta';
        metaEl.textContent = metaParts.join(' · ');

        info.append(nameEl, metaEl);

        // Giá
        const priceEl = document.createElement('div');
        priceEl.className = 'order-item-price';
        priceEl.textContent = formatCurrency(item.price * item.quantity);

        row.append(info, priceEl);
        itemsList.appendChild(row);
    });

    body.append(shipRow, itemsLabel, itemsList);

    // --- Footer ---
    const footer = document.createElement('div');
    footer.className = 'order-card-footer';

    const paymentEl = document.createElement('div');
    paymentEl.className = 'order-payment-method';
    paymentEl.textContent = `${paymentInfo.icon} ${paymentInfo.label}`;

    const totalEl = document.createElement('div');
    totalEl.className = 'order-total-amount';
    totalEl.textContent = `Tổng: ${formatCurrency(order.totalAmount)}`;

    footer.append(paymentEl, totalEl);

    card.append(header, body, footer);
    return card;
}

// ===== RENDER CHÍNH =====
async function renderOrders() {
    const user = getCurrentUser();

    if (!user || !getToken()) {
        setEmptyState('🔒', 'Bạn chưa đăng nhập', 'Vui lòng đăng nhập để xem đơn hàng.', 'Đăng nhập ngay', '/pages/customer/auth.html');
        return;
    }

    showState('loading');

    try {
        const orders = await fetchMyOrders();

        if (!orders.length) {
            setEmptyState('📦', 'Bạn chưa có đơn hàng nào', 'Hãy chọn cho mình một đôi giày ưng ý nhé!', 'Mua sắm ngay', '/pages/customer/products.html');
            return;
        }

        const list = document.getElementById('ordersList');
        list.innerHTML = '';
        orders.forEach(order => list.appendChild(createOrderCard(order)));

        showState('list');

    } catch (err) {
        console.error('[renderOrders] Error:', err);
        setEmptyState('⚠️', 'Không thể tải đơn hàng', err.message, 'Thử lại', '/pages/customer/orders.html');
    }
}

// ===== LOAD COMPONENT =====
async function loadComponent(id, file) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        document.getElementById(id).innerHTML = html;
        if (id === 'header') renderHeaderAuth();
    } catch (e) { console.warn('Lỗi load component:', e); }
}

function renderHeaderAuth() {
    const headerRight = document.getElementById('headerRight');
    if (!headerRight) return;
    const user = getCurrentUser();
    if (user) {
        let extraLink = '';
        if (user.role === 'ADMIN') extraLink = `<a class="header-link" href="/pages/admin/dashboard.html">Admin</a>`;
        else if (user.role === 'STAFF') extraLink = `<a class="header-link" href="/pages/staff/dashboard.html">Staff</a>`;
        headerRight.innerHTML = `
            <div id="notificationBellArea"></div>
            ${extraLink}
            <span class="user-text">Xin chào, ${user.fullName || user.email}</span>
            <button class="header-btn" onclick="handleLogout()">Đăng xuất</button>
        `;
        if (typeof renderNotificationBell === 'function') renderNotificationBell();
    } else {
        headerRight.innerHTML = `
            <a class="header-link" href="/pages/customer/auth.html">Đăng nhập</a>
            <a class="header-link" href="/pages/customer/auth.html?tab=register">Đăng ký</a>
        `;
    }
}

function handleLogout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/index.html';
}

// ===== BOOT =====
if (typeof seedNotifications === 'function') seedNotifications();
loadComponent('header', '/components/header.html');
loadComponent('footer', '/components/footer.html');
renderOrders();
