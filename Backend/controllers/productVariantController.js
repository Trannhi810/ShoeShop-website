const ProductVariant = require('../schemas/productVariantSchema');
const Product = require('../schemas/productSchema');

const getVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = { productId };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await ProductVariant.countDocuments(query);
        const variants = await ProductVariant.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('colorId');

        res.status(200).json({ variants, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size, colorId, price, stock } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        let image = '';
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        const variant = await ProductVariant.create({
            productId,
            size,
            colorId,
            price: price || product.price,
            stock: stock || 0,
            image
        });

        res.status(201).json(variant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { size, colorId, price, stock } = req.body;

        const variant = await ProductVariant.findById(variantId);
        if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

        if (size !== undefined) variant.size = size;
        if (colorId !== undefined) variant.colorId = colorId;
        if (price !== undefined) variant.price = price;
        if (stock !== undefined) variant.stock = stock;

        if (req.file) {
            variant.image = `/uploads/${req.file.filename}`;
        }

        await variant.save();
        res.status(200).json(variant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const variant = await ProductVariant.findByIdAndDelete(variantId);
        if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

        res.status(200).json({ message: 'Xóa biến thể thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const batchUpdateVariantPrice = async (req, res) => {
    try {
        const { productId } = req.params;
        const { colorId, price } = req.body;
        
        if (!colorId || price === undefined) {
             return res.status(400).json({ message: "Thiếu colorId hoặc price." });
        }
        
        await ProductVariant.updateMany(
            { productId, colorId },
            { $set: { price } }
        );
        
        res.status(200).json({ message: "Cập nhật giá hàng loạt thành công." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getVariants, addVariant, updateVariant, deleteVariant, batchUpdateVariantPrice };
