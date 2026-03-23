const Product = require('../schemas/productSchema');

// GET /api/products : Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id : Lấy chi tiết 1 sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId');
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/products : Tạo mới sản phẩm (Chỉ Admin)
const createProduct = async (req, res) => {
    try {
        // req.body chứa name, description, price, categoryId...
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/products/:id : Cập nhật sản phẩm (Chỉ Admin)
const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm cần cập nhật" });
        }
        
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/products/:id : Xoá sản phẩm (Chỉ Admin)
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm cần xoá" });
        }
        res.status(200).json({ message: "Xoá sản phẩm thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
