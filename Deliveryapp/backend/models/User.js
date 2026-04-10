const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Work, etc.
  line1: { type: String, required: true },
  city: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: '' },
    avatarInitials: { type: String, default: 'U' },
    membershipTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    loyaltyPoints: { type: Number, default: 0 },
    totalSaved: { type: Number, default: 0 },
    savedAddresses: [addressSchema],
    favoriteRestaurantIds: [{ type: String }],
    activePromos: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
