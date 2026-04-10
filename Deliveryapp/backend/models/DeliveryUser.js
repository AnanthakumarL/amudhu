const mongoose = require('mongoose');

const deliveryUserSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  loginId: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: ''
  },
  passwordHash: {
    type: String,
    default: ''
  },
  passwordSalt: {
    type: String,
    default: ''
  },
  isProductionAccount: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  },
  profilePicBase64: {
    type: String,
    default: ""
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'delivery_users' 
});

module.exports = mongoose.model('DeliveryUser', deliveryUserSchema);
