const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    tags: [{ type: String }],
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    etaMinutes: { type: String, default: '20-30' },
    deliveryFee: { type: String, default: '$1.99' },
    categoryIds: [{ type: String }],
    promo: { type: String, default: '' },
    theme: {
      type: [String],
      validate: {
        validator: (v) => v.length === 2,
        message: 'theme must have exactly 2 hex colors',
      },
      default: ['#6366F1', '#8B5CF6'],
    },
    emoji: { type: String, default: '🍽️' },
    isOpen: { type: Boolean, default: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { timestamps: true }
);

// Full-text search index on name + tags
restaurantSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
