const Category = require('../schemas/categorySchema');
const Product  = require('../schemas/productSchema');

// GET /api/categories — Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};
        if (search) query.name = { $regex: search, $options: 'i' };

        const categories = await Category.find(query).sort({ createdAt: -1 });

        // Đếm số sản phẩm theo từng danh mục
        const withCount = await Promise.all(
            categories.map(async (c) => {
                const count = await Product.countDocuments({ categoryId: c._id });
                return { ...c.toObject(), productCount: count };
            })
        );

        res.status(200).json(withCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/categories/:id — Chi tiết 1 danh mục
const getCategoryById = async (req, res) => {
    try {
        const cat = await Category.findById(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.status(200).json(cat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/categories — Tạo mới (Admin only)
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

        const exists = await Category.findOne({ name: name.trim() });
        if (exists) return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });

        const cat = await Category.create({ name: name.trim(), description });
        res.status(201).json(cat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/categories/:id — Cập nhật (Admin only)
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const cat = await Category.findById(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        if (name && name.trim() !== cat.name) {
            const exists = await Category.findOne({ name: name.trim() });
            if (exists) return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
            cat.name = name.trim();
        }
        if (description !== undefined) cat.description = description;

        const updated = await cat.save();
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/categories/:id — Xóa (Admin only)
const deleteCategory = async (req, res) => {
    try {
        const cat = await Category.findById(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        // Kiểm tra có sản phẩm đang dùng danh mục này không
        const productCount = await Product.countDocuments({ categoryId: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                message: `Không thể xóa! Danh mục này đang có ${productCount} sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước.`
            });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
