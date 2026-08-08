// api/ai-act-webhook.js — fulfillment AI Act.
// Po opłaconym zakupie (Stripe checkout.session.completed) wysyła klientowi mail
// z linkiem do pakietu przez SES. Reużywa sendSesEmail z newsletter-send.js.
// Weryfikacja podpisu Stripe wymaga RAW body -> bodyParser wyłączony.

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendSesEmail, getAwsConfig } = require("./newsletter-send.js");
const {
  buildPurchaseEvent,
  isAiActPurchase,
  sendCapiPurchase,
  shouldProcessStripeEvent,
} = require("./_ai-act-purchase.js");

const PAKIET_URL = "https://ai-team.pl/ai-act/dziekujemy";

// Pozostałe produkty cyfrowe (strona /produkty). Dopasowanie ZAWSZE po payment_link
// + kwocie, nigdy po samej kwocie. CAPI (Meta) tylko dla AI Act.
const NEW_PRODUCTS = {
  plink_1U29jzC5TxNbsygYkcf1cKl9: {
    slug: "audyt-ai", amount: 29000,
    subject: "Audyt AI: pierwszy krok",
    body: "dziękuję za opłacenie audytu AI. Jeśli termin rozmowy już ustaliliśmy, do usłyszenia. Jeśli jeszcze nie, odpisz proszę z dwoma terminami, które Ci pasują, potwierdzę do 24 godzin. Raport z planem dostaniesz do 2 dni roboczych po rozmowie.",
  },
};

module.exports.config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function maskEmail(e) {
  return String(e || "").replace(/(.{2}).*(@.*)/, "$1***$2");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET_AIACT;
  if (!secret) {
    console.error("[ai-act-webhook] brak STRIPE_WEBHOOK_SECRET_AIACT");
    return res.status(500).json({ error: "not configured" });
  }

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], secret);
  } catch (err) {
    console.error("[ai-act-webhook] zła sygnatura:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supportedEvent = event.type === "checkout.session.completed"
    || event.type === "checkout.session.async_payment_succeeded";
  if (!supportedEvent) {
    return res.status(200).json({ ignored: event.type });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") {
    return res.status(200).json({ ignored: "not paid" });
  }
  // Pozostałe produkty cyfrowe: mail powitalny po zakupie, bez CAPI.
  const newProduct = NEW_PRODUCTS[session.payment_link];
  if (newProduct && session.amount_total === newProduct.amount && session.currency === "pln") {
    const email2 = (session.customer_details && session.customer_details.email) || session.customer_email;
    if (!email2) {
      console.error("[produkty-webhook] brak e-maila w sesji", session.id);
      return res.status(200).json({ ignored: "no email" });
    }
    const html2 = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;"><p>Dzień dobry,</p><p>${newProduct.bodyHtml || newProduct.body}</p><p>Potrzebujesz rachunku? Daj znać, przygotuję i odeślę.</p><p>Pozdrawiam,<br>Darek<br>AI-Team.pl</p></div>`;
    const text2 = `Dzień dobry,\n\n${newProduct.body}\n\nPotrzebujesz rachunku? Daj znać.\n\nPozdrawiam,\nDarek\nAI-Team.pl`;
    try {
      const aws = getAwsConfig();
      await sendSesEmail(
        {
          from: process.env.SES_FROM,
          replyTo: process.env.SES_REPLY_TO || "",
          to: email2,
          subject: newProduct.subject,
          text: text2,
          html: html2,
          tags: { product: newProduct.slug, fulfillment: "1" },
        },
        aws
      );
      console.log("[produkty-webhook]", newProduct.slug, "mail wysłany do", maskEmail(email2), "sesja", session.id);
      return res.status(200).json({ ok: true, product: newProduct.slug });
    } catch (e) {
      console.error("[produkty-webhook] błąd SES:", e.message);
      return res.status(500).json({ error: "send failed" });
    }
  }

  // Konto Stripe ma kilka produktów. Sama kwota nigdy nie identyfikuje produktu.
  if (!isAiActPurchase(session) || !shouldProcessStripeEvent(event)) {
    return res.status(200).json({ ignored: "other product" });
  }

  const email = (session.customer_details && session.customer_details.email) || session.customer_email;
  if (!email) {
    console.error("[ai-act-webhook] brak e-maila w sesji", session.id);
    return res.status(200).json({ ignored: "no email" });
  }

  try {
    const capiResult = await sendCapiPurchase(buildPurchaseEvent({
      session,
      email,
      eventTime: event.created,
    }));
    if (capiResult.skipped) {
      console.warn("[ai-act-webhook] CAPI pominięte: brak konfiguracji");
    } else {
      console.log(
        "[ai-act-webhook] CAPI Purchase",
        capiResult.eventsReceived,
        capiResult.traceId || "bez-trace-id",
      );
    }
  } catch (error) {
    console.error("[ai-act-webhook] błąd CAPI:", error.message);
    // 500 -> Stripe ponowi webhook; event_id pozostanie ten sam i Meta zdeduplikuje zdarzenie.
    return res.status(500).json({ error: "capi failed" });
  }

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;">
<p>Dzień dobry,</p>
<p>dziękuję za zakup pakietu „AI Act dla małej firmy". Pakiet pobierzesz z tej strony (w środku cztery pliki):</p>
<p><a href="${PAKIET_URL}" style="color:#c8102e;font-weight:bold;text-decoration:none;">${PAKIET_URL}</a></p>
<p>Wystarczy kliknąć „Pobierz pakiet". To materiał edukacyjno-organizacyjny, który pomoże uporządkować temat AI Act w firmie. Gdyby coś nie działało albo pojawiły się pytania, po prostu odpisz na tego maila.</p>
<p>Gdybyś potrzebował(a) rachunku, daj znać — przygotuję i odeślę.</p>
<p>Pozdrawiam,<br>Darek<br>AI-Team.pl</p></div>`;

  const text = `Dzień dobry,

dziękuję za zakup pakietu „AI Act dla małej firmy". Pakiet pobierzesz z tej strony (w środku cztery pliki):
${PAKIET_URL}

Wystarczy kliknąć „Pobierz pakiet". Gdyby coś nie działało albo pojawiły się pytania, po prostu odpisz na tego maila. Potrzebujesz rachunku? Daj znać.

Pozdrawiam,
Darek
AI-Team.pl`;

  try {
    const aws = getAwsConfig();
    await sendSesEmail(
      {
        from: process.env.SES_FROM,
        replyTo: process.env.SES_REPLY_TO || "",
        to: email,
        subject: "Twój pakiet AI Act — do pobrania",
        text,
        html,
        tags: { product: "ai-act", fulfillment: "1" },
      },
      aws
    );
    console.log("[ai-act-webhook] pakiet wysłany do", maskEmail(email), "sesja", session.id);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[ai-act-webhook] błąd SES:", e.message);
    // 500 -> Stripe ponowi webhook (retry), klient dostanie mail przy kolejnej próbie
    return res.status(500).json({ error: "send failed" });
  }
};
