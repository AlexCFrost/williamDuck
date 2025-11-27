const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/$/, '')); // Remove trailing slashes

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
// Note: In serverless (Vercel), we handle connection inside routes using lib/dbConnect.js
// For local dev, we can connect here if needed, but it's better to rely on the route-level connection
if (process.env.NODE_ENV !== 'production') {
  const connectDB = require('./lib/dbConnect');
  connectDB().then(() => console.log('MongoDB connected locally'));
}

// Routes
app.get('/', (req, res) => {
  res.send('Dynamic Storytelling Backend is running');
});

// Import Routes 
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/story');

app.use('/api/auth', authRoutes);
app.use('/api/story', storyRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
