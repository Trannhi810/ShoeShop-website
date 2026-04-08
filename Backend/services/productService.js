const Product = require('../schemas/productSchema');
const ProductVariant = require('../schemas/productVariantSchema');
const { AppError } = require('../utils/appError');
const { parseImages, parseVariants } = require('../utils/productPayloadUtils');

const attachVariantsToProducts = async (products) => {
    for (const product of products) {
        product.variants = await ProductVariant.find({ productId: product._id }).populate('colorId');
        // Total stock is sum of all variant stocks
        product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
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
    const product = await Product.findById(id).populate('images.colorId').lean();
    if (!product) {
        throw new AppError('Không tìm thấy sản phẩm', 404);
    }
    product.variants = await ProductVariant.find({ productId: product._id }).populate('colorId');
    // Total stock is sum of all variant stocks
    product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    return product;
};

const createProduct = async (body, files) => {
    const { name, description, price, isActive, categoryId, sizes } = body;
    if (!name) throw new AppError('Tên sản phẩm là bắt buộc', 400);

    const images = parseImages(files, body.images) || [];
    const variants = parseVariants(body.variants);

    const product = await Product.create({
        name,
        description,
        price,
        stock: 0, // Stock is managed via variants and inventory
        isActive: isActive !== undefined ? isActive : true,
        categoryId,
        images
    });

    const defaultImage = images.length > 0 ? images[0].url : '';

    // If variants were explicitly sent (e.g. from a complex UI), use them.
    // Otherwise, check if 'sizes' was sent (comma-separated string).
    // If neither, create a single 'Mặc định' variant.
    if (Array.isArray(variants) && variants.length > 0) {
        const variantsToCreate = variants.map((v) => ({
            productId: product._id,
            size: v.size || 'Mặc định',
            colorId: v.colorId || v.color || null,
            price: v.price || price || 0,
            stock: 0,
            image: v.image || defaultImage
        }));
        await ProductVariant.insertMany(variantsToCreate);
    } else if (sizes) {
        // Handle comma-separated sizes or array
        const sizeList = typeof sizes === 'string' 
            ? sizes.split(',').map(s => s.trim()).filter(s => s)
            : (Array.isArray(sizes) ? sizes : []);
            
        if (sizeList.length > 0) {
            const variantsToCreate = sizeList.map(sz => ({
                productId: product._id,
                size: sz,
                colorId: null,
                price: price || 0,
                stock: 0,
                image: defaultImage
            }));
            await ProductVariant.insertMany(variantsToCreate);
        } else {
            // Fallback if sizes string was empty
            await ProductVariant.create({
                productId: product._id,
                size: 'Mặc định',
                colorId: null,
                price: price || 0,
                stock: 0,
                image: defaultImage
            });
        }
    } else {
        await ProductVariant.create({
            productId: product._id,
            size: 'Mặc định',
            colorId: null,
            price: price || 0,
            stock: 0,
            image: defaultImage
        });
    }

    return product;
};

const updateProduct = async (id, body, files) => {
    const { name, description, price, isActive, categoryId } = body;
    const product = await Product.findById(id);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    // Stock is not manually updatable anymore
    if (isActive !== undefined) product.isActive = isActive;
    if (categoryId !== undefined) product.categoryId = categoryId;

    const parsedImages = parseImages(files, body.images);
    if (parsedImages !== undefined) product.images = parsedImages;
    await product.save();

    const variants = parseVariants(body.variants);
    if (variants !== undefined) {
        await ProductVariant.deleteMany({ productId: product._id });
        const defaultImage = product.images && product.images.length > 0 ? product.images[0].url : '';
        
        if (Array.isArray(variants) && variants.length > 0) {
            const variantsToCreate = variants.map((v) => ({
                productId: product._id,
                size: v.size || 'Mặc định',
                colorId: v.colorId || v.color || null,
                price: v.price || product.price || 0,
                stock: 0,
                image: v.image || defaultImage
            }));
            await ProductVariant.insertMany(variantsToCreate);
        } else {
            await ProductVariant.create({
                productId: product._id,
                size: 'Mặc định',
                colorId: null,
                price: product.price || 0,
                stock: 0,
                image: defaultImage
            });
        }
    }

    return product;
};

const deleteProduct = async (id) => {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
    return { message: 'Xóa sản phẩm thành công' };
};

const uploadColorImage = async (productId, colorId, file) => {
    if (!file) throw new AppError('Thiếu file ảnh', 400);
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    product.images.push({
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
        colorId,
        order: product.images.length
    });
    await product.save();
    return product;
};

const updateImageOrder = async (productId, imageId, order) => {
    const parsedOrder = Number(order);
    if (!Number.isFinite(parsedOrder) || parsedOrder < 0) {
        throw new AppError('Thứ tự ảnh không hợp lệ', 400);
    }

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const image = product.images.id(imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    image.order = parsedOrder;
    await product.save();
    return product;
};

const deleteColorImage = async (productId, imageId) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const image = product.images.id(imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    image.deleteOne();
    await product.save();
    return product;
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadColorImage,
    updateImageOrder,
    deleteColorImage
};
