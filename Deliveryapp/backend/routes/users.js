const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users/:id — get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users — register / create user
router.post('/', async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const user = new User(req.body);
    const saved = await user.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id — update profile fields
router.patch('/:id', async (req, res) => {
  try {
    // Prevent email/loyalty override unless explicit
    const allowedFields = ['name', 'phone', 'avatarInitials', 'savedAddresses', 'favoriteRestaurantIds'];
    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/points — add loyalty points
router.patch('/:id/points', async (req, res) => {
  try {
    const { points } = req.body;
    if (typeof points !== 'number') {
      return res.status(400).json({ success: false, message: 'points must be a number' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { loyaltyPoints: points } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { loyaltyPoints: updated.loyaltyPoints } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/favorites/:restaurantId — toggle favorite
router.post('/:id/favorites/:restaurantId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const rid = req.params.restaurantId;
    const isFav = user.favoriteRestaurantIds.includes(rid);

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      isFav
        ? { $pull: { favoriteRestaurantIds: rid } }
        : { $addToSet: { favoriteRestaurantIds: rid } },
      { new: true }
    );

    res.json({
      success: true,
      data: { favorited: !isFav, favoriteRestaurantIds: updated.favoriteRestaurantIds },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
