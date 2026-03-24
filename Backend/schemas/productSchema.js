const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  images: [
    {
      url: String,
      publicId: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);