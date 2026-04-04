const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ id: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: String(user._id), name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: String(user._id), name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Not authorized' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth' });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (!user) return res.status(401).json({ error: 'Not authorized' });
    res.json({ id: String(user._id), name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Not authorized' });
  }
});

module.exports = router;
