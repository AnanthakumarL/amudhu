/**
 * seed.js — populates MongoDB with initial categories and restaurants
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Restaurant = require('./models/Restaurant');

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'burger', label: 'Burgers', emoji: '🍔' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
];

const RESTAURANTS = [
  {
    id: 'r1',
    name: "Marco's Pizza House",
    tags: ['Italian', 'Cheesy', 'Hot'],
    rating: 4.6,
    etaMinutes: '20-30',
    deliveryFee: '$1.99',
    categoryIds: ['pizza'],
    promo: '2x points tonight',
    theme: ['#FB923C', '#F97316'],
    emoji: '🍕',
  },
  {
    id: 'r2',
    name: 'Burger Yard',
    tags: ['Grill', 'Fries', 'Classic'],
    rating: 4.4,
    etaMinutes: '25-35',
    deliveryFee: '$0.99',
    categoryIds: ['burger'],
    promo: 'Free fries combo',
    theme: ['#F59E0B', '#EAB308'],
    emoji: '🍔',
  },
  {
    id: 'r3',
    name: 'Sakura Sushi',
    tags: ['Fresh', 'Rice', 'Seafood'],
    rating: 4.8,
    etaMinutes: '30-45',
    deliveryFee: '$2.49',
    categoryIds: ['sushi'],
    promo: '20% off platters',
    theme: ['#0EA5E9', '#06B6D4'],
    emoji: '🍣',
  },
  {
    id: 'r4',
    name: 'Sweet Corner',
    tags: ['Cake', 'Ice Cream', 'Treats'],
    rating: 4.5,
    etaMinutes: '15-25',
    deliveryFee: '$0.00',
    categoryIds: ['dessert'],
    promo: 'Buy 1 get 1 donut',
    theme: ['#FB7185', '#F43F5E'],
    emoji: '🍰',
  },
  {
    id: 'r5',
    name: 'Daily Brew',
    tags: ['Latte', 'Bakery', 'Quick'],
    rating: 4.3,
    etaMinutes: '10-20',
    deliveryFee: '$0.49',
    categoryIds: ['coffee', 'dessert'],
    promo: 'Morning deal 15% off',
    theme: ['#14B8A6', '#22C55E'],
    emoji: '☕',
  },
];

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
    console.log('✅ Connected to:', process.env.MONGODB_DB);

    // Clear existing
    await Category.deleteMany({});
    await Restaurant.deleteMany({});
    console.log('🗑️  Cleared existing categories and restaurants');

    // Insert fresh data
    await Category.insertMany(CATEGORIES);
    console.log(`📦 Seeded ${CATEGORIES.length} categories`);

    await Restaurant.insertMany(RESTAURANTS);
    console.log(`🍽️  Seeded ${RESTAURANTS.length} restaurants`);

    console.log('\n✅ Database seeded successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
