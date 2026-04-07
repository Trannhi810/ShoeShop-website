const mongoose = require('mongoose');
const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  size: String,
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Color"
  },
  price: Number,
  stock: Number,
  image: String
}, { timestamps: true });

module.exports = mongoose.model("ProductVariant", productVariantSchema);