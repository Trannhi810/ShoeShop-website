const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },

  type: {
    type: String,
    enum: ["IMPORT", "EXPORT", "ORDER", "CANCEL", "ADJUST"],
    required: true
  },

  quantity: { type: Number, required: true },
  beforeStock: { type: Number, required: true },
  afterStock: { type: Number, required: true },

  referenceId: { type: String, default: '' },
  note: { type: String, default: '' },

  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
