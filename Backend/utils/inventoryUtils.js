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
        ...(variants || []).flatMap((v) => [v.size, v.colorId?.name])
    ].map(normalizeText);
    return texts.some((text) => text.includes(needle));
}

function buildStockRows(products, variantsByProduct, categoryMap) {
    const rows = [];
    for (const product of products) {
        const variants = variantsByProduct.get(String(product._id)) || [];
        const category = categoryMap.get(String(product.categoryId));

        if (variants.length > 0) {
            // Check if it's just one default variant
            const isSingleDefault = variants.length === 1 && 
                                   variants[0].size === 'Mặc định' && 
                                   !variants[0].colorId;

            for (const variant of variants) {
                const variantColorObj = variant.colorId;
                const colorIdValue = (variantColorObj?._id || variantColorObj || '').toString();
                const colorName = variantColorObj?.name;
                const variantSize = variant.size;
                
                // Find images that match this variant's color
                const colorImages = (product.images || []).filter(img => {
                    const imgColorId = (img.colorId?._id || img.colorId || '').toString();
                    return imgColorId && colorIdValue && imgColorId === colorIdValue;
                });
                
                let variantImage = null;
                if (colorImages.length > 0) {
                    colorImages.sort((a, b) => (a.order || 0) - (b.order || 0));
                    variantImage = colorImages[0].url;
                }
                
                let variantLabel = '';
                if (isSingleDefault) {
                    variantLabel = 'Kho sản phẩm chính';
                } else {
                    if (colorName && variantSize) {
                        variantLabel = `${colorName} / ${variantSize}`;
                    } else if (colorName) {
                        variantLabel = colorName;
                    } else if (variantSize) {
                        variantLabel = variantSize === 'Mặc định' ? 'Mặc định' : `Size: ${variantSize}`;
                    } else {
                        variantLabel = (variantColorObj ? 'Màu mặc định' : '') + (variantSize ? (variantColorObj ? ' / ' : '') + `Size: ${variantSize}` : 'Mặc định');
                    }
                }

                rows.push({
                    rowId: `${product._id}_${variant._id}`,
                    itemType: isSingleDefault ? 'product' : 'variant',
                    productId: String(product._id),
                    variantId: String(variant._id),
                    productName: product.name,
                    productDescription: product.description || '',
                    categoryId: product.categoryId ? String(product.categoryId) : '',
                    categoryName: category?.name || 'Chưa phân loại',
                    imageUrl: variantImage || variant.image || (product.images && product.images.length > 0 ? product.images[0].url : ''),
                    price: Number(variant.price ?? product.price ?? 0),
                    stock: Number(variant.stock ?? 0),
                    isActive: !!product.isActive,
                    createdAt: variant.createdAt || product.createdAt,
                    updatedAt: variant.updatedAt || product.updatedAt,
                    label: `${product.name} - ${variantLabel}`,
                    variantLabel: variantLabel,
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
        variantLabel: log.variantId ? (
            (log.variantId.colorId?.name && log.variantId.size) 
            ? `${log.variantId.colorId.name} / ${log.variantId.size}`
            : (log.variantId.colorId?.name || log.variantId.size || 'Mặc định')
        ) : 'Kho sản phẩm chính',
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
