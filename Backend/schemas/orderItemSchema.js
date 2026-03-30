const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },

  productName: String,
  productImage: String,
  size: String,
  color: String,

  price: Number,
  quantity: Number
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);