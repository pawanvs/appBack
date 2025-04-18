require('dotenv').config();
const jwt = require('jsonwebtoken'); // ✅ REQUIRED

function authMiddleware(req, res, next) {
  // 🔓 Skip auth if disabled
  if (process.env.AUTH_ENABLED === 'false') {
    console.log('🔓 Auth disabled via .env');
    return next();
  }

  const authHeader = req.headers['authorization'];
  console.log('🔐 Auth Header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.API_KEY || 'your_secret_key');
    console.log('✅ Token verified:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
