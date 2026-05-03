const {
    getVariants: getVariantsService,
    addVariant: addVariantService,
    updateVariant: updateVariantService,
    deleteVariant: deleteVariantService,
    batchUpdateVariantPrice: batchUpdateVariantPriceService
} = require('../services/productVariantService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

const getVariants = async (req, res) => {
    try {
        const data = await getVariantsService(req.params.productId, req.query);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const addVariant = async (req, res) => {
    try {
        const variant = await addVariantService(req.params.productId, req.body, req.file);
        res.status(201).json(variant);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const updateVariant = async (req, res) => {
    try {
        const variant = await updateVariantService(req.params.variantId, req.body, req.file);
        res.status(200).json(variant);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const deleteVariant = async (req, res) => {
    try {
        const data = await deleteVariantService(req.params.variantId);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const batchUpdateVariantPrice = async (req, res) => {
    try {
        const data = await batchUpdateVariantPriceService(req.params.productId, req.body);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

module.exports = { getVariants, addVariant, updateVariant, deleteVariant, batchUpdateVariantPrice };
