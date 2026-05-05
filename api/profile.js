// GET/PUT /api/profile
const { kv } = require('@vercel/kv');
const { requireUser } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    return res.status(200).json(user.profile || {});
  }

  if (req.method === 'PUT') {
    const { hourlyRate, industry, teamSize, pain } = req.body || {};
    user.profile = {
      ...user.profile,
      hourlyRate: Number(hourlyRate) || user.profile.hourlyRate || 200,
      industry: industry || user.profile.industry || '',
      teamSize: teamSize || user.profile.teamSize || 'solo',
      pain: pain || user.profile.pain || '',
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`user:${user.id}`, user);
    return res.status(200).json({ ok: true, profile: user.profile });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
