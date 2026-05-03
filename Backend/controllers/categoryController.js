const {
    getAllCategories: getAllCategoriesService,
    getCategoryById: getCategoryByIdService,
    createCategory: createCategoryService,
    updateCategory: updateCategoryService,
    deleteCategory: deleteCategoryService
} = require('../services/categoryService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// GET /api/categories — Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const categories = await getAllCategoriesService(req.query);
        res.status(200).json(categories);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// GET /api/categories/:id — Chi tiết 1 danh mục
const getCategoryById = async (req, res) => {
    try {
        const cat = await getCategoryByIdService(req.params.id);
        res.status(200).json(cat);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// POST /api/categories — Tạo mới (Admin only)
const createCategory = async (req, res) => {
    try {
        const cat = await createCategoryService(req.body);
        res.status(201).json(cat);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// PUT /api/categories/:id — Cập nhật (Admin only)
const updateCategory = async (req, res) => {
    try {
        const updated = await updateCategoryService(req.params.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// DELETE /api/categories/:id — Xóa (Admin only)
const deleteCategory = async (req, res) => {
    try {
        const data = await deleteCategoryService(req.params.id);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
