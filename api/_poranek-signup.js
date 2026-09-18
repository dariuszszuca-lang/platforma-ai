const { createHash } = require('crypto');
const firestore = require('./_async-firestore');
const ALLOWED_ORIGINS = new Set(['https://ai-team.pl', 'https://www.ai-team.pl']);
const CONSENT_TEXT = 'Chcę otrzymać od AI-Team e-mail z informacją o pierwszym spotkaniu Poranki z AI.';

function createHandler(dependencies = {}) {
  const deps = { ...firestore, now: () => new Date().toISOString(), ...dependencies };
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    // The parent endpoint has broader CORS for its older forms.
    res.setHeader('Access-Control-Allow-Origin', 'https://ai-team.pl');
    if (!ALLOWED_ORIGINS.has(req.headers?.origin)) {
      return res.status(403).json({ ok: false, error: 'Otwórz formularz na ai-team.pl.' });
    }
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (JSON.stringify(body).length > 3000) return res.status(413).json({ ok: false, error: 'Formularz jest zbyt duży.' });
      if (body.website) return res.status(200).json({ ok: true });
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) {
        return res.status(400).json({ ok: false, error: 'Podaj poprawny adres e-mail.' });
      }
      if (body.consent !== true) return res.status(400).json({ ok: false, error: 'Zaznacz zgodę na wiadomość o spotkaniu.' });
      const id = `poranek_${createHash('sha256').update(email).digest('hex')}`;
      const path = `zlecenia/${id}`;
      const token = await deps.getServerFirestoreToken();
      const existing = await deps.getDoc(path, token);
      // Retry is idempotent; it neither reactivates a withdrawn consent nor overwrites an existing record.
      if (!existing) {
        const now = deps.now();
        await deps.setDoc(path, {
          id, email, source: 'poranek-ai', group: 'poranek-ai', case_type: 'event_interest',
          status: 'active', title: 'Poranki z AI — zainteresowanie pierwszym spotkaniem',
          page_url: 'https://ai-team.pl/poranek-ai',
          consent: { event_notification: true, newsletter: false, text: CONSENT_TEXT, version: '2026-09-18', at: now },
          created_at: now, updated_at: now,
        }, token);
      }
      return res.status(200).json({ ok: true });
    } catch {
      // No address, auth token or backend error detail in logs / public responses.
      return res.status(503).json({ ok: false, error: 'Nie udało się zapisać. Spróbuj ponownie za chwilę.' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
