const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    name:     { type: String }, // giữ lại để tương thích dữ liệu cũ
    email:    { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    phone:    { type: String },
    address:  { type: String },
    role: {
      type: String,
      enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
      default: 'CUSTOMER'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
