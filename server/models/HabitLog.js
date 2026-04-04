const mongoose = require('mongoose');

const HabitLogSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  items: { type: [{ completed: Boolean }], default: [] },
  completedCount: { type: Number, default: 0 },
  isFullyCompleted: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0 }
});

HabitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', HabitLogSchema);
