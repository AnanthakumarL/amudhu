const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const DeliveryUser = require('./models/DeliveryUser');

// ─── Routes ──────────────────────────────────────────────────────────────────
const categoryRoutes    = require('./routes/categories');
const restaurantRoutes  = require('./routes/restaurants');
const orderRoutes       = require('./routes/orders');
const userRoutes        = require('./routes/users');
const deliveryRoutes    = require('./routes/deliveries');
const authRoutes        = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/categories',   categoryRoutes);
app.use('/api/restaurants',  restaurantRoutes);
app.use('/api/orders',       orderRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/deliveries',   deliveryRoutes);
app.use('/api/auth',         authRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const hashPassword = (password, salt) =>
  crypto.scryptSync(String(password), String(salt), 64).toString('hex');

async function ensureProductionLogin() {
  const loginId = String(process.env.PRODUCTION_LOGIN_ID || '').trim().toLowerCase();
  const password = String(process.env.PRODUCTION_LOGIN_PASSWORD || '').trim();

  if (!loginId || !password) {
    console.log('ℹ️ Production login skipped (set PRODUCTION_LOGIN_ID and PRODUCTION_LOGIN_PASSWORD in .env).');
    return;
  }

  const phone = String(process.env.PRODUCTION_LOGIN_PHONE || '+910000000000').trim();
  const name = String(process.env.PRODUCTION_LOGIN_NAME || 'Production Login').trim();
  const email = String(process.env.PRODUCTION_LOGIN_EMAIL || loginId).trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  await DeliveryUser.findOneAndUpdate(
    { loginId },
    {
      $set: {
        loginId,
        phone,
        name,
        email,
        passwordHash,
        passwordSalt: salt,
        isProductionAccount: true,
      },
      $setOnInsert: {
        profilePicBase64: '',
      },
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Production login ready for ${loginId}`);
}

// ─── MongoDB connection + server start ────────────────────────────────────────
async function startServer() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB,
    });
    console.log(`✅ MongoDB connected — database: ${process.env.MONGODB_DB}`);

    await ensureProductionLogin();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Health:       http://localhost:${PORT}/health`);
      console.log(`   Restaurants:  http://localhost:${PORT}/api/restaurants`);
      console.log(`   Categories:   http://localhost:${PORT}/api/categories`);
      console.log(`   Orders:       http://localhost:${PORT}/api/orders`);
      console.log(`   Users:        http://localhost:${PORT}/api/users\n`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('\n🛑 MongoDB connection closed. Server stopped.');
  process.exit(0);
});

startServer();
