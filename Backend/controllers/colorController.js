const Color = require('../schemas/colorSchema');

const getAllColors = async (req, res) => {
    try {
        const colors = await Color.find().sort({ name: 1 });
        res.status(200).json(colors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createColor = async (req, res) => {
    try {
        const { name, hexCode } = req.body;
        if (!name) return res.status(400).json({ message: "Tên màu là bắt buộc." });
        
        const existingColor = await Color.findOne({ name });
        if (existingColor) return res.status(400).json({ message: "Màu này đã tồn tại." });

        const color = await Color.create({ name, hexCode: hexCode || '#000000' });
        res.status(201).json(color);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteColor = async (req, res) => {
    try {
        const { id } = req.params;
        await Color.findByIdAndDelete(id);
        res.status(200).json({ message: "Đã xóa màu thành công." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllColors, createColor, deleteColor };
