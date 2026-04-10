const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: String, required: true },
    restaurantName: { type: String, required: true },
    restaurantEmoji: { type: String, default: '🍽️' },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    deliveryAddress: { type: String, required: true },
    driverName: { type: String, default: null },
    driverRating: { type: Number, default: null },
    estimatedDelivery: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
