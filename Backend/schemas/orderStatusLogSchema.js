const orderStatusLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  oldStatus: String,
  newStatus: String,

  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  note: String
}, { timestamps: true });

module.exports = mongoose.model("OrderStatusLog", orderStatusLogSchema);