const Category = require('../schemas/categorySchema');
const Product = require('../schemas/productSchema');
const { AppError } = require('../utils/appError');

const getAllCategories = async ({ search }) => {
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const categories = await Category.find(query).sort({ createdAt: -1 });
    const withCount = await Promise.all(
        categories.map(async (c) => {
            const count = await Product.countDocuments({ categoryId: c._id });
            return { ...c.toObject(), productCount: count };
        })
    );
    return withCount;
};

const getCategoryById = async (id) => {
    const cat = await Category.findById(id);
    if (!cat) throw new AppError('Không tìm thấy danh mục', 404);
    return cat;
};

const createCategory = async ({ name, description }) => {
    if (!name || !name.trim()) throw new AppError('Tên danh mục là bắt buộc', 400);
    const cleanName = name.trim();
    const exists = await Category.findOne({ name: cleanName });
    if (exists) throw new AppError('Tên danh mục đã tồn tại', 400);
    return Category.create({ name: cleanName, description });
};

const updateCategory = async (id, { name, description }) => {
    const cat = await Category.findById(id);
    if (!cat) throw new AppError('Không tìm thấy danh mục', 404);

    if (name && name.trim() !== cat.name) {
        const exists = await Category.findOne({ name: name.trim() });
        if (exists) throw new AppError('Tên danh mục đã tồn tại', 400);
        cat.name = name.trim();
    }
    if (description !== undefined) cat.description = description;
    return cat.save();
};

const deleteCategory = async (id) => {
    const cat = await Category.findById(id);
    if (!cat) throw new AppError('Không tìm thấy danh mục', 404);

    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
        throw new AppError(
            `Không thể xóa! Danh mục này đang có ${productCount} sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước.`,
            400
        );
    }

    await Category.findByIdAndDelete(id);
    return { message: 'Xóa danh mục thành công' };
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
