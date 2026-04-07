const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  price:       { type: Number, default: 0 },
  stock:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: [
    { 
      url: String, 
      publicId: String,
      colorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
      order: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);