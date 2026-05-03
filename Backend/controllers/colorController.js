const {
    getAllColors: getAllColorsService,
    createColor: createColorService,
    deleteColor: deleteColorService
} = require('../services/colorService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

const getAllColors = async (req, res) => {
    try {
        const colors = await getAllColorsService();
        res.status(200).json(colors);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const createColor = async (req, res) => {
    try {
        const color = await createColorService(req.body);
        res.status(201).json(color);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

const deleteColor = async (req, res) => {
    try {
        const data = await deleteColorService(req.params.id);
        res.status(200).json(data);
    } catch (error) {
        return handleServiceError(res, error);
    }
};

module.exports = { getAllColors, createColor, deleteColor };
