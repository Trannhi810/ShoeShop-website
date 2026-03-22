const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart"
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant"
  },
  quantity: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model("CartItem", cartItemSchema);