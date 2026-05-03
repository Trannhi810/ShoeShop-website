const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');
const { AppError } = require('../utils/appError');

const getVariants = async (productId, { page = 1, limit = 10 }) => {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const query = { productId };
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await ProductVariant.countDocuments(query);
    const variants = await ProductVariant.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('colorId');
    return { variants, total, page: parsedPage, limit: parsedLimit };
};

const addVariant = async (productId, { size, colorId, price }, file) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    let image = '';
    if (file) image = `/uploads/${file.filename}`;

    return ProductVariant.create({
        productId,
        size,
        colorId,
        price: price || product.price,
        stock: 0,
        image
    });
};

const updateVariant = async (variantId, { size, colorId, price }, file) => {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw new AppError('Không tìm thấy biến thể', 404);

    if (size !== undefined) variant.size = size;
    if (colorId !== undefined) variant.colorId = colorId;
    if (price !== undefined) variant.price = price;
    if (file) variant.image = `/uploads/${file.filename}`;
    await variant.save();
    return variant;
};

const deleteVariant = async (variantId) => {
    const variant = await ProductVariant.findByIdAndDelete(variantId);
    if (!variant) throw new AppError('Không tìm thấy biến thể', 404);
    return { message: 'Xóa biến thể thành công' };
};

const batchUpdateVariantPrice = async (productId, { colorId, price }) => {
    if (!colorId || price === undefined) {
        throw new AppError('Thiếu colorId hoặc price.', 400);
    }
    await ProductVariant.updateMany(
        { productId, colorId },
        { $set: { price } }
    );
    return { message: 'Cập nhật giá hàng loạt thành công.' };
};

module.exports = {
    getVariants,
    addVariant,
    updateVariant,
    deleteVariant,
    batchUpdateVariantPrice
};
