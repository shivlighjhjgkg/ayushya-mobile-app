require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const healthProfileRoutes = require('./routes/healthProfiles');
const familyRoutes = require('./routes/family');
const groceryListRoutes = require('./routes/groceryLists');
const mealPlanRoutes = require('./routes/mealPlans');

const app = express();

// ==================== MIDDLEWARE ====================
// CORS: Allow requests from web frontend
app.use(cors({
  origin: true, // Allow all origins for now (development)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle OPTIONS preflight for all routes (ensure PATCH allowed)


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==================== MONGODB CONNECTION ====================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database: ayushya');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ==================== BASIC ROUTE ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ayushya API is running',
    version: '1.0.0',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== REQUEST LOGGING MIDDLEWARE ====================
// Log incoming requests
app.use((req, res, next) => {
  if (req.path.includes('/health') || req.path.includes('/auth')) {
    console.log(`\n📨 ${req.method.toUpperCase()} ${req.originalUrl}`);
  }
  next();
});

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/health/profile', healthProfileRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /`);
  console.log(`  GET  /health`);
  console.log(`  POST /api/auth/register`);
  console.log(`  POST /api/auth/login\n`);
});