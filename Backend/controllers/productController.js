const {
    getAllProducts: getAllProductsService,
    getProductById: getProductByIdService,
    createProduct: createProductService,
    updateProduct: updateProductService,
    deleteProduct: deleteProductService,
    uploadColorImage: uploadColorImageService,
    updateImageOrder: updateImageOrderService,
    deleteColorImage: deleteColorImageService
} = require('../services/productService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

// GET /api/products — Lấy danh sách (hỗ trợ search, filter, pagination)
const getAllProducts = async (req, res) => {
    try {
        const data = await getAllProductsService(req.query);
        return res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// GET /api/products/:id — Chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await getProductByIdService(req.params.id);
        res.status(200).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// POST /api/products — Tạo mới (Admin only)
const createProduct = async (req, res) => {
    try {
        const product = await createProductService(req.body, req.files);
        res.status(201).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// PUT /api/products/:id — Cập nhật (Admin only)
const updateProduct = async (req, res) => {
    try {
        const product = await updateProductService(req.params.id, req.body, req.files);
        res.status(200).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

// DELETE /api/products/:id — Xóa (Admin only)
const deleteProduct = async (req, res) => {
    try {
        const data = await deleteProductService(req.params.id);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const uploadColorImage = async (req, res) => {
    try {
        const product = await uploadColorImageService(req.params.id, req.params.colorId, req.file);
        return res.status(200).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const updateImageOrder = async (req, res) => {
    try {
        const product = await updateImageOrderService(req.params.id, req.body.imageId, req.body.order);
        return res.status(200).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const deleteColorImage = async (req, res) => {
    try {
        const product = await deleteColorImageService(req.params.id, req.params.imageId);
        return res.status(200).json(product);
    } catch (error) {
        return handleServiceError(res, error);
    }
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

