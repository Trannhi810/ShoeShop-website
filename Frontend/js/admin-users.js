// admin-users.js — Logic trang Quản lý Người dùng
// Yêu cầu: admin-utils.js, api-client.js được load trước

// ===== INIT =====
const currentUser = initAdminPage();

// ===== STATE =====
let currentPage    = 1;
const PAGE_LIMIT   = 10;
let deleteTargetId = null;
let searchTimeout  = null;
let isEditMode     = false;

// ===== LOAD USERS =====
async function loadUsers(page = currentPage) {
    currentPage = page;
    showTableLoading(true);

    const search = document.getElementById('search-input').value.trim();
    const role   = document.getElementById('filter-role').value;
    const status = document.getElementById('filter-status').value;
    const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
    if (search) params.set('search', search);
    if (role)   params.set('role', role);
    if (status) params.set('status', status);

    try {
        const data = await userApi.getAll(params);
        renderTable(data.users);
        renderPagination(data.total, data.page);
        updateStats(data.users, data.total);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        showTableLoading(false);
    }
}

function renderTable(users) {
    const tbody = document.getElementById('user-tbody');
    const empty = document.getElementById('empty-state');

    if (!users || users.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = users.map((u, idx) => {
        const initials  = (u.fullName || u.email || '?')[0].toUpperCase();
        const createdAt = new Date(u.createdAt).toLocaleDateString('vi-VN');
        const isSelf    = u._id === currentUser.id;

        return `
        <tr class="${!u.isActive ? 'row-locked' : ''}">
            <td class="td-num">${(currentPage - 1) * PAGE_LIMIT + idx + 1}</td>
            <td>
                <div class="user-cell">
                    <div class="user-avatar">${initials}</div>
                    <div>
                        <p class="user-name">${u.fullName || '<em>Chưa đặt tên</em>'}</p>
                        ${u.googleId ? '<span class="badge-google"><i class="fa-brands fa-google"></i> Google</span>' : ''}
                    </div>
                </div>
            </td>
            <td class="td-email">${u.email}</td>
            <td>${u.phone || '<span class="text-muted">—</span>'}</td>
            <td>${roleBadge(u.role)}</td>
            <td>${statusBadge(u.isActive)}</td>
            <td class="td-date">${createdAt}</td>
            <td>
                <div class="action-group">
                    <button class="btn-icon edit" onclick="openEditModal('${u._id}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon ${u.isActive ? 'lock' : 'unlock'}" onclick="toggleLock('${u._id}', '${u.fullName || u.email}', ${u.isActive})" title="${u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}" ${isSelf ? 'disabled' : ''}>
                        <i class="fa-solid fa-${u.isActive ? 'lock' : 'lock-open'}"></i>
                    </button>
                    <button class="btn-icon delete" onclick="openDeleteModal('${u._id}', '${(u.fullName || u.email).replace(/'/g, "\\'")}')" title="Xóa" ${isSelf ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function roleBadge(role) {
    const map = {
        ADMIN:    '<span class="badge badge-admin"><i class="fa-solid fa-shield-halved"></i> Admin</span>',
        STAFF:    '<span class="badge badge-staff"><i class="fa-solid fa-id-badge"></i> Nhân viên</span>',
        CUSTOMER: '<span class="badge badge-customer"><i class="fa-solid fa-user"></i> Khách hàng</span>',
    };
    return map[role] || `<span class="badge">${role}</span>`;
}

function statusBadge(isActive) {
    return isActive
        ? '<span class="badge badge-active"><i class="fa-solid fa-circle"></i> Hoạt động</span>'
        : '<span class="badge badge-locked"><i class="fa-solid fa-circle"></i> Đã khóa</span>';
}

function renderPagination(total, page) {
    const totalPages = Math.ceil(total / PAGE_LIMIT);
    const pag = document.getElementById('pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }

    let html = `<span class="pag-info">Tổng ${total} bản ghi</span><div class="pag-btns">`;
    html += `<button onclick="loadUsers(${page - 1})" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="loadUsers(${i})">${i}</button>`;
        } else if (Math.abs(i - page) === 2) {
            html += `<span>…</span>`;
        }
    }
    html += `<button onclick="loadUsers(${page + 1})" ${page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button></div>`;
    pag.innerHTML = html;
}

function updateStats(users, total) {
    document.getElementById('stat-total').textContent = total;
    fetchStats();
}

async function fetchStats() {
    try {
        const [all, active, locked, admins] = await Promise.all([
            userApi.stats.total(),
            userApi.stats.active(),
            userApi.stats.locked(),
            userApi.stats.admins(),
        ]);
        document.getElementById('stat-total').textContent  = all.total;
        document.getElementById('stat-active').textContent = active.total;
        document.getElementById('stat-locked').textContent = locked.total;
        document.getElementById('stat-admin').textContent  = admins.total;
    } catch (_) {}
}

// ===== MODAL ADD =====
function openAddModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'Thêm người dùng mới';
    document.getElementById('user-form').reset();
    document.getElementById('form-user-id').value = '';
    document.getElementById('pw-required').style.display = 'inline';
    document.getElementById('pw-hint').style.display = 'none';
    document.getElementById('form-password').required = true;
    document.getElementById('btn-submit-form').querySelector('.btn-text').textContent = 'Tạo tài khoản';
    openModal('modal-user');
}

// ===== MODAL EDIT =====
async function openEditModal(userId) {
    isEditMode = true;
    document.getElementById('modal-title').textContent = 'Chỉnh sửa người dùng';
    document.getElementById('btn-submit-form').querySelector('.btn-text').textContent = 'Lưu thay đổi';
    document.getElementById('pw-required').style.display = 'none';
    document.getElementById('pw-hint').style.display = 'inline';
    document.getElementById('form-password').required = false;
    openModal('modal-user');

    try {
        const user = await userApi.getById(userId);
        document.getElementById('form-user-id').value  = user._id;
        document.getElementById('form-fullName').value = user.fullName || '';
        document.getElementById('form-email').value    = user.email || '';
        document.getElementById('form-phone').value    = user.phone || '';
        document.getElementById('form-address').value  = user.address || '';
        document.getElementById('form-role').value     = user.role || 'CUSTOMER';
        document.getElementById('form-password').value = '';
    } catch (err) {
        showToast(err.message, 'error');
        closeModal('modal-user');
    }
}

// ===== SUBMIT FORM =====
async function submitUserForm(e) {
    e.preventDefault();
    const userId = document.getElementById('form-user-id').value;
    const btn    = document.getElementById('btn-submit-form');
    setButtonLoading(btn, true);

    const payload = {
        fullName: document.getElementById('form-fullName').value,
        email:    document.getElementById('form-email').value,
        phone:    document.getElementById('form-phone').value,
        address:  document.getElementById('form-address').value,
        role:     document.getElementById('form-role').value,
    };
    const pw = document.getElementById('form-password').value;
    if (pw) payload.password = pw;

    try {
        if (isEditMode) {
            await userApi.update(userId, payload);
            showToast('Cập nhật người dùng thành công!', 'success');
        } else {
            if (!pw) { showToast('Vui lòng nhập mật khẩu!', 'error'); return; }
            const newUser = await userApi.register({ ...payload, password: pw });
            if (payload.role !== 'CUSTOMER') {
                await userApi.update(newUser.user.id, { role: payload.role });
            }
            showToast('Tạo tài khoản thành công!', 'success');
        }
        closeModal('modal-user');
        loadUsers();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== TOGGLE LOCK =====
async function toggleLock(userId, userName, isCurrentlyActive) {
    const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản của ${userName}?`)) return;
    try {
        const data = await userApi.toggleLock(userId);
        showToast(data.message, 'success');
        loadUsers();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== DELETE =====
function openDeleteModal(userId, userName) {
    deleteTargetId = userId;
    document.getElementById('delete-user-name').textContent = userName;
    openModal('modal-delete');
}

async function confirmDelete() {
    const btn = document.getElementById('btn-confirm-delete');
    setButtonLoading(btn, true);
    try {
        await userApi.delete(deleteTargetId);
        showToast('Xóa tài khoản thành công!', 'success');
        closeModal('modal-delete');
        loadUsers();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== HELPERS =====
function showTableLoading(show) {
    document.getElementById('table-loading').classList.toggle('show', show);
    document.getElementById('user-table').style.opacity = show ? '0.3' : '1';
}

function togglePw(inputId, icon) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadUsers(1), 400);
}

// ===== INIT =====
loadUsers(1);
