// POST /api/auth/logout
const { clearAuthCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
};
