// POST /api/auth/login
const { kv } = require('@vercel/kv');
const { verifyPassword, signToken, setAuthCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło wymagane' });
  }

  const emailLower = email.toLowerCase().trim();
  const userId = await kv.get(`email:${emailLower}`);
  if (!userId) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const user = await kv.get(`user:${userId}`);
  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const token = signToken(userId, emailLower);
  setAuthCookie(res, token);

  return res.status(200).json({
    ok: true,
    user: { id: userId, email: emailLower, products: user.products || [], profile: user.profile },
  });
};
