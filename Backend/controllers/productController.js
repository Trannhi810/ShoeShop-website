
const Product = require('../schemas/productSchema');
const ProductVariant = require('../schemas/productVariantSchema');

// GET /api/products — Lấy danh sách (hỗ trợ search, filter, pagination)
const getAllProducts = async (req, res) => {
    try {
        const { search, status, category, page, limit } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name:        { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (status === 'active')   query.isActive  = true;
        if (status === 'inactive') query.isActive  = false;
        if (category)              query.categoryId = category;

        let products;
        let total = 0;

        if (page && limit) {
            const skip  = (parseInt(page) - 1) * parseInt(limit);
            total = await Product.countDocuments(query);
            products = await Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(); // Dùng lean để dễ dàng thêm virtual fields
        } else {
            products = await Product.find(query).sort({ createdAt: -1 })
                .populate('images.colorId')
                .lean();
        }

        // Đổ variants vào từng product
        for (let p of products) {
            p.variants = await ProductVariant.find({ productId: p._id });
        }

        if (page && limit) {
            return res.status(200).json({ products, total, page: parseInt(page), limit: parseInt(limit) });
        }
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id — Chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('images.colorId')
            .lean();
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        
        // Lấy variants
        product.variants = await ProductVariant.find({ productId: product._id });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products — Tạo mới (Admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, isActive, categoryId, images: bodyImages, variants } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' });

        let finalImages = [];
        if (req.files && req.files.length > 0) {
            finalImages = req.files.map(file => ({
                url: `/uploads/${file.filename}`,
                publicId: file.filename
            }));
        } else if (bodyImages) {
            finalImages = typeof bodyImages === 'string' ? JSON.parse(bodyImages) : bodyImages;
        }

        const product = await Product.create({ 
            name, description, price, stock, isActive, categoryId, 
            images: finalImages 
        });

        // Xử lý variants
        if (variants) {
            const variantArray = typeof variants === 'string' ? JSON.parse(variants) : variants;
            if (Array.isArray(variantArray) && variantArray.length > 0) {
                const variantsToCreate = variantArray.map(v => ({
                    productId: product._id,
                    size: v.size,
                    color: v.color,
                    price: v.price || price || 0,
                    stock: v.stock || 0,
                    image: v.image || ''
                }));
                await ProductVariant.insertMany(variantsToCreate);
            } else {
                await ProductVariant.create({
                    productId: product._id,
                    size: 'Mặc định',
                    color: 'Mặc định',
                    price: price || 0,
                    stock: stock || 0,
                    image: finalImages.length > 0 ? finalImages[0].url : ''
                });
            }
        } else {
            await ProductVariant.create({
                productId: product._id,
                size: 'Mặc định',
                color: 'Mặc định',
                price: price || 0,
                stock: stock || 0,
                image: finalImages.length > 0 ? finalImages[0].url : ''
            });
        }

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/products/:id — Cập nhật (Admin only)
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, isActive, categoryId, images: bodyImages, variants } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (name        !== undefined) product.name        = name;
        if (description !== undefined) product.description = description;
        if (price       !== undefined) product.price       = price;
        if (stock       !== undefined) product.stock       = stock;
        if (isActive    !== undefined) product.isActive    = isActive;
        if (categoryId  !== undefined) product.categoryId  = categoryId;

        // Xử lý ảnh
        if (req.files && req.files.length > 0) {
            product.images = req.files.map(file => ({
                url: `/uploads/${file.filename}`,
                publicId: file.filename
            }));
        } else if (bodyImages !== undefined) {
             product.images = typeof bodyImages === 'string' ? JSON.parse(bodyImages) : bodyImages;
        }

        await product.save();

        // Xử lý variants (Xóa hết tạo lại hoặc update cái cũ - ở mức đơn giản là xóa sạch tạo lại)
        if (variants !== undefined) {
            const variantArray = typeof variants === 'string' ? JSON.parse(variants) : variants;
            await ProductVariant.deleteMany({ productId: product._id });
            if (Array.isArray(variantArray) && variantArray.length > 0) {
                const variantsToCreate = variantArray.map(v => ({
                    productId: product._id,
                    size: v.size,
                    color: v.color,
                    price: v.price || product.price,
                    stock: v.stock || 0,
                    image: v.image || ''
                }));
                await ProductVariant.insertMany(variantsToCreate);
            } else {
                await ProductVariant.create({
                    productId: product._id,
                    size: 'Mặc định',
                    color: 'Mặc định',
                    price: product.price,
                    stock: product.stock,
                    image: product.images && product.images.length > 0 ? product.images[0].url : ''
                });
            }
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/products/:id — Xóa (Admin only)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload ảnh riêng cho màu
const uploadColorImage = async (req, res) => {
    try {
        const { id, colorId } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (req.file) {
            product.images.push({
                url: `/uploads/${req.file.filename}`,
                publicId: req.file.filename,
                colorId,
                order: product.images.length
            });
            await product.save();
        }
        res.status(200).json(product);
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

// Cập nhật thứ tự ảnh
const updateImageOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageId, order } = req.body;
        
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        const img = product.images.id(imageId);
        if (img) {
            img.order = order;
            await product.save();
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: "Không tìm thấy ảnh" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa ảnh
const deleteColorImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        product.images.pull(imageId);
        await product.save();
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, uploadColorImage, updateImageOrder, deleteColorImage };

