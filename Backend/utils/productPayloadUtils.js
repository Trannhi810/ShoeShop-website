const { AppError } = require('./appError');

const parseImages = (files, bodyImages) => {
    if (files && files.length > 0) {
        return files.map((file) => ({
            url: `/uploads/${file.filename}`,
            publicId: file.filename
        }));
    }
    if (bodyImages === undefined) return undefined;
    if (!bodyImages) return [];
    try {
        return typeof bodyImages === 'string' ? JSON.parse(bodyImages) : bodyImages;
    } catch (error) {
        throw new AppError('Dữ liệu images không hợp lệ', 400);
    }
};

const parseVariants = (variants) => {
    if (variants === undefined) return undefined;
    if (!variants) return [];
    try {
        const variantArray = typeof variants === 'string' ? JSON.parse(variants) : variants;
        return Array.isArray(variantArray) ? variantArray : [];
    } catch (error) {
        throw new AppError('Dữ liệu variants không hợp lệ', 400);
    }
};

module.exports = { parseImages, parseVariants };
