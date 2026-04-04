const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const ensureAuth = require('../middleware/auth');

// protect all habit routes
router.use(ensureAuth);

function ensureItemsArray(habit, log) {
  const len = (habit.checklistItems || []).length;
  if (!log.items || log.items.length !== len) {
    const items = (habit.checklistItems || []).map(() => ({ completed: false }));
    log.items = items;
  }
}

// GET /api/habits - return habits for current user
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ owner: req.userId }).lean();
    const normalized = habits.map(h => ({ ...h, id: String(h._id) }));
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits
router.post('/', async (req, res) => {
  try {
    const { name, checklistItems = [] } = req.body;
    const habit = await Habit.create({ name, checklistItems, owner: req.userId });
    const h = habit.toObject();
    h.id = String(h._id);
    res.status(201).json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// GET /api/habits/:id (optionally ?date=YYYY-MM-DD)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const habit = await Habit.findById(id).lean();
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    if (String(habit.owner) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    if (!date) {
      const h = { ...habit, id: String(habit._id) };
      return res.json(h);
    }

    let log = await HabitLog.findOne({ habitId: id, date }).lean();
    if (!log) {
      // construct default log
      const items = (habit.checklistItems || []).map(() => ({ completed: false }));
      log = {
        habitId: id,
        date,
        items,
        completedCount: 0,
        isFullyCompleted: false,
        completionPercentage: 0
      };
    }

    const h = { ...habit, id: String(habit._id) };
    res.json({ ...h, ...log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

// GET /api/habits/:id/history?days=30
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days || '30', 10);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    // dates stored as YYYY-MM-DD strings; build array
    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    // ensure habit belongs to user
    const habit = await Habit.findById(id).lean();
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    if (String(habit.owner) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    const logs = await HabitLog.find({ habitId: id, date: { $in: dates } }).lean();
    // return logs as array; frontend can map/match by date
    res.json(logs.map(l => ({ ...l, id: String(l._id) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// PUT /api/habits/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const existing = await Habit.findById(id).lean();
    if (!existing) return res.status(404).json({ error: 'Habit not found' });
    if (String(existing.owner) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });
    const habit = await Habit.findByIdAndUpdate(id, updates, { new: true }).lean();
    const h = { ...habit, id: String(habit._id) };
    res.json(h);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Habit.findById(id).lean();
    if (!existing) return res.status(404).json({ error: 'Habit not found' });
    if (String(existing.owner) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    await Habit.findByIdAndDelete(id);
    await HabitLog.deleteMany({ habitId: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// PATCH /api/habits/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIndex, completed, date } = req.body;
    if (typeof itemIndex !== 'number' || !date) return res.status(400).json({ error: 'Invalid payload' });

    const habit = await Habit.findById(id).lean();
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    if (String(habit.owner) !== String(req.userId)) return res.status(403).json({ error: 'Forbidden' });

    let log = await HabitLog.findOne({ habitId: id, date });
    if (!log) {
      const items = (habit.checklistItems || []).map(() => ({ completed: false }));
      log = new HabitLog({ habitId: id, date, items });
    }

    // ensure items array length matches
    ensureItemsArray(habit, log);

    // update item
    log.items[itemIndex].completed = !!completed;

    // recompute counts
    const completedCount = log.items.reduce((acc, it) => acc + (it.completed ? 1 : 0), 0);
    const total = (habit.checklistItems || []).length || 1;
    log.completedCount = completedCount;
    log.isFullyCompleted = completedCount >= total;
    log.completionPercentage = Math.round((completedCount / total) * 100);

    await log.save();

    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

module.exports = router;
