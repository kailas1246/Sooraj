const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

module.exports = function ensureAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Not authorized' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth' });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    console.error('ensureAuth error', err);
    return res.status(401).json({ error: 'Not authorized' });
  }
};
