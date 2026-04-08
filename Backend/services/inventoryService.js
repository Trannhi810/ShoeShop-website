const Product = require('../schemas/productSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Category = require('../schemas/categorySchema');
const InventoryLog = require('../schemas/inventoryLogSchema');
const { AppError } = require('../utils/appError');
const {
    normalizeText,
    matchesSearch,
    buildStockRows,
    applyStockStateFilter,
    mapInventoryLog
} = require('../utils/inventoryUtils');

async function getPreparedInventoryData() {
    const [products, variants, categories] = await Promise.all([
        Product.find({}).sort({ createdAt: -1 }).lean(),
        ProductVariant.find({}).populate('colorId').sort({ createdAt: -1 }).lean(),
        Category.find({}).lean()
    ]);

    const categoryMap = new Map(categories.map((cat) => [String(cat._id), cat]));
    const variantsByProduct = new Map();
    for (const variant of variants) {
        const key = String(variant.productId);
        if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
        variantsByProduct.get(key).push(variant);
    }
    return { products, variantsByProduct, categoryMap };
}

const getOverview = async () => {
    const { products, variantsByProduct, categoryMap } = await getPreparedInventoryData();
    const rows = buildStockRows(products, variantsByProduct, categoryMap);

    const totalUnits = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    const lowStockCount = rows.filter((row) => row.stock > 0 && row.stock <= 5).length;
    const outOfStockCount = rows.filter((row) => row.stock <= 0).length;

    const latestLogs = await InventoryLog.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('productId', 'name')
        .populate({ path: 'variantId', populate: { path: 'colorId', select: 'name hexCode' } });

    return {
        stats: {
            totalItems: rows.length,
            totalUnits,
            lowStockCount,
            outOfStockCount,
            totalProducts: products.length,
            totalVariants: rows.filter((row) => row.itemType === 'variant').length
        },
        latestLogs: latestLogs.map((log) => ({
            _id: log._id,
            type: log.type,
            quantity: log.quantity,
            beforeStock: log.beforeStock,
            afterStock: log.afterStock,
            referenceId: log.referenceId || '',
            note: log.note || '',
            productName: log.productId?.name || 'Sản phẩm không xác định',
            variantLabel: log.variantId ? (
                (log.variantId.colorId?.name && log.variantId.size)
                ? `${log.variantId.colorId.name} / ${log.variantId.size}`
                : (log.variantId.colorId?.name || log.variantId.size || 'Mặc định')
            ) : 'Kho sản phẩm chính',
            createdAt: log.createdAt
        }))
    };
};

const getItems = async (query) => {
    const { search = '', category = '', stockState = '', status = '', page = 1, limit = 10 } = query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
    const { products, variantsByProduct, categoryMap } = await getPreparedInventoryData();

    const filteredProducts = products.filter((product) => {
        if (category && String(product.categoryId || '') !== String(category)) return false;
        if (status === 'active' && !product.isActive) return false;
        if (status === 'inactive' && product.isActive) return false;
        const variants = variantsByProduct.get(String(product._id)) || [];
        return matchesSearch(product, categoryMap, variants, search);
    });

    let rows = buildStockRows(filteredProducts, variantsByProduct, categoryMap);
    rows = applyStockStateFilter(rows, stockState);
    rows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    const total = rows.length;
    const items = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return { items, total, page: currentPage, limit: pageSize };
};

const getLogs = async (queryParams) => {
    const { search = '', type = '', page = 1, limit = 8 } = queryParams;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 8, 1);

    const query = {};
    if (type) query.type = type;

    const logs = await InventoryLog.find(query)
        .sort({ createdAt: -1 })
        .populate('productId', 'name')
        .populate({ path: 'variantId', populate: { path: 'colorId', select: 'name hexCode' } })
        .lean();

    let filtered = logs;
    if (search) {
        const needle = normalizeText(search);
        filtered = logs.filter((log) => {
            const texts = [
                log.productId?.name,
                log.referenceId,
                log.note,
                log.variantId?.size,
                log.variantId?.color,
                log.type
            ].map(normalizeText);
            return texts.some((text) => text.includes(needle));
        });
    }

    const total = filtered.length;
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(mapInventoryLog);
    return { logs: paged, total, page: currentPage, limit: pageSize };
};

const adjustInventoryStock = async ({ productId, variantId, actionType, quantity, note = '', referenceId = '' }, changedBy) => {
    if (!productId) {
        throw new AppError('Thiếu productId', 400);
    }
    if (!['IMPORT', 'EXPORT', 'ADJUST'].includes(actionType)) {
        throw new AppError('Loại thao tác kho không hợp lệ', 400);
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
        throw new AppError('Số lượng không hợp lệ', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Không tìm thấy sản phẩm', 404);
    }

    let targetDoc = product;
    let beforeStock = Number(product.stock || 0);
    let afterStock = beforeStock;
    let actualVariantId = null;

    if (variantId) {
        const variant = await ProductVariant.findOne({ _id: variantId, productId });
        if (!variant) {
            throw new AppError('Không tìm thấy biến thể sản phẩm', 404);
        }
        targetDoc = variant;
        beforeStock = Number(variant.stock || 0);
        actualVariantId = variant._id;
    }

    if (actionType === 'IMPORT') {
        afterStock = beforeStock + parsedQuantity;
    } else if (actionType === 'EXPORT') {
        if (parsedQuantity > beforeStock) {
            throw new AppError('Số lượng xuất vượt quá tồn kho hiện tại', 400);
        }
        afterStock = beforeStock - parsedQuantity;
    } else {
        afterStock = parsedQuantity;
    }

    targetDoc.stock = afterStock;
    await targetDoc.save();

    if (actualVariantId) {
        const allVariants = await ProductVariant.find({ productId: product._id });
        product.stock = allVariants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
        await product.save();
    }

    const logQuantity = actionType === 'ADJUST' ? Math.abs(afterStock - beforeStock) : parsedQuantity;
    const createdLog = await InventoryLog.create({
        productId: product._id,
        variantId: actualVariantId,
        type: actionType,
        quantity: logQuantity,
        beforeStock,
        afterStock,
        referenceId,
        note,
        changedBy: changedBy || null
    });

    return {
        message: 'Cập nhật tồn kho thành công',
        item: {
            productId: String(product._id),
            variantId: actualVariantId ? String(actualVariantId) : '',
            stock: afterStock,
            productStock: Number(product.stock || 0)
        },
        log: createdLog
    };
};

module.exports = { getOverview, getItems, getLogs, adjustInventoryStock };
