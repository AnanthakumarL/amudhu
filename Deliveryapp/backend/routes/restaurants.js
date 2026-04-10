const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// GET /api/restaurants
// Query params: ?category=pizza&search=sushi&limit=20&page=1
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;
    const filter = { isOpen: true };

    // Filter by category
    if (category && category !== 'all') {
      filter.categoryIds = category;
    }

    // Text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { rating: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Restaurant.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ id: req.params.id });
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/restaurants — add a restaurant
router.post('/', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    const saved = await restaurant.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/restaurants/:id — partial update
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Restaurant.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/restaurants/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Restaurant.findOneAndDelete({ id: req.params.id });
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
