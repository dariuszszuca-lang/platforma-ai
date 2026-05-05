// POST /api/auth/signup
// Body: { email, password, invitation? }
const { kv } = require('@vercel/kv');
const { hashPassword, signToken, setAuthCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, invitation } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło wymagane' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Hasło musi mieć min. 8 znaków' });
  }

  const emailLower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return res.status(400).json({ error: 'Nieprawidłowy email' });
  }

  // Sprawdź czy user już istnieje
  const existingId = await kv.get(`email:${emailLower}`);
  if (existingId) {
    return res.status(409).json({ error: 'Konto o tym emailu już istnieje. Zaloguj się.' });
  }

  // Sprawdź invitation (z Stripe webhook po zakupie)
  let products = [];
  if (invitation) {
    const inv = await kv.get(`invitation:${invitation}`);
    if (inv && inv.email === emailLower) {
      products = inv.products || ['tracker-p1'];
      await kv.del(`invitation:${invitation}`);
    }
  }

  // Stwórz user
  const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(password);
  const user = {
    id: userId,
    email: emailLower,
    passwordHash,
    products,
    profile: { hourlyRate: 200, industry: '', teamSize: 'solo', pain: '' },
    createdAt: new Date().toISOString(),
  };

  await kv.set(`user:${userId}`, user);
  await kv.set(`email:${emailLower}`, userId);

  // Token + cookie
  const token = signToken(userId, emailLower);
  setAuthCookie(res, token);

  return res.status(200).json({
    ok: true,
    user: { id: userId, email: emailLower, products, profile: user.profile },
  });
};
