const paymentTransactionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  method: String,
  amount: Number,
  status: String,
  transactionNo: String,
  gatewayResponse: String,
  paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);