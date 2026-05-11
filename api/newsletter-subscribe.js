const {
  GROUP_LABELS,
  cleanText,
  isEmail,
  kvCommand,
  normalizeEmail,
  normalizeGroup,
  safeJsonParse,
  setCors,
  subscriberId,
  subscriberKey
} = require('./newsletter-utils');

const CONSENT_FALLBACK = 'Zgoda na otrzymywanie newslettera AI Radar od Dariusza Szucy / AI-Team drogą elektroniczną.';

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona.' });
  }

  try {
    const body = req.body || {};

    if (body.company) {
      return res.status(200).json({ success: true });
    }

    const email = normalizeEmail(body.email);
    const name = cleanText(body.name, 80);
    const group = normalizeGroup(body.group);
    const consent = body.consent === true;

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Podaj poprawny adres email.' });
    }

    if (!consent) {
      return res.status(400).json({ success: false, error: 'Zgoda na newsletter jest wymagana.' });
    }

    const id = subscriberId(email);
    const key = subscriberKey(id);
    const now = new Date().toISOString();
    const existing = safeJsonParse(await kvCommand(['GET', key]));
    const groups = Array.from(new Set(['ai-radar', group]));

    const subscriber = {
      id,
      email,
      name,
      group,
      group_label: GROUP_LABELS[group],
      groups,
      status: 'active',
      source: cleanText(body.source, 80) || 'ai-radar',
      page_url: cleanText(body.pageUrl, 300),
      referrer: cleanText(body.referrer, 300),
      consent: {
        newsletter: true,
        text: cleanText(body.consentText, 300) || CONSENT_FALLBACK,
        accepted_at: now,
        privacy_url: 'https://ai-team.pl/privacy',
        privacy_version: '2026-05-11'
      },
      created_at: existing?.created_at || now,
      updated_at: now,
      last_signup_at: now
    };

    await kvCommand(['SET', key, JSON.stringify(subscriber)]);
    await kvCommand(['SADD', 'newsletter:subscribers', id]);
    await kvCommand(['SADD', `newsletter:group:${group}`, id]);
    await kvCommand(['SADD', 'newsletter:group:ai-radar', id]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ success: false, error: 'Nie udało się zapisać adresu. Spróbuj za chwilę.' });
  }
};
