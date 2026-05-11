const {
  GROUP_LABELS,
  kvCommand,
  normalizeGroup,
  normalizeStatus,
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona.' });
  }

  try {
    await requireAdmin(req);

    const body = req.body || {};
    const id = String(body.id || '').trim();

    if (!id) {
      return res.status(400).json({ success: false, error: 'Brak identyfikatora kontaktu.' });
    }

    const key = subscriberKey(id);
    const existing = safeJsonParse(await kvCommand(['GET', key]));

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono kontaktu.' });
    }

    const previousGroup = existing.group || 'ai-radar';
    const group = body.group ? normalizeGroup(body.group) : previousGroup;
    const status = body.status ? normalizeStatus(body.status) : (existing.status || 'active');
    const groups = Array.from(new Set([...(existing.groups || []), 'ai-radar', group]));

    const updated = {
      ...existing,
      group,
      group_label: GROUP_LABELS[group],
      groups,
      status,
      updated_at: new Date().toISOString()
    };

    await kvCommand(['SET', key, JSON.stringify(updated)]);

    if (previousGroup !== group) {
      await kvCommand(['SREM', `newsletter:group:${previousGroup}`, id]);
      await kvCommand(['SADD', `newsletter:group:${group}`, id]);
    }

    return res.status(200).json({ success: true, subscriber: updated });
  } catch (error) {
    console.error('Newsletter update error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 401 ? error.message : 'Nie udało się zaktualizować kontaktu.'
    });
  }
};
