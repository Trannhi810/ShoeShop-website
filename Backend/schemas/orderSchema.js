const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: ['Pending', 'Shipping', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    shippingAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
