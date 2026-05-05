// POST /api/stripe-webhook — Stripe → KV invitation + MailerLite welcome
const Stripe = require('stripe');
const { kv } = require('@vercel/kv');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing — Stripe webhook needs raw body
module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function sendMailerliteWelcome(email, invitationToken, productCode = 'tracker-p1') {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) return { skipped: 'no MAILERLITE_API_KEY' };

  // Dodaj subskrybenta + przypisz do grupy "tracker-buyers"
  try {
    const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        fields: {
          invitation_token: invitationToken,
          product_code: productCode,
          signup_url: `https://ai-team.pl/signup?invite=${invitationToken}`,
        },
        groups: ['tracker-buyers'], // utworzy grupę jeśli nie ma
      }),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    if (ENDPOINT_SECRET && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, ENDPOINT_SECRET);
    } else {
      // Fallback bez weryfikacji (tylko dev/MVP — produkcja musi mieć secret!)
      event = JSON.parse(rawBody.toString());
      console.warn('⚠️ Stripe webhook bez weryfikacji signature (brak STRIPE_WEBHOOK_SECRET)');
    }
  } catch (e) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${e.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();

    if (!email) {
      return res.status(200).json({ ignored: 'no email' });
    }

    // Sprawdź czy user już istnieje
    const existingUserId = await kv.get(`email:${email}`);

    if (existingUserId) {
      // Istniejący user — dodaj produkt do listy
      const user = await kv.get(`user:${existingUserId}`);
      const products = user.products || [];
      if (!products.includes('tracker-p1')) products.push('tracker-p1');
      user.products = products;
      await kv.set(`user:${existingUserId}`, user);
      return res.status(200).json({ ok: true, action: 'product-added', userId: existingUserId });
    }

    // Nowy user — utwórz invitation token (24h TTL)
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await kv.set(`invitation:${invitationToken}`, {
      email,
      products: ['tracker-p1'],
      stripeSessionId: session.id,
    }, { ex: 60 * 60 * 24 * 30 }); // 30 dni TTL

    // MailerLite welcome
    const ml = await sendMailerliteWelcome(email, invitationToken);

    return res.status(200).json({ ok: true, action: 'invitation-created', token: invitationToken, mailerlite: ml });
  }

  return res.status(200).json({ ignored: event.type });
};
