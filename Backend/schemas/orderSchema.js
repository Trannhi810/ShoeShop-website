const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  orderNumber: String,

  items: [
    {
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant"
      },
      productName: String,
      productImage: String,
      size: String,
      color: String,
      price: Number,
      quantity: Number
    }
  ],

  totalAmount: Number,
  shippingFee: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["PENDING", "SHIPPING", "COMPLETED", "CANCELLED"],
    default: "PENDING"
  },

  paymentMethod: String,
  paymentStatus: {
    type: String,
    default: "PENDING"
  },

  shippingAddress: String,

  voucherCode: String,
  voucherDiscount: Number

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);