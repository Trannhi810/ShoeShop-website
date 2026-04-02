// ===== ADMIN INVENTORY =====
// Yêu cầu: admin-utils.js, api-client.js được load trước

const currentUser = initAdminPage();

const inventoryState = {
    page: 1,
    limit: 10,
    searchTimer: null,
    logPage: 1,
    logLimit: 6,
    logTimer: null,
    currentItem: null
};

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getStockBadge(stock) {
    const currentStock = Number(stock || 0);
    if (currentStock <= 0) return '<span class="badge badge-stock-out"><i class="fa-solid fa-circle"></i> Hết hàng</span>';
    if (currentStock <= 5) return '<span class="badge badge-stock-low"><i class="fa-solid fa-circle"></i> Sắp hết</span>';
    return '<span class="badge badge-stock-ok"><i class="fa-solid fa-circle"></i> Ổn định</span>';
}

function getItemTypeBadge(itemType) {
    return itemType === 'variant'
        ? '<span class="badge badge-variant"><i class="fa-solid fa-layer-group"></i> Biến thể</span>'
        : '<span class="badge badge-product"><i class="fa-solid fa-box"></i> Sản phẩm chính</span>';
}

function getLogTypeMeta(type) {
    if (type === 'IMPORT') return { label: 'Nhập kho', icon: 'fa-arrow-down', className: 'import' };
    if (type === 'EXPORT') return { label: 'Xuất kho', icon: 'fa-arrow-up', className: 'export' };
    return { label: 'Kiểm kê / điều chỉnh', icon: 'fa-pen-ruler', className: 'adjust' };
}

function toggleTableLoading(on) {
    document.getElementById('table-loading').classList.toggle('show', !!on);
}

