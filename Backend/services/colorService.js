const Color = require('../schemas/colorSchema');
const { AppError } = require('../utils/appError');

const getAllColors = async () => {
    return Color.find().sort({ name: 1 });
};

const createColor = async ({ name, hexCode }) => {
    if (!name) throw new AppError('Tên màu là bắt buộc.', 400);
    const existingColor = await Color.findOne({ name });
    if (existingColor) throw new AppError('Màu này đã tồn tại.', 400);
    return Color.create({ name, hexCode: hexCode || '#000000' });
};

const deleteColor = async (id) => {
    await Color.findByIdAndDelete(id);
    return { message: 'Đã xóa màu thành công.' };
};

module.exports = { getAllColors, createColor, deleteColor };
