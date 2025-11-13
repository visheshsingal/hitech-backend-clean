const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const propertyRoutes = require('./routes/propertyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const authRoutes = require('./routes/authRoutes');

console.log('ENV LOADED:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : undefined,
  CLIENT_URL: process.env.CLIENT_URL
});
// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
// Normalize CLIENT_URL to avoid accidental trailing-slash mismatch which
// causes strict origin comparison to fail in browsers when credentials are used.
const rawClientUrl = process.env.CLIENT_URL;
const normalizedClientUrl = rawClientUrl ? rawClientUrl.replace(/\/+$/, '') : 'http://localhost:3001';
console.log('[server] using CLIENT_URL:', normalizedClientUrl);

app.use(cors({
  origin: normalizedClientUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes); // ADD THIS LINE

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});