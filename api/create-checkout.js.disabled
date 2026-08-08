// Vercel Serverless Function - Stripe Checkout
// Endpoint: POST /api/create-checkout

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

  const { plan, email } = req.body;

  if (!plan) {
    return res.status(400).json({ error: 'Brak planu' });
  }

  // Definicje produktów
  const products = {
    starter: {
      name: 'Prompt Generator - Starter',
      description: '50 generacji promptów AI',
      price: 1900, // 19.00 PLN w groszach
      mode: 'payment' // jednorazowa płatność
    },
    pro: {
      name: 'Prompt Generator - Pro',
      description: 'Nielimitowane generacje promptów AI',
      price: 2900, // 29.00 PLN w groszach
      mode: 'subscription' // miesięczna subskrypcja
    }
  };

  const product = products[plan];

  if (!product) {
    return res.status(400).json({ error: 'Nieznany plan' });
  }

  try {
    const sessionConfig = {
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
            ...(product.mode === 'subscription' && { recurring: { interval: 'month' } })
          },
          quantity: 1,
        },
      ],
      mode: product.mode,
      success_url: `${req.headers.origin || 'https://ai-team.pl'}/success.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${req.headers.origin || 'https://ai-team.pl'}/#tools`,
      metadata: {
        plan: plan,
        product: 'prompt-generator'
      }
    };

    // Dodaj email jeśli podany
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Błąd tworzenia płatności' });
  }
};
