const express = require('express');
const router = express.Router();
const DeliveryManagement = require('../models/DeliveryManagement');

// GET /api/deliveries — list all delivery management records
router.get('/', async (req, res) => {
  try {
    console.log('--- API REQUEST: GET /api/deliveries ---');
    console.log('Querying MongoDB collection: delivery_managements...');
    
    const count = await DeliveryManagement.countDocuments();
    console.log(`Found ${count} total documents in delivery_managements collection.`);

    const deliveries = await DeliveryManagement.find().sort({ createdAt: -1 });
    
    console.log(`Successfully fetched ${deliveries.length} delivery records to send to mobile app.`);
    res.json({ success: true, data: deliveries });
  } catch (err) {
    console.error('🔴 ERROR fetching deliveries:', err.message);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// GET /api/deliveries/:id
router.get('/:id', async (req, res) => {
  try {
    const delivery = await DeliveryManagement.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/deliveries/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const delivery = await DeliveryManagement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    
    res.json({ success: true, data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
