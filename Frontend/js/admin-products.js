// admin-products.js — Logic trang Quản lý Sản phẩm
// Yêu cầu: admin-utils.js, api-client.js được load trước

// ===== INIT =====
const currentUser = initAdminPage();

// ===== STATE =====
let currentPage    = 1;
const PAGE_LIMIT   = 10;
let deleteTargetId = null;
let isEditMode     = false;
let searchTimeout  = null;
let allCategories  = [];

// ===== LOAD CATEGORIES =====
async function loadCategories() {
    try {
        allCategories = await categoryApi.getAll();
        const filterSel = document.getElementById('filter-category');
        filterSel.innerHTML = '<option value="">Tất cả danh mục</option>';
        allCategories.forEach(c => {
            filterSel.innerHTML += `<option value="${c._id}">${c.name}</option>`;
        });
        populateCategorySelect('');
    } catch (_) {}
}

function populateCategorySelect(selectedId) {
    const sel = document.getElementById('form-category');
    sel.innerHTML = '<option value="">— Không thuộc danh mục —</option>';
    allCategories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = c.name;
        if (c._id === selectedId) opt.selected = true;
        sel.appendChild(opt);
    });
}

// ===== LOAD PRODUCTS =====
async function loadProducts(page = currentPage) {
    currentPage = page;
    showLoading(true);
    const search   = document.getElementById('search-input').value.trim();
    const status   = document.getElementById('filter-status').value;
    const category = document.getElementById('filter-category').value;
    const params   = new URLSearchParams({ page, limit: PAGE_LIMIT });
    if (search)   params.set('search', search);
    if (status)   params.set('status', status);
    if (category) params.set('category', category);
    try {
        const data = await productApi.getAll(params);
        renderTable(data.products || data);
        if (data.total !== undefined) renderPagination(data.total, data.page);
        fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
    finally { showLoading(false); }
}

function renderTable(products) {
    const tbody = document.getElementById('product-tbody');
    const empty = document.getElementById('empty-state');
    if (!products || products.length === 0) {
        tbody.innerHTML = ''; empty.style.display = 'flex'; return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = products.map((p, idx) => {
        const created  = new Date(p.createdAt).toLocaleDateString('vi-VN');
        const stockCls = p.stock <= 5 ? 'low' : '';
        const price    = p.price ? p.price.toLocaleString('vi-VN') + ' ₫' : '—';
        const catId    = p.categoryId?._id || p.categoryId;
        const catObj   = allCategories.find(c => c._id === catId);
        const catName  = catObj
            ? `<span class="badge badge-staff" style="font-size:0.72rem;"><i class="fa-solid fa-tag"></i> ${catObj.name}</span>`
            : `<span style="color:var(--text-muted)">—</span>`;
        const mainImage = (p.images && p.images.length > 0) ? p.images[0].url : '';
        const imgHtml  = mainImage 
            ? `<img src="${mainImage}" class="product-img-mini" onerror="this.src='https://placehold.co/40x40?text=Shoe'">`
            : `<div class="product-icon"><i class="fa-solid fa-shoe-prints"></i></div>`;

        return `
        <tr class="${!p.isActive ? 'row-inactive' : ''}">
            <td class="td-num">${(currentPage - 1) * PAGE_LIMIT + idx + 1}</td>
            <td>
                <div class="product-cell">
                    ${imgHtml}
                    <div>
                        <p class="product-name">${p.name}</p>
                        <p class="product-desc">${p.description || '—'}</p>
                    </div>
                </div>
            </td>
            <td>${catName}</td>
            <td class="td-price">${price}</td>
            <td class="td-stock ${stockCls}">
                ${p.stock} ${p.stock <= 5 ? '<i class="fa-solid fa-triangle-exclamation" title="Sắp hết hàng"></i>' : ''}
            </td>
            <td>${p.isActive
                ? '<span class="badge badge-active"><i class="fa-solid fa-circle"></i> Đang bán</span>'
                : '<span class="badge badge-inactive"><i class="fa-solid fa-circle"></i> Ngừng bán</span>'}</td>
            <td class="td-date">${created}</td>
            <td>
                <div class="action-group">
                    <button class="btn-icon edit" onclick="openEditModal('${p._id}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon ${p.isActive ? 'lock' : 'unlock'}" onclick="toggleStatus('${p._id}', ${p.isActive})" title="${p.isActive ? 'Ẩn sản phẩm' : 'Hiển thị'}">
                        <i class="fa-solid fa-${p.isActive ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn-icon delete" onclick="openDeleteModal('${p._id}','${p.name.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderPagination(total, page) {
    const pages = Math.ceil(total / PAGE_LIMIT);
    const pag = document.getElementById('pagination');
    if (pages <= 1) { pag.innerHTML = ''; return; }
    let html = `<span class="pag-info">Tổng ${total} sản phẩm</span><div class="pag-btns">`;
    html += `<button onclick="loadProducts(${page - 1})" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="loadProducts(${i})">${i}</button>`;
        } else if (Math.abs(i - page) === 2) html += `<span>…</span>`;
    }
    html += `<button onclick="loadProducts(${page + 1})" ${page === pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button></div>`;
    pag.innerHTML = html;
}

async function fetchStats() {
    try {
        const [all, active, inactive] = await Promise.all([
            productApi.getAll('limit=1&page=1'),
            productApi.getAll('limit=1&page=1&status=active'),
            productApi.getAll('limit=1&page=1&status=inactive'),
        ]);
        document.getElementById('stat-total').textContent    = all.total ?? '—';
        document.getElementById('stat-active').textContent   = active.total ?? '—';
        document.getElementById('stat-inactive').textContent = inactive.total ?? '—';
        const allProds = await productApi.getAll();
        const lowArr   = Array.isArray(allProds) ? allProds : (allProds.products || []);
        document.getElementById('stat-low').textContent = lowArr.filter(p => p.stock <= 5).length;
    } catch (_) {}
}

// ===== ADD MODAL =====
function openAddModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'Thêm sản phẩm mới';
    document.getElementById('btn-submit-product').querySelector('.btn-text').textContent = 'Tạo sản phẩm';
    document.getElementById('product-form').reset();
    document.getElementById('form-product-id').value = '';
    document.getElementById('form-isActive').value = 'true';
    document.getElementById('form-image-file').value = '';
    document.getElementById('form-image-url').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('form-image-preview').src = '';
    document.getElementById('variant-tbody').innerHTML = '';
    populateCategorySelect('');
    openModal('modal-product');
}

// ===== EDIT MODAL =====
async function openEditModal(id) {
    isEditMode = true;
    document.getElementById('modal-title').textContent = 'Chỉnh sửa sản phẩm';
    document.getElementById('btn-submit-product').querySelector('.btn-text').textContent = 'Lưu thay đổi';
    openModal('modal-product');
    try {
        const p = await productApi.getById(id);
        document.getElementById('form-product-id').value  = p._id;
        document.getElementById('form-name').value        = p.name;
        document.getElementById('form-description').value = p.description || '';
        document.getElementById('form-price').value       = p.price || 0;
        document.getElementById('form-stock').value       = p.stock || 0;
        document.getElementById('form-isActive').value    = p.isActive ? 'true' : 'false';
        
        // Populate existing image URL
        const imageUrl = (p.images && p.images.length > 0) ? p.images[0].url : '';
        document.getElementById('form-image-url').value = imageUrl;
        document.getElementById('form-image-file').value = ''; // Reset file input
        
        if (imageUrl) {
            document.getElementById('form-image-preview').src = imageUrl;
            document.getElementById('image-preview-container').style.display = 'block';
        } else {
            document.getElementById('image-preview-container').style.display = 'none';
        }

        // Populate Variants
        const vTbody = document.getElementById('variant-tbody');
        vTbody.innerHTML = '';
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => {
                addVariantToTable(v.size, v.color, v.price, v.stock);
            });
        }

        populateCategorySelect(p.categoryId?._id || p.categoryId || '');
    } catch (err) { showToast(err.message, 'error'); closeModal('modal-product'); }
}

// ===== SUBMIT =====
async function submitProductForm(e) {
    e.preventDefault();
    const btn    = document.getElementById('btn-submit-product');
    setButtonLoading(btn, true);
    const catVal = document.getElementById('form-category').value;
    const imageFile = document.getElementById('form-image-file').files[0];
    const existingUrl = document.getElementById('form-image-url').value;

    const fd = new FormData();
    fd.append('name', document.getElementById('form-name').value.trim());
    fd.append('description', document.getElementById('form-description').value.trim());
    fd.append('price', parseFloat(document.getElementById('form-price').value) || 0);
    fd.append('stock', parseInt(document.getElementById('form-stock').value) || 0);
    fd.append('isActive', document.getElementById('form-isActive').value === 'true');
    fd.append('categoryId', catVal || '');

    if (imageFile) {
        // Nếu có chọn file mới → upload file (backend xử lý req.files)
        fd.append('images', imageFile);
    } else if (existingUrl) {
        // Nếu không có file mới nhưng có ảnh cũ → gửi lại list ảnh (JSON string)
        fd.append('images', JSON.stringify([{ url: existingUrl }]));
    }

    // Collect Variants
    const variants = [];
    const vRows = document.querySelectorAll('#variant-tbody tr');
    vRows.forEach(row => {
        variants.push({
            size: row.dataset.size,
            color: row.dataset.color,
            price: parseFloat(row.dataset.price) || 0,
            stock: parseInt(row.dataset.stock) || 0
        });
    });
    fd.append('variants', JSON.stringify(variants));

    const id = document.getElementById('form-product-id').value;
    try {
        if (isEditMode) {
            await productApi.update(id, fd);
            showToast('Cập nhật sản phẩm thành công!', 'success');
        } else {
            await productApi.create(fd);
            showToast('Thêm sản phẩm thành công!', 'success');
        }
        closeModal('modal-product');
        loadProducts();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setButtonLoading(btn, false); }
}

// ===== TOGGLE STATUS =====
async function toggleStatus(id, currentActive) {
    const action = currentActive ? 'ẩn' : 'hiển thị';
    if (!confirm(`Bạn có chắc muốn ${action} sản phẩm này?`)) return;
    try {
        await productApi.update(id, { isActive: !currentActive });
        showToast(currentActive ? 'Đã ẩn sản phẩm.' : 'Đã hiển thị sản phẩm.', 'success');
        loadProducts();
    } catch (err) { showToast(err.message, 'error'); }
}

// ===== DELETE =====
function openDeleteModal(id, name) {
    deleteTargetId = id;
    document.getElementById('delete-product-name').textContent = name;
    openModal('modal-delete');
}
async function confirmDelete() {
    const btn = document.getElementById('btn-confirm-delete');
    setButtonLoading(btn, true);
    try {
        await productApi.delete(deleteTargetId);
        showToast('Xóa sản phẩm thành công!', 'success');
        closeModal('modal-delete');
        loadProducts();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setButtonLoading(btn, false); }
}

// ===== HELPERS =====
function showLoading(show) {
    document.getElementById('table-loading').classList.toggle('show', show);
    document.getElementById('product-table').style.opacity = show ? '0.35' : '1';
}
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadProducts(1), 400);
}

function handleFileSelect(input) {
    const file = input.files[0];
    const preview = document.getElementById('form-image-preview');
    const container = document.getElementById('image-preview-container');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            container.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        const existingUrl = document.getElementById('form-image-url').value;
        if (existingUrl) {
            preview.src = existingUrl;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
}

// ===== VARIANTS HELPERS =====
function addVariantRow() {
    const size = document.getElementById('variant-size').value.trim();
    const color = document.getElementById('variant-color').value.trim();
    const price = document.getElementById('variant-price').value || '';
    const stock = document.getElementById('variant-stock').value || '0';

    if (!size && !color) {
        showToast('Vui lòng nhập Size hoặc Màu!', 'error');
        return;
    }

    addVariantToTable(size, color, price, stock);

    // Reset inputs
    document.getElementById('variant-size').value = '';
    document.getElementById('variant-color').value = '';
    document.getElementById('variant-price').value = '';
    document.getElementById('variant-stock').value = '';
}

function addVariantToTable(size, color, price, stock) {
    const tbody = document.getElementById('variant-tbody');
    const tr = document.createElement('tr');
    tr.dataset.size = size || '';
    tr.dataset.color = color || '';
    tr.dataset.price = price || '0';
    tr.dataset.stock = stock || '0';
    tr.innerHTML = `
        <td>${size || '—'}</td>
        <td>${color || '—'}</td>
        <td>${price ? parseFloat(price).toLocaleString('vi-VN') + ' ₫' : '—'}</td>
        <td>${stock}</td>
        <td style="text-align: right;">
            <button type="button" class="btn-icon delete" onclick="this.closest('tr').remove()" style="width: 28px; height: 28px;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

// ===== INIT =====
loadCategories().then(() => loadProducts(1));