async function loadCategories() {
    try {
        const categories = await categoryApi.getAll();
        const select = document.getElementById('filter-category');
        select.innerHTML = '<option value="">Tất cả danh mục</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat._id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadOverview() {
    try {
        const overview = await inventoryApi.overview();
        document.getElementById('stat-total-items').textContent = overview.stats.totalItems ?? 0;
        document.getElementById('stat-total-units').textContent = overview.stats.totalUnits ?? 0;
        document.getElementById('stat-low-stock').textContent = overview.stats.lowStockCount ?? 0;
        document.getElementById('stat-out-stock').textContent = overview.stats.outOfStockCount ?? 0;
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function buildInventoryQuery(page = inventoryState.page) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', inventoryState.limit);

    const search = document.getElementById('search-input').value.trim();
    const category = document.getElementById('filter-category').value;
    const stockState = document.getElementById('filter-stock-state').value;
    const status = document.getElementById('filter-status').value;

    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (stockState) params.set('stockState', stockState);
    if (status) params.set('status', status);

    return params.toString();
}

function buildLogQuery(page = inventoryState.logPage) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', inventoryState.logLimit);

    const type = document.getElementById('filter-log-type').value;
    const search = document.getElementById('log-search-input').value.trim();

    if (type) params.set('type', type);
    if (search) params.set('search', search);

    return params.toString();
}

async function loadInventoryItems(page = inventoryState.page) {
    inventoryState.page = page;
    toggleTableLoading(true);
    try {
        const result = await inventoryApi.getItems(buildInventoryQuery(page));
        renderInventoryRows(result.items || []);
        renderPagination('inventory-pagination', result.total || 0, result.page || 1, result.limit || inventoryState.limit, loadInventoryItems);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        toggleTableLoading(false);
    }
}

function encodeForAttribute(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function openStockModalFromEncoded(actionType, encodedItem) {
    const item = JSON.parse(decodeURIComponent(encodedItem));
    openStockModal({ actionType, item });
}

function renderInventoryRows(items) {
    const tbody = document.getElementById('inventory-tbody');
    const table = document.getElementById('inventory-table');
    const emptyState = document.getElementById('empty-state');

    tbody.innerHTML = '';
    if (!items || items.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        const displayIndex = ((inventoryState.page - 1) * inventoryState.limit) + index + 1;
        const encodedItem = encodeForAttribute(encodeURIComponent(JSON.stringify(item)));
        const imageHtml = item.imageUrl
            ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.productName)}" class="product-img-mini">`
            : `<div class="product-icon"><i class="fa-solid fa-boxes-stacked"></i></div>`;

        tr.innerHTML = `
            <td class="td-num">${displayIndex}</td>
            <td>
                <div class="product-cell">
                    ${imageHtml}
                    <div>
                        <p class="product-name">${escapeHtml(item.productName)}</p>
                        <p class="product-desc">${escapeHtml(item.productDescription || 'Chưa có mô tả')}</p>
                        <div class="inventory-item-sub">
                            <span>${escapeHtml(item.variantLabel)}</span>
                            <span>${item.isActive ? 'Đang bán' : 'Ngừng bán'}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(item.categoryName || 'Chưa phân loại')}</td>
            <td>
                <div class="inventory-item-sub">
                    <span>${escapeHtml(item.sku || '—')}</span>
                    ${getItemTypeBadge(item.itemType)}
                </div>
            </td>
            <td class="td-price">${formatCurrency(item.price)}</td>
            <td>
                <div class="stock-value">
                    <strong>${Number(item.stock || 0)}</strong>
                    ${getStockBadge(item.stock)}
                </div>
            </td>
            <td class="td-date">${formatDateTime(item.updatedAt)}</td>
            <td>
                <div class="inventory-action-group">
                    <button class="btn-mini-action import" onclick="openStockModalFromEncoded('IMPORT', '${encodedItem}')">
                        <i class="fa-solid fa-arrow-down"></i> Nhập
                    </button>
                    <button class="btn-mini-action export" onclick="openStockModalFromEncoded('EXPORT', '${encodedItem}')">
                        <i class="fa-solid fa-arrow-up"></i> Xuất
                    </button>
                    <button class="btn-mini-action adjust" onclick="openStockModalFromEncoded('ADJUST', '${encodedItem}')">
                        <i class="fa-solid fa-pen-ruler"></i> Kiểm kê
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadInventoryLogs(page = inventoryState.logPage) {
    inventoryState.logPage = page;
    try {
        const result = await inventoryApi.getLogs(buildLogQuery(page));
        renderInventoryLogs(result.logs || []);
        renderPagination('history-pagination', result.total || 0, result.page || 1, result.limit || inventoryState.logLimit, loadInventoryLogs);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function renderInventoryLogs(logs) {
    const list = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    list.innerHTML = '';

    if (!logs || logs.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    logs.forEach(log => {
        const meta = getLogTypeMeta(log.type);
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-icon ${meta.className}">
                <i class="fa-solid ${meta.icon}"></i>
            </div>
            <div>
                <p class="history-title">${meta.label} · ${escapeHtml(log.productName)}</p>
                <p class="history-meta">${escapeHtml(log.variantLabel || 'Kho sản phẩm chính')} · Tồn ${log.beforeStock} → ${log.afterStock}</p>
                <p class="history-note">${escapeHtml(log.note || 'Không có ghi chú')} ${log.referenceId ? `· Mã phiếu: ${escapeHtml(log.referenceId)}` : ''}</p>
            </div>
            <div class="history-summary">
                <strong>${(Number(log.afterStock || 0) - Number(log.beforeStock || 0)) >= 0 ? '+' : ''}${Number(log.afterStock || 0) - Number(log.beforeStock || 0)}</strong>
                <span class="text-muted">${formatDateTime(log.createdAt)}</span>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderPagination(containerId, total, page, limit, callback) {
    const container = document.getElementById(containerId);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    container.innerHTML = `
        <div class="pag-info">Hiển thị trang ${page}/${totalPages} · Tổng ${total} bản ghi</div>
        <div class="pag-btns"></div>
    `;

    const btnWrap = container.querySelector('.pag-btns');
    const addBtn = (label, targetPage, disabled = false, active = false) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = disabled;
        if (active) btn.classList.add('active');
        btn.onclick = () => callback(targetPage);
        btnWrap.appendChild(btn);
    };

    addBtn('«', Math.max(1, page - 1), page <= 1);

    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    for (let i = start; i <= end; i += 1) {
        addBtn(String(i), i, false, i === page);
    }

    addBtn('»', Math.min(totalPages, page + 1), page >= totalPages);
}

function debounceSearch() {
    clearTimeout(inventoryState.searchTimer);
    inventoryState.searchTimer = setTimeout(() => loadInventoryItems(1), 350);
}

function debounceLogSearch() {
    clearTimeout(inventoryState.logTimer);
    inventoryState.logTimer = setTimeout(() => loadInventoryLogs(1), 350);
}

function openQuickGuide() {
    openModal('modal-guide');
}

function syncStockActionHint() {
    const actionType = document.getElementById('stock-action-type').value;
    const hint = document.getElementById('stock-action-hint');
    const label = document.getElementById('stock-quantity-label');
    const quantityInput = document.getElementById('stock-quantity');
    const currentValue = Number(document.getElementById('stock-current-value').value || 0);

    if (actionType === 'IMPORT') {
        hint.textContent = 'Nhập thêm số lượng mới vào kho.';
        label.textContent = 'Số lượng nhập thêm';
        quantityInput.placeholder = 'Ví dụ: 10';
    } else if (actionType === 'EXPORT') {
        hint.textContent = 'Xuất bớt số lượng tồn hiện tại khỏi kho.';
        label.textContent = 'Số lượng xuất kho';
        quantityInput.placeholder = 'Ví dụ: 3';
    } else {
        hint.textContent = 'Đặt lại số tồn thực tế sau khi kiểm kê.';
        label.textContent = 'Tồn kho sau kiểm kê';
        quantityInput.placeholder = 'Ví dụ: 15';
        if (!quantityInput.value) quantityInput.value = currentValue;
    }

    updatePreview();
}

function openStockModal(payload) {
    const { actionType, item } = payload;
    inventoryState.currentItem = item;
    document.getElementById('stock-product-id').value = item.productId;
    document.getElementById('stock-variant-id').value = item.variantId || '';
    document.getElementById('stock-current-value').value = Number(item.stock || 0);
    document.getElementById('stock-modal-item-name').textContent = item.productName;
    document.getElementById('stock-modal-item-sub').textContent = `${item.variantLabel} · ${item.categoryName || 'Chưa phân loại'}`;
    document.getElementById('stock-modal-current').textContent = Number(item.stock || 0);
    document.getElementById('stock-modal-sku').textContent = `SKU: ${item.sku || '—'}`;
    document.getElementById('stock-action-type').value = actionType;
    document.getElementById('stock-reference').value = '';
    document.getElementById('stock-note').value = '';
    document.getElementById('stock-quantity').value = '';
    syncStockActionHint();
    openModal('modal-stock');
}

function updatePreview() {
    const current = Number(document.getElementById('stock-current-value').value || 0);
    const actionType = document.getElementById('stock-action-type').value;
    const quantity = Number(document.getElementById('stock-quantity').value || 0);
    let after = current;

    if (actionType === 'IMPORT') after = current + quantity;
    else if (actionType === 'EXPORT') after = Math.max(0, current - quantity);
    else after = quantity;

    document.getElementById('preview-before').textContent = current;
    document.getElementById('preview-after').textContent = after;
}

async function submitStockAdjustment(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-stock');
    setButtonLoading(btn, true);

    const actionType = document.getElementById('stock-action-type').value;
    const quantity = Number(document.getElementById('stock-quantity').value || 0);

    try {
        await inventoryApi.adjust({
            productId: document.getElementById('stock-product-id').value,
            variantId: document.getElementById('stock-variant-id').value,
            actionType,
            quantity,
            referenceId: document.getElementById('stock-reference').value.trim(),
            note: document.getElementById('stock-note').value.trim()
        });
        closeModal('modal-stock');
        showToast('Cập nhật kho thành công!', 'success');
        await refreshAll();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function refreshAll() {
    await Promise.all([loadOverview(), loadInventoryItems(1), loadInventoryLogs(1)]);
}

document.getElementById('stock-quantity').addEventListener('input', updatePreview);
document.getElementById('stock-action-type').addEventListener('change', updatePreview);

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await refreshAll();
});
