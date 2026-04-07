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
                    <button class="btn-icon unlock" onclick="openVariantsModal('${p._id}', '${p.name.replace(/'/g, "\\'")}')" title="Biến thể">
                        <i class="fa-solid fa-layer-group"></i>
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

// ===== COLORS =====
async function loadColors() {
    try {
        allColors = await colorApi.getAll();
        const matSel = document.getElementById('mat-color-select');
        const formSel = document.getElementById('form-variant-color');
        const opts = '<option value="">-- Chọn Màu --</option>' + allColors.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        if(matSel) matSel.innerHTML = opts;
        if(formSel) formSel.innerHTML = opts;
    } catch (_) {}
}

// ===== VARIANTS MATRIX HELPERS =====
let currentProductIdForVariant = null;
let currentProductData = null;
let currentVariants = [];
let currentEditVariantId = null;

async function openVariantsModal(productId, productName) {
    currentProductIdForVariant = productId;
    document.getElementById('modal-variants').querySelector('h2').innerHTML = `<i class="fa-solid fa-layer-group"></i> Ma trận Biến thể: ${productName}`;
    resetVariantForm();
    openModal('modal-variants');
    await fetchVariantMatrix();
}

async function fetchVariantMatrix() {
    try {
        const [prod, vars] = await Promise.all([
            productApi.getById(currentProductIdForVariant),
            variantApi.getAll(currentProductIdForVariant, 'limit=1000') // fetch all
        ]);
        currentProductData = prod;
        currentVariants = vars.variants || [];
        renderMatrix();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderMatrix() {
    const container = document.getElementById('variant-matrix-container');
    if (!currentVariants.length && (!currentProductData.images || !currentProductData.images.length)) {
         container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có biến thể hoặc ảnh nào. Bắt đầu bằng cách thêm thủ công hoặc tạo lô phía trên.</div>';
         return;
    }

    const colorGroups = {};
    currentVariants.forEach(v => {
        const cId = v.colorId?._id || v.colorId || 'unassigned';
        if (!colorGroups[cId]) colorGroups[cId] = { colorCode: v.colorId?.hexCode, colorName: v.colorId?.name, variants: [], images: [] };
        colorGroups[cId].variants.push(v);
    });

    if (currentProductData.images) {
        currentProductData.images.forEach(img => {
            const cId = img.colorId?._id || img.colorId || 'unassigned';
            if (!colorGroups[cId]) {
                 const cObj = allColors.find(c => c._id === cId);
                 colorGroups[cId] = { colorCode: cObj?.hexCode, colorName: cObj?.name, variants: [], images: [] };
            }
            colorGroups[cId].images.push(img);
        });
    }

    let html = '';
    for (const [cId, group] of Object.entries(colorGroups)) {
        if (cId === 'unassigned' && group.variants.length === 0 && group.images.length === 0) continue;
        const cName = group.colorName || 'Chưa gán màu (Hoặc Mặc định)';
        const cHex = group.colorCode || '#cccccc';
        
        group.images.sort((a,b) => (a.order||0) - (b.order||0));
        let imgsHtml = group.images.map(img => `
            <div style="position: relative; width: 70px; height: 70px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); background: var(--bg);">
                <img src="${img.url}" style="width: 100%; height: 100%; object-fit: contain;">
                <button onclick="deleteMatrixImage('${img._id}')" class="btn-icon delete" style="position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; font-size: 0.7rem; padding: 0; background: rgba(255,255,255,0.8);"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join('');

        let varsHtml = group.variants.map(v => `
            <tr>
                <td>${v.size}</td>
                <td>${v.price ? v.price.toLocaleString('vi-VN') + ' ₫' : '—'}</td>
                <td>${v.stock}</td>
                <td style="text-align: right;">
                    <button class="btn-icon edit" onclick='editVariant(${JSON.stringify(v)})' style="width: 26px; height: 26px;"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="deleteVariant('${v._id}')" style="width: 26px; height: 26px;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        if(group.variants.length === 0) {
            varsHtml = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted)">Không có size nào.</td></tr>`;
        }

        html += `
        <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
            <!-- Left: Color & Images -->
            <div style="flex: 1; min-width: 250px; border-right: 1px dashed var(--border); padding-right: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${cHex}; border: 1px solid rgba(0,0,0,0.2);"></div>
                    <strong style="font-size: 1.1rem; color: var(--text);">${cName}</strong>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                    ${imgsHtml}
                    <label style="width: 70px; height: 70px; border-radius: 6px; border: 1px dashed var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); transition: 0.2s; background: var(--bg);">
                        <input type="file" style="display: none;" accept="image/*" onchange="uploadMatrixImage(this, '${cId}')">
                        <i class="fa-solid fa-plus"></i>
                    </label>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">(Tải ảnh cho màu sắc này. Ảnh tự tạo thành bộ sưu tập riêng.)</p>
            </div>

            <!-- Right: Sizes & Batch -->
            <div style="flex: 2; min-width: 300px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="font-size: 0.95rem; color: var(--text); margin: 0;">Danh sách Size</h4>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="number" id="batch-price-${cId}" placeholder="Giá chung..." style="padding: 6px; width: 110px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; background: var(--bg); color: var(--text);">
                        <button class="btn-primary" onclick="batchUpdatePrice('${cId}')" style="padding: 6px 12px; font-size: 0.85rem;">Áp dụng Giá</button>
                    </div>
                </div>
                <div class="table-wrapper" style="max-height: 250px; overflow-y: auto;">
                    <table class="data-table" style="font-size: 0.85rem;">
                        <thead style="position: sticky; top: 0; z-index: 1;">
                            <tr>
                                <th>Size</th><th>Giá</th><th>Kho</th><th style="text-align: right;">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>${varsHtml}</tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }
    container.innerHTML = html;
}

// ----- Quick Batch Generation -----
async function generateSizes(range) {
    const cId = document.getElementById('mat-color-select').value;
    if (!cId) return showToast('Vui lòng chọn màu trước khi tạo lô Size!', 'error');

    let sizes = [];
    if (range === '38-43') sizes = ['38', '39', '40', '41', '42', '43'];
    else if (range === '36-40') sizes = ['36', '37', '38', '39', '40'];
    else if (range === 'S-XL') sizes = ['S', 'M', 'L', 'XL'];

    try {
        const prodPrice = currentProductData ? currentProductData.price : 0;
        const promises = sizes.map(sz => {
             const fd = new FormData();
             fd.append('size', sz);
             fd.append('colorId', cId);
             fd.append('price', prodPrice);
             fd.append('stock', 0);
             return variantApi.add(currentProductIdForVariant, fd);
        });
        await Promise.all(promises);
        showToast(`Tạo thành công các size ${range}!`, 'success');
        fetchVariantMatrix();
    } catch(err) {
        showToast('Lỗi khi tạo lô: ' + err.message, 'error');
    }
}

// ----- Batch Price Update -----
async function batchUpdatePrice(colorId) {
    if(colorId === 'unassigned') return showToast('Không thể áp dụng lô cho màu chưa gán.', 'error');
    const priceStr = document.getElementById(`batch-price-${colorId}`).value;
    if(!priceStr) return showToast('Vui lòng nhập giá cần áp dụng.', 'error');
    const price = parseInt(priceStr);
    
    try {
        await variantApi.batchUpdatePrice(currentProductIdForVariant, colorId, price);
        showToast('Đã áp dụng giá cập nhật!', 'success');
        fetchVariantMatrix();
    } catch(err) {
        showToast(err.message, 'error');
    }
}

// ----- Image Upload -----
async function uploadMatrixImage(input, colorId) {
    const file = input.files[0];
    if(!file) return;
    if(colorId === 'unassigned') return showToast('Màu chưa gán, không thể upload trực tiếp.', 'error');

    const fd = new FormData();
    fd.append('image', file);
    try {
        await productApi.uploadColorImage(currentProductIdForVariant, colorId, fd);
        showToast('Tải ảnh thành công!', 'success');
        fetchVariantMatrix();
    } catch(err) {
        showToast(err.message, 'error');
    }
}

async function deleteMatrixImage(imgId) {
    if(!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
        await productApi.deleteColorImage(currentProductIdForVariant, imgId);
        showToast('Đã xóa ảnh!', 'success');
        fetchVariantMatrix();
    } catch(err) {
        showToast(err.message, 'error');
    }
}

// ----- Manual Standard Form -----
function editVariant(v) {
    currentEditVariantId = v._id;
    document.getElementById('form-variant-size').value = v.size || '';
    document.getElementById('form-variant-color').value = v.colorId?._id || v.colorId || '';
    document.getElementById('form-variant-price').value = v.price || 0;
    document.getElementById('form-variant-stock').value = v.stock || 0;
    document.getElementById('btn-submit-variant').innerText = 'Cập nhật';
}

function resetVariantForm() {
    currentEditVariantId = null;
    document.getElementById('variant-form').reset();
    document.getElementById('form-variant-id').value = '';
    document.getElementById('btn-submit-variant').innerText = 'Thêm';
}

async function submitVariantForm(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-variant');
    btn.disabled = true;
    
    try {
        const cId = document.getElementById('form-variant-color').value;
        if(!cId) throw new Error('Vui lòng chọn màu.');

        const fd = new FormData();
        fd.append('size', document.getElementById('form-variant-size').value);
        fd.append('colorId', cId);
        fd.append('price', document.getElementById('form-variant-price').value || 0);
        fd.append('stock', document.getElementById('form-variant-stock').value || 0);
        
        if (currentEditVariantId) {
            await variantApi.update(currentEditVariantId, fd);
            showToast('Cập nhật biến thể thành công!', 'success');
        } else {
            await variantApi.add(currentProductIdForVariant, fd);
            showToast('Thêm biến thể thành công!', 'success');
        }
        
        resetVariantForm();
        await fetchVariantMatrix();
    } catch(err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function deleteVariant(id) {
    if (!confirm('Bạn có chắc muốn xóa size này?')) return;
    try {
        await variantApi.delete(id);
        showToast('Xóa thành công', 'success');
        await fetchVariantMatrix();
    } catch(err) {
        showToast(err.message, 'error');
    }
}
// ===== QUICK COLOR CREATE =====
async function promptCreateColor() {
    const colorName = prompt('Nhập tên màu mới (VD: Đen, Trắng):');
    if(!colorName) return;
    const hexCode = prompt('Nhập mã màu HEX nếu có (VD: #000000), hoặc để trống:');
    try {
        await colorApi.create({ name: colorName.trim(), hexCode: (hexCode || '#cccccc').trim() });
        showToast('Đã thêm màu mới!', 'success');
        await loadColors();
    } catch(err) {
         showToast(err.message, 'error');
    }
}

// ===== INIT =====
loadColors().then(() => loadCategories()).then(() => loadProducts(1));
