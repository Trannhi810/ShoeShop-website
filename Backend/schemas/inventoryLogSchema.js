const inventoryLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },

  type: {
    type: String,
    enum: ["IMPORT", "ORDER", "CANCEL", "ADJUST"]
  },

  quantity: Number,

  beforeStock: Number,
  afterStock: Number,

  referenceId: String,
  note: String,

  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);