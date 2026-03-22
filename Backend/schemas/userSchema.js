const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
     role: {
    type: String,
    enum: ["CUSTOMER", "STAFF", "ADMIN"],
    default: "CUSTOMER"
  },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
