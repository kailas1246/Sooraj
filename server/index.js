require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const habitRoutes = require('../routes/habits');
const authRoutes = require('../routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

// MongoDB connection (NO app.listen)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = conn.connections[0].readyState;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// This is the important part 👇
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
