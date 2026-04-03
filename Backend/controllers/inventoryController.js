const Product = require('../schemas/productSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const Category = require('../schemas/categorySchema');
const InventoryLog = require('../schemas/inventoryLogSchema');

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
    ...(variants || []).flatMap(v => [v.size, v.color])
  ].map(normalizeText);
  return texts.some(text => text.includes(needle));
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

async function getPreparedInventoryData() {
  const [products, variants, categories] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).lean(),
    ProductVariant.find({}).sort({ createdAt: -1 }).lean(),
    Category.find({}).lean()
  ]);

  const categoryMap = new Map(categories.map(cat => [String(cat._id), cat]));
  const variantsByProduct = new Map();
  for (const variant of variants) {
    const key = String(variant.productId);
    if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
    variantsByProduct.get(key).push(variant);
  }

  return { products, variantsByProduct, categoryMap };
}

function applyStockStateFilter(rows, stockState) {
  if (!stockState) return rows;
  switch (stockState) {
    case 'out':
      return rows.filter(row => row.stock <= 0);
    case 'low':
      return rows.filter(row => row.stock > 0 && row.stock <= 5);
    case 'instock':
      return rows.filter(row => row.stock > 5);
    case 'variant':
      return rows.filter(row => row.itemType === 'variant');
    case 'product':
      return rows.filter(row => row.itemType === 'product');
    default:
      return rows;
  }
}

const getInventoryOverview = async (req, res) => {
  try {
    const { products, variantsByProduct, categoryMap } = await getPreparedInventoryData();
    const rows = buildStockRows(products, variantsByProduct, categoryMap);

    const totalUnits = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    const lowStockCount = rows.filter(row => row.stock > 0 && row.stock <= 5).length;
    const outOfStockCount = rows.filter(row => row.stock <= 0).length;

    const latestLogs = await InventoryLog.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('productId', 'name')
      .populate('variantId', 'size color');

    res.status(200).json({
      stats: {
        totalItems: rows.length,
        totalUnits,
        lowStockCount,
        outOfStockCount,
        totalProducts: products.length,
        totalVariants: rows.filter(row => row.itemType === 'variant').length
      },
      latestLogs: latestLogs.map(log => ({
        _id: log._id,
        type: log.type,
        quantity: log.quantity,
        beforeStock: log.beforeStock,
        afterStock: log.afterStock,
        referenceId: log.referenceId || '',
        note: log.note || '',
        productName: log.productId?.name || 'Sản phẩm không xác định',
        variantLabel: log.variantId ? `${log.variantId.color || 'Màu chuẩn'} / ${log.variantId.size || 'Size chuẩn'}` : 'Kho sản phẩm chính',
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInventoryItems = async (req, res) => {
  try {
    const { search = '', category = '', stockState = '', status = '', page = 1, limit = 10 } = req.query;
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.max(parseInt(limit) || 10, 1);

    const { products, variantsByProduct, categoryMap } = await getPreparedInventoryData();
    let filteredProducts = products.filter(product => {
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
    const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    res.status(200).json({
      items: pagedRows,
      total,
      page: currentPage,
      limit: pageSize
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const { search = '', type = '', page = 1, limit = 8 } = req.query;
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.max(parseInt(limit) || 8, 1);

    const query = {};
    if (type) query.type = type;

    const logs = await InventoryLog.find(query)
      .sort({ createdAt: -1 })
      .populate('productId', 'name')
      .populate('variantId', 'size color')
      .lean();

    let filtered = logs;
    if (search) {
      const needle = normalizeText(search);
      filtered = logs.filter(log => {
        const texts = [
          log.productId?.name,
          log.referenceId,
          log.note,
          log.variantId?.size,
          log.variantId?.color,
          log.type
        ].map(normalizeText);
        return texts.some(text => text.includes(needle));
      });
    }

    const total = filtered.length;
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(log => ({
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
    }));

    res.status(200).json({ logs: paged, total, page: currentPage, limit: pageSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustInventory = async (req, res) => {
  try {
    const { productId, variantId, actionType, quantity, note = '', referenceId = '' } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Thiếu productId' });
    }
    if (!['IMPORT', 'EXPORT', 'ADJUST'].includes(actionType)) {
      return res.status(400).json({ message: 'Loại thao tác kho không hợp lệ' });
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    let targetDoc = product;
    let beforeStock = Number(product.stock || 0);
    let afterStock = beforeStock;
    let actualVariantId = null;

    if (variantId) {
      const variant = await ProductVariant.findOne({ _id: variantId, productId });
      if (!variant) {
        return res.status(404).json({ message: 'Không tìm thấy biến thể sản phẩm' });
      }
      targetDoc = variant;
      beforeStock = Number(variant.stock || 0);
      actualVariantId = variant._id;
    }

    if (actionType === 'IMPORT') {
      afterStock = beforeStock + parsedQuantity;
    } else if (actionType === 'EXPORT') {
      if (parsedQuantity > beforeStock) {
        return res.status(400).json({ message: 'Số lượng xuất vượt quá tồn kho hiện tại' });
      }
      afterStock = beforeStock - parsedQuantity;
    } else if (actionType === 'ADJUST') {
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
      changedBy: req.user?.id || null
    });

    res.status(200).json({
      message: 'Cập nhật tồn kho thành công',
      item: {
        productId: String(product._id),
        variantId: actualVariantId ? String(actualVariantId) : '',
        stock: afterStock,
        productStock: Number(product.stock || 0)
      },
      log: createdLog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventoryOverview,
  getInventoryItems,
  getInventoryLogs,
  adjustInventory
};
