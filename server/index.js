const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB } = require('./config/db');
const Admin = require('./models/Admin');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const musicRoutes = require('./routes/musicRoutes');
const { migrateBaselineCatalog } = require('./services/catalogMigration');
const musicSyncService = require('./services/musicSyncService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows admin dashboard CDN scripts
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Admin Website
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/music', musicRoutes);

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'ELWO Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Admin redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Seed default Super Admin if none exists
async function seedDefaultAdmin() {
  try {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@elwo.stream';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@Elwo2026!';
    let admin = await Admin.findOne({ email: defaultEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    if (!admin) {
      await Admin.create({
        name: 'ELWO Super Admin',
        email: defaultEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      console.log(`[ELWO SEED] Default Super Admin created: ${defaultEmail} / ${defaultPassword}`);
    } else if (!admin.passwordHash) {
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log(`[ELWO SEED] Default Super Admin passwordHash updated: ${defaultEmail}`);
    }
  } catch (err) {
    console.error('[ELWO SEED] Error seeding admin:', err.message);
  }
}

// Start Server
async function startServer() {
  await connectDB();
  await seedDefaultAdmin();
  await migrateBaselineCatalog();
  musicSyncService.startScheduledSync();

  app.listen(PORT, () => {
    console.log(`[ELWO BACKEND] Server running on http://localhost:${PORT}`);
    console.log(`[ELWO ADMIN] Admin portal accessible at http://localhost:${PORT}/admin`);
  });
}

startServer();

module.exports = app;
