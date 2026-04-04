const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  checklistItems: { type: [String], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStreak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', HabitSchema);
