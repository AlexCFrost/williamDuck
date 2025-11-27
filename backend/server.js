const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Dynamic Storytelling Backend is running');
});

// Import Routes 
const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/story');

app.use('/api/auth', authRoutes);
app.use('/api/story', storyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
