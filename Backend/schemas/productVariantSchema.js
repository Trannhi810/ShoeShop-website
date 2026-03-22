const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  size: String,
  color: String,
  price: Number,
  stock: Number
}, { timestamps: true });

module.exports = mongoose.model("ProductVariant", productVariantSchema);