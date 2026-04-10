const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. "pizza"
    label: { type: String, required: true },
    emoji: { type: String, default: '🍽️' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
