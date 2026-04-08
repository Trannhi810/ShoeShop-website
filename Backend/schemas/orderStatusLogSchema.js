const mongoose = require('mongoose');

const orderStatusLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  oldStatus: { type: String, default: null },
  newStatus: { type: String, required: true },

  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model("OrderStatusLog", orderStatusLogSchema);