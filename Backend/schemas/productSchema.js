const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  price:       { type: Number, default: 0 },
  stock:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [
    { url: String, publicId: String }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);