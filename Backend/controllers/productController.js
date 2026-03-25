const Product = require('../schemas/productSchema');

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

        // Nếu có page/limit thì phân trang, không thì trả về tất cả
        if (page && limit) {
            const skip  = (parseInt(page) - 1) * parseInt(limit);
            const total = await Product.countDocuments(query);
            const products = await Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            return res.status(200).json({ products, total, page: parseInt(page), limit: parseInt(limit) });
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id — Chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products — Tạo mới (Admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, isActive, categoryId } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' });

        const product = await Product.create({ name, description, price, stock, isActive, categoryId });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/products/:id — Cập nhật (Admin only)
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, isActive, categoryId } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (name        !== undefined) product.name        = name;
        if (description !== undefined) product.description = description;
        if (price       !== undefined) product.price       = price;
        if (stock       !== undefined) product.stock       = stock;
        if (isActive    !== undefined) product.isActive    = isActive;
        if (categoryId  !== undefined) product.categoryId  = categoryId;

        const updated = await product.save();
        res.status(200).json(updated);
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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };

