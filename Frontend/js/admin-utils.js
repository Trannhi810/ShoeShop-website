/**
 * admin-utils.js
 * Shared utilities dùng chung cho tất cả trang admin.
 * Include file này trước inline <script> của mỗi trang.
 */

// ===== TOKEN / USER =====
function getToken()      { return localStorage.getItem('shoeshop_token'); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem('shoeshop_user') || '{}'); }

/**
 * Kiểm tra quyền Admin, gán tên/avatar vào sidebar.
 * Gọi ở đầu mỗi trang → trả về object currentUser.
 */
function initAdminPage() {
    const token = getToken();
    const user  = getCurrentUser();
    if (!token || user.role !== 'ADMIN') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '/pages/auth.html';
        return {};
    }
    const el = document.getElementById('admin-name');
    const av = document.getElementById('admin-avatar');
    if (el) el.textContent = user.fullName || 'Admin';
    if (av) av.textContent = (user.fullName || 'A')[0].toUpperCase();
    return user;
}

// ===== API CORE =====
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

async function apiFetch(url, opts = {}) {
    const res  = await fetch(url, { headers: authHeaders(), ...opts });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi không xác định');
    return data;
}

// ===== MODAL =====
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id); }

// ===== BUTTON LOADING =====
function setButtonLoading(btn, on) {
    btn.querySelector('.btn-text').style.display     = on ? 'none'  : 'inline';
    btn.querySelector('.mini-spinner').style.display = on ? 'block' : 'none';
    btn.disabled = on;
}

// ===== SIDEBAR =====
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('shoeshop_token');
    localStorage.removeItem('shoeshop_user');
    window.location.href = '/pages/auth.html';
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const icons = { success: 'circle-check', error: 'circle-xmark', info: 'circle-info' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fa-solid fa-${icons[type] || 'circle-info'}"></i><span>${msg}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3500);
}
