const Product = require('../schemas/productSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const { AppError } = require('../utils/appError');
const { parseImages, parseVariants } = require('../utils/productPayloadUtils');

const attachVariantsToProducts = async (products) => {
    for (const product of products) {
        product.variants = await ProductVariant.find({ productId: product._id });
    }
    return products;
};

const getAllProducts = async (query) => {
    const { search, status, category, page, limit } = query;
    const dbQuery = {};

    if (search) {
        dbQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (status === 'active') dbQuery.isActive = true;
    if (status === 'inactive') dbQuery.isActive = false;
    if (category) dbQuery.categoryId = category;

    let products;
    let total = 0;

    if (page && limit) {
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);
        const skip = (parsedPage - 1) * parsedLimit;
        total = await Product.countDocuments(dbQuery);
        products = await Product.find(dbQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean();
        await attachVariantsToProducts(products);
        return { products, total, page: parsedPage, limit: parsedLimit };
    }

    products = await Product.find(dbQuery).sort({ createdAt: -1 }).lean();
    await attachVariantsToProducts(products);
    return products;
};

const getProductById = async (id) => {
    const product = await Product.findById(id).lean();
    if (!product) {
        throw new AppError('Không tìm thấy sản phẩm', 404);
    }
    product.variants = await ProductVariant.find({ productId: product._id });
    return product;
};

const createProduct = async (body, files) => {
    const { name, description, price, stock, isActive, categoryId } = body;
    if (!name) throw new AppError('Tên sản phẩm là bắt buộc', 400);

    const images = parseImages(files, body.images) || [];
    const variants = parseVariants(body.variants);

    const product = await Product.create({
        name,
        description,
        price,
        stock,
        isActive,
        categoryId,
        images
    });

    if (Array.isArray(variants) && variants.length > 0) {
        const variantsToCreate = variants.map((v) => ({
            productId: product._id,
            size: v.size,
            color: v.color,
            price: v.price || price || 0,
            stock: v.stock || 0
        }));
        await ProductVariant.insertMany(variantsToCreate);
    }

    return product;
};

const updateProduct = async (id, body, files) => {
    const { name, description, price, stock, isActive, categoryId } = body;
    const product = await Product.findById(id);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;
    if (categoryId !== undefined) product.categoryId = categoryId;

    const parsedImages = parseImages(files, body.images);
    if (parsedImages !== undefined) product.images = parsedImages;
    await product.save();

    const variants = parseVariants(body.variants);
    if (variants !== undefined) {
        await ProductVariant.deleteMany({ productId: product._id });
        if (Array.isArray(variants) && variants.length > 0) {
            const variantsToCreate = variants.map((v) => ({
                productId: product._id,
                size: v.size,
                color: v.color,
                price: v.price || product.price,
                stock: v.stock || 0
            }));
            await ProductVariant.insertMany(variantsToCreate);
        }
    }

    return product;
};

const deleteProduct = async (id) => {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
    return { message: 'Xóa sản phẩm thành công' };
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
