
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

        // Đổ variants vào từng product và tính tổng kho
        for (let p of products) {
            p.variants = await ProductVariant.find({ productId: p._id }).populate('colorId').lean();
            p.stock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
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
        
        // Lấy variants và tính tổng tồn
        product.variants = await ProductVariant.find({ productId: product._id }).populate('colorId').lean();
        product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, isActive, categoryId, images: bodyImages } = req.body;
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
            name, description, price, isActive, categoryId, 
            stock: 0, // Tồn kho ban đầu bằng 0, chỉ tăng qua quản lý kho
            images: finalImages 
        });

        // Tự động tạo một biến thể mặc định
        await ProductVariant.create({
            productId: product._id,
            size: 'Mặc định',
            // colorId để trống -> 'Màu chuẩn' cho những backend ko tìm thấy colorId
            price: price || 0,
            stock: 0,
            image: finalImages.length > 0 ? finalImages[0].url : ''
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, isActive, categoryId, images: bodyImages } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (name        !== undefined) product.name        = name;
        if (description !== undefined) product.description = description;
        if (price       !== undefined) product.price       = price;
        // Không nhận stock từ body nữa
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

