// GET /api/auth/me — zwraca aktualnego usera (jeśli zalogowany)
const { requireUser } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  return res.status(200).json({
    id: user.id,
    email: user.email,
    products: user.products || [],
    profile: user.profile || {},
  });
};
