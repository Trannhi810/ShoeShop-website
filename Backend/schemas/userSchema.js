const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    role: {
      type: String,
      enum: ['Customer', 'Staff', 'Admin'],
      default: 'Customer',
    },
    fullName: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
