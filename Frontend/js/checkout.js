/**
 * checkout.js
 * Xử lý logic thanh toán.
 * Đã loại bỏ các khai báo hằng số trùng lặp với notify.js để tránh crash.
 */

// Đổi tên hằng số để không bao giờ trùng
const CK_TOKEN_NAME = 'shoeshop_token';
const CK_USER_NAME = 'shoeshop_current_user_v1';

function getCkToken() { return localStorage.getItem(CK_TOKEN_NAME); }
function getCkUser() { return JSON.parse(localStorage.getItem(CK_USER_NAME) || 'null'); }

function formatVND(amount) {
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

// ===== ĐIỀU KHIỂN HIỂN THỊ =====
function setPageState(state) {
    const loading = document.getElementById('stateLoading');
    const empty = document.getElementById('stateEmpty');
    const checkout = document.getElementById('stateCheckout');

    if (loading) loading.hidden = (state !== 'loading');
    if (empty) empty.hidden = (state !== 'empty');
    if (checkout) checkout.hidden = (state !== 'checkout');
}

function showEmptyMessage(icon, title, desc, btnText, btnLink) {
    const iconEl = document.getElementById('emptyIcon');
    const titleEl = document.getElementById('emptyTitle');
    const descEl = document.getElementById('emptyDesc');
    const actionEl = document.getElementById('emptyAction');

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (actionEl) {
        actionEl.textContent = btnText;
        actionEl.href = btnLink;
    }
    setPageState('empty');
}

// ===== RENDER SẢN PHẨM TÓM TẮT =====
function renderSummary(items) {
    const container = document.getElementById('summaryItems');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    items.forEach(item => {
        const itemPrice = item.price || 0;
        const itemQty = item.quantity || 0;
        total += itemPrice * itemQty;

        const row = document.createElement('div');
        row.className = 'summary-item';

        // Xử lý ảnh
        let imgHtml = `<div class="summary-item-img-placeholder">👟</div>`;
        if (item.image) {
            imgHtml = `<img class="summary-item-img" src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<div class=\\'summary-item-img-placeholder\\'>👟</div>'" />`;
        }

        row.innerHTML = `
            ${imgHtml}
            <div class="summary-item-info">
                <div class="summary-item-name">${item.name || 'Sản phẩm'}</div>
                <div class="summary-item-meta">${item.size ? 'Size ' + item.size : ''} ${item.color || ''} x${itemQty}</div>
            </div>
            <div class="summary-item-price">${formatVND(itemPrice * itemQty)}</div>
        `;
        container.appendChild(row);
    });

    document.getElementById('summarySubtotal').textContent = formatVND(total);
    document.getElementById('summaryTotal').textContent = formatVND(total);
}

// ===== FETCH VÀ RENDER CHÍNH =====
async function initCheckout() {
    const user = getCkUser();
    const token = getCkToken();

    if (!user || !token) {
        showEmptyMessage('🔒', 'Bạn chưa đăng nhập', 'Vui lòng đăng nhập để thanh toán đơn hàng.', 'Đăng nhập ngay', '/pages/customer/auth.html');
        return;
    }

    setPageState('loading');

    try {
        const res = await fetch('/api/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Không thể tải giỏ hàng');

        const cart = data.data || { items: [] };
        if (!cart.items || cart.items.length === 0) {
            showEmptyMessage('🛒', 'Giỏ hàng trống', 'Hãy thêm sản phẩm vào giỏ trước khi thanh toán.', 'Đi mua sắm', '/pages/customer/products.html');
            return;
        }

        // Điền thông tin user vào form
        if (user.fullName) document.getElementById('fullName').value = user.fullName;
        if (user.phone) document.getElementById('phone').value = user.phone;
        if (user.address) document.getElementById('shippingAddress').value = user.address;

        renderSummary(cart.items);
        setPageState('checkout');

        // Gán sự kiện submit
        const form = document.getElementById('checkoutForm');
        if (form) form.onsubmit = handleOrderSubmit;

    } catch (err) {
        console.error(err);
        showEmptyMessage('⚠️', 'Lỗi kết nối', err.message, 'Thử lại', '/pages/customer/checkout.html');
    }
}

// ===== XỬ LÝ ĐẶT HÀNG =====
async function handleOrderSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');

    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('shippingAddress').value.trim();
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';

    if (!phone || !address) {
        alert('Vui lòng điền đầy đủ số điện thoại và địa chỉ!');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';

    try {
        const res = await fetch('/api/orders/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getCkToken()
            },
            body: JSON.stringify({ phone, shippingAddress: address, paymentMethod: method })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Lỗi đặt hàng');

        const orderCreated = data.data;

        // Nếu là VNPAY, gọi tiếp API tạo URL
        if (method === 'VNPAY') {
            submitBtn.textContent = '🔄 Đang chuyển hướng VNPAY...';
            const vnpRes = await fetch('/api/payment/create_payment_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getCkToken()
                },
                body: JSON.stringify({ 
                    amount: orderCreated.totalAmount, 
                    orderId: orderCreated._id,
                    language: 'vn' 
                })
            });
            const vnpData = await vnpRes.json();
            if (vnpData.success) {
                window.location.href = vnpData.paymentUrl;
                return;
            } else {
                throw new Error('Lỗi khởi tạo cổng thanh toán VNPAY');
            }
        }

        alert('🎉 Đặt hàng thành công!');
        window.location.href = '/pages/customer/orders.html';

    } catch (err) {
        alert('❌ ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '🛍️ Xác nhận đặt hàng';
    }
}

// ===== LOAD HEADER/FOOTER =====
async function loadLayout() {
    try {
        const [h, f] = await Promise.all([
            fetch('/components/header.html').then(r => r.text()),
            fetch('/components/footer.html').then(r => r.text())
        ]);
        document.getElementById('header').innerHTML = h;
        document.getElementById('footer').innerHTML = f;

        // Render auth state trong header (nếu có hàm trong layout.js/global)
        if (typeof renderHeaderAuth === 'function') renderHeaderAuth();
    } catch (e) { console.warn('Layout load failed'); }
}

// Khởi chạy ngay
loadLayout();
initCheckout();
