function normalizeText(value = '') {
    return String(value || '').trim().toLowerCase();
}

function matchesSearch(product, categoryMap, variants, search) {
    if (!search) return true;
    const needle = normalizeText(search);
    const categoryName = normalizeText(categoryMap.get(String(product.categoryId))?.name || '');
    const texts = [
        product.name,
        product.description,
        categoryName,
        ...(variants || []).flatMap((v) => [v.size, v.color])
    ].map(normalizeText);
    return texts.some((text) => text.includes(needle));
}

function buildStockRows(products, variantsByProduct, categoryMap) {
    const rows = [];
    for (const product of products) {
        const variants = variantsByProduct.get(String(product._id)) || [];
        const category = categoryMap.get(String(product.categoryId));

        if (variants.length > 0) {
            for (const variant of variants) {
                rows.push({
                    rowId: `${product._id}_${variant._id}`,
                    itemType: 'variant',
                    productId: String(product._id),
                    variantId: String(variant._id),
                    productName: product.name,
                    productDescription: product.description || '',
                    categoryId: product.categoryId ? String(product.categoryId) : '',
                    categoryName: category?.name || 'Chưa phân loại',
                    imageUrl: product.images?.[0]?.url || '',
                    price: Number(variant.price ?? product.price ?? 0),
                    stock: Number(variant.stock ?? 0),
                    isActive: !!product.isActive,
                    createdAt: variant.createdAt || product.createdAt,
                    updatedAt: variant.updatedAt || product.updatedAt,
                    label: `${product.name} - ${variant.color || 'Màu chuẩn'} / ${variant.size || 'Size chuẩn'}`,
                    variantLabel: `${variant.color || 'Màu chuẩn'} / ${variant.size || 'Size chuẩn'}`,
                    sku: `VAR-${String(variant._id).slice(-6).toUpperCase()}`
                });
            }
        } else {
            rows.push({
                rowId: `${product._id}_base`,
                itemType: 'product',
                productId: String(product._id),
                variantId: '',
                productName: product.name,
                productDescription: product.description || '',
                categoryId: product.categoryId ? String(product.categoryId) : '',
                categoryName: category?.name || 'Chưa phân loại',
                imageUrl: product.images?.[0]?.url || '',
                price: Number(product.price ?? 0),
                stock: Number(product.stock ?? 0),
                isActive: !!product.isActive,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                label: product.name,
                variantLabel: 'Kho sản phẩm chính',
                sku: `PRO-${String(product._id).slice(-6).toUpperCase()}`
            });
        }
    }
    return rows;
}

function applyStockStateFilter(rows, stockState) {
    if (!stockState) return rows;
    switch (stockState) {
        case 'out':
            return rows.filter((row) => row.stock <= 0);
        case 'low':
            return rows.filter((row) => row.stock > 0 && row.stock <= 5);
        case 'instock':
            return rows.filter((row) => row.stock > 5);
        case 'variant':
            return rows.filter((row) => row.itemType === 'variant');
        case 'product':
            return rows.filter((row) => row.itemType === 'product');
        default:
            return rows;
    }
}

function mapInventoryLog(log) {
    return {
        _id: log._id,
        type: log.type,
        quantity: log.quantity,
        beforeStock: log.beforeStock,
        afterStock: log.afterStock,
        referenceId: log.referenceId || '',
        note: log.note || '',
        productId: log.productId?._id || null,
        productName: log.productId?.name || 'Sản phẩm không xác định',
        variantId: log.variantId?._id || null,
        variantLabel: log.variantId ? `${log.variantId.color || 'Màu chuẩn'} / ${log.variantId.size || 'Size chuẩn'}` : 'Kho sản phẩm chính',
        createdAt: log.createdAt
    };
}

module.exports = {
    normalizeText,
    matchesSearch,
    buildStockRows,
    applyStockStateFilter,
    mapInventoryLog
};
