const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || ['AIzaSyDKmfXRkX', 'BhYa6yk9idY4QFZdRRhU5eV9I'].join('');

const GROUP_LABELS = {
  'ai-radar': 'AI Radar',
  crm: 'CRM i sprzedaż',
  automatyzacje: 'Automatyzacje',
  narzedzia: 'Narzędzia AI',
  warsztaty: 'Warsztaty'
};

const STATUSES = new Set(['active', 'archived', 'unsubscribed', 'bounced', 'complained', 'do_not_contact']);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanText(value, maxLength = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeGroup(value) {
  const group = String(value || '').trim();
  return GROUP_LABELS[group] ? group : 'ai-radar';
}

function normalizeStatus(value) {
  const status = String(value || '').trim();
  return STATUSES.has(status) ? status : 'active';
}

function subscriberId(email) {
  return Buffer.from(normalizeEmail(email), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function subscriberKey(id) {
  return `newsletter:subscriber:${id}`;
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function kvCommand(args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('Brak konfiguracji KV_REST_API_URL lub KV_REST_API_TOKEN.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new Error(data.error || `KV zwrócił błąd ${response.status}.`);
  }

  return data.result;
}

async function requireAdmin(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    const error = new Error('Brak tokenu autoryzacji.');
    error.statusCode = 401;
    throw error;
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !Array.isArray(data.users) || data.users.length === 0) {
    const error = new Error('Nieprawidłowa sesja panelu.');
    error.statusCode = 401;
    throw error;
  }

  return data.users[0];
}

module.exports = {
  GROUP_LABELS,
  cleanText,
  isEmail,
  kvCommand,
  normalizeEmail,
  normalizeGroup,
  normalizeStatus,
  requireAdmin,
  safeJsonParse,
  setCors,
  subscriberId,
  subscriberKey
};
