// admin-categories.js — Logic trang Quản lý Danh mục
// Yêu cầu: admin-utils.js, api-client.js được load trước

// ===== INIT =====
const currentUser = initAdminPage();

// ===== STATE =====
let deleteTargetId = null;
let isEditMode     = false;
let searchTimeout  = null;
let allCategories  = [];

// ===== LOAD =====
async function loadCategories() {
    showLoading(true);
    const search = document.getElementById('search-input').value.trim();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    try {
        allCategories = await categoryApi.getAll(params);
        renderTable(allCategories);
        updateStats(allCategories);
    } catch (err) { showToast(err.message, 'error'); }
    finally { showLoading(false); }
}

function renderTable(cats) {
    const tbody = document.getElementById('cat-tbody');
    const empty = document.getElementById('empty-state');
    if (!cats || cats.length === 0) {
        tbody.innerHTML = ''; empty.style.display = 'flex'; return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = cats.map((c, idx) => {
        const created    = new Date(c.createdAt).toLocaleDateString('vi-VN');
        const countBadge = c.productCount > 0
            ? `<span class="badge badge-active"><i class="fa-solid fa-box-open"></i> ${c.productCount} SP</span>`
            : `<span class="badge badge-customer">Trống</span>`;
        return `
        <tr>
            <td class="td-num">${idx + 1}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-tag" style="color:white;font-size:0.9rem;"></i>
                    </div>
                    <strong>${c.name}</strong>
                </div>
            </td>
            <td style="color:var(--text-muted);font-size:0.85rem;max-width:260px;">
                ${c.description
                    ? `<span title="${c.description}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:240px;">${c.description}</span>`
                    : '<span style="color:var(--text-muted)">—</span>'}
            </td>
            <td>${countBadge}</td>
            <td class="td-date">${created}</td>
            <td>
                <div class="action-group">
                    <button class="btn-icon edit" onclick="openEditModal('${c._id}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon delete" onclick="openDeleteModal('${c._id}','${c.name.replace(/'/g, "\\'")}')" title="Xóa" ${c.productCount > 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateStats(cats) {
    document.getElementById('stat-total').textContent         = cats.length;
    document.getElementById('stat-with-products').textContent = cats.filter(c => c.productCount > 0).length;
    document.getElementById('stat-empty').textContent         = cats.filter(c => c.productCount === 0).length;
}

// ===== ADD MODAL =====
function openAddModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'Thêm danh mục mới';
    document.getElementById('btn-submit-cat').querySelector('.btn-text').textContent = 'Tạo danh mục';
    document.getElementById('cat-form').reset();
    document.getElementById('form-cat-id').value = '';
    openModal('modal-cat');
}

// ===== EDIT MODAL =====
async function openEditModal(id) {
    isEditMode = true;
    document.getElementById('modal-title').textContent = 'Chỉnh sửa danh mục';
    document.getElementById('btn-submit-cat').querySelector('.btn-text').textContent = 'Lưu thay đổi';
    openModal('modal-cat');
    try {
        const c = await categoryApi.getById(id);
        document.getElementById('form-cat-id').value   = c._id;
        document.getElementById('form-cat-name').value = c.name;
        document.getElementById('form-cat-desc').value = c.description || '';
    } catch (err) { showToast(err.message, 'error'); closeModal('modal-cat'); }
}

// ===== SUBMIT =====
async function submitCatForm(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-cat');
    setButtonLoading(btn, true);
    const payload = {
        name:        document.getElementById('form-cat-name').value.trim(),
        description: document.getElementById('form-cat-desc').value.trim(),
    };
    const id = document.getElementById('form-cat-id').value;
    try {
        if (isEditMode) {
            await categoryApi.update(id, payload);
            showToast('Cập nhật danh mục thành công!', 'success');
        } else {
            await categoryApi.create(payload);
            showToast('Thêm danh mục thành công!', 'success');
        }
        closeModal('modal-cat');
        loadCategories();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setButtonLoading(btn, false); }
}

// ===== DELETE =====
function openDeleteModal(id, name) {
    deleteTargetId = id;
    document.getElementById('delete-cat-name').textContent = name;
    openModal('modal-delete');
}
async function confirmDelete() {
    const btn = document.getElementById('btn-confirm-delete');
    setButtonLoading(btn, true);
    try {
        await categoryApi.delete(deleteTargetId);
        showToast('Xóa danh mục thành công!', 'success');
        closeModal('modal-delete');
        loadCategories();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setButtonLoading(btn, false); }
}

// ===== HELPERS =====
function showLoading(show) {
    document.getElementById('table-loading').classList.toggle('show', show);
    document.getElementById('cat-table').style.opacity = show ? '0.35' : '1';
}
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadCategories, 350);
}

// ===== INIT =====
loadCategories();
