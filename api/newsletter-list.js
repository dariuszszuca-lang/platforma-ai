const {
  GROUP_LABELS,
  kvCommand,
  requireAdmin,
  safeJsonParse,
  setCors,
  subscriberKey
} = require('./newsletter-utils');

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona.' });
  }

  try {
    await requireAdmin(req);

    const ids = await kvCommand(['SMEMBERS', 'newsletter:subscribers']);
    const keys = Array.isArray(ids) ? ids.map(subscriberKey) : [];
    const values = keys.length ? await kvCommand(['MGET', ...keys]) : [];
    const subscribers = values
      .map(safeJsonParse)
      .filter(Boolean)
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    return res.status(200).json({
      success: true,
      subscribers,
      groups: GROUP_LABELS
    });
  } catch (error) {
    console.error('Newsletter list error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 401 ? error.message : 'Nie udało się pobrać listy newslettera.'
    });
  }
};
