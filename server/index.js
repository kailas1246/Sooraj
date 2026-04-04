require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habit-tracker';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
