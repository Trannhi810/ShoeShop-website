const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
