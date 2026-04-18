// Vercel Serverless Function - Stripe Checkout for AI Consultation
// Endpoint: POST /api/checkout-konsultacja

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Brak adresu email' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: 'Konsultacja AI — 1h',
              description: 'Godzinna konsultacja z ekspertem AI. Omówimy Twoje potrzeby i zaplanujemy wdrożenie.',
            },
            unit_amount: 20000, // 200 PLN w groszach
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://ai-team.pl/zlecenie?konsultacja=success',
      cancel_url: 'https://ai-team.pl/zlecenie',
      customer_email: email,
      metadata: {
        product: 'konsultacja-ai',
        name: name || '',
      },
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Błąd tworzenia płatności' });
  }
};
