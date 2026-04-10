const mongoose = require('mongoose');

const deliveryManagementSchema = new mongoose.Schema({
  order_id: { type: String },
  tracking_number: { type: String, default: null },
  delivery_date: { type: Date, default: null },
  status: { type: String, default: 'pending' },
  contact_name: { type: String },
  contact_phone: { type: String, default: null },
  address: { type: String },
  notes: { type: String },
  attributes: { type: mongoose.Schema.Types.Mixed }
}, { 
  timestamps: true,
  // We specify the collection name exactly to match your existing DB
  collection: 'delivery_managements' 
});

module.exports = mongoose.model('DeliveryManagement', deliveryManagementSchema);
