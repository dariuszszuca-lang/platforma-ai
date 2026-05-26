const { randomBytes } = require("crypto");
const { getServerFirestoreToken, publicError, setDoc } = require("./_async-firestore");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = parseBody(req);
    if (clean(body.website)) return sendJson(res, 200, { ok: true, skipped: true });

    const input = normalizeInput(body);
    validateInput(input);

    const now = new Date().toISOString();
    const id = `async_${Date.now()}_${randomBytes(3).toString("hex")}`;
    const publicKey = randomBytes(16).toString("hex");
    const publicUrl = `https://ai-team.pl/async-sprawa?id=${encodeURIComponent(id)}&key=${encodeURIComponent(publicKey)}`;
    const agentBrief = buildAgentBrief(input);

    const doc = {
      id,
      case_type: "async",
      source: "async-platform",
      status: "new",
      priority: pickPriority(input),
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      category: input.category,
      urgency: input.urgency,
      title: input.title,
      goal: input.goal,
      context: input.context,
      links: input.links,
      budget: input.budget,
      consent: true,
      page_url: input.page_url,
      referrer: input.referrer,
      utm: input.utm,
      agent_brief: agentBrief,
      public_key: publicKey,
      public_url: publicUrl,
      response_text: "",
      response_url: "",
      internal_notes: "",
      created_at: now,
      updated_at: now,
    };

    const token = await getServerFirestoreToken();
    await setDoc(`zlecenia/${id}`, doc, token);
    await notifyTelegram(doc).catch((error) => console.warn("Async Telegram notify failed:", error.message));

    return sendJson(res, 200, {
      ok: true,
      id,
      status: doc.status,
      publicUrl,
      agentBrief,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("async-submit error:", safeError(error));
    return sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Błąd zapisu zgłoszenia." });
  }
};

function normalizeInput(body) {
  return {
    name: clean(body.name).slice(0, 120),
    email: cleanEmail(body.email),
    phone: clean(body.phone).slice(0, 60),
    company: clean(body.company).slice(0, 140),
    category: clean(body.category || "inne").slice(0, 60),
    urgency: clean(body.urgency || "48h").slice(0, 40),
    title: clean(body.title).slice(0, 180),
    goal: clean(body.goal).slice(0, 600),
    context: clean(body.context).slice(0, 7000),
    links: normalizeLinks(body.links),
    budget: clean(body.budget).slice(0, 80),
    page_url: clean(body.page_url).slice(0, 500),
    referrer: clean(body.referrer).slice(0, 500),
    utm: normalizeUtm(body.utm || {}),
  };
}

function validateInput(input) {
  if (!input.name) throw publicError(400, "Podaj imię albo nazwę firmy.");
  if (!input.email || !input.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw publicError(400, "Podaj poprawny email.");
  if (!input.title) throw publicError(400, "Podaj temat sprawy.");
  if (input.context.length < 40) throw publicError(400, "Opisz sprawę trochę dokładniej. Minimum 40 znaków.");
}

function buildAgentBrief(input) {
  const category = categoryLabel(input.category);
  const missing = [];
  if (!input.links.length) missing.push("brak linków, screenów lub plików źródłowych");
  if (!input.goal) missing.push("brak jasno opisanego efektu końcowego");
  if (!input.budget) missing.push("brak informacji o budżecie lub skali");
  if (!input.phone) missing.push("brak telefonu, odpowiedź tylko mailowo");

  const recommendedMode = {
    meta_ads: "audit + checklista kampanii",
    landing: "analiza strony + plan poprawek",
    ai_system: "mapa procesu + rekomendacja pierwszego wdrożenia",
    crm: "mini-audyt procesu + zakres MVP",
    content: "diagnostyka tonu i rytmu publikacji",
    decision: "warianty decyzji + ryzyka",
    inne: "krótka diagnoza + pytania doprecyzowujące",
  }[input.category] || "krótka diagnoza + pytania doprecyzowujące";

  return [
    `Kategoria: ${category}`,
    `Tryb odpowiedzi: ${recommendedMode}`,
    `Priorytet: ${pickPriority(input)}`,
    `Temat: ${input.title}`,
    input.goal ? `Cel klienta: ${input.goal}` : "Cel klienta: do doprecyzowania",
    `Kontekst: ${input.context}`,
    input.links.length ? `Materiały: ${input.links.join(", ")}` : "Materiały: brak",
    missing.length ? `Dopytać o: ${missing.join("; ")}.` : "Dopytać o: tylko jeśli odpowiedź wymaga liczb lub dostępu.",
  ].join("\n\n");
}

function pickPriority(input) {
  if (input.urgency === "today") return "high";
  if (input.urgency === "week") return "normal";
  return "medium";
}

async function notifyTelegram(doc) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const message = [
    `NOWY TEMAT ASYNC: ${doc.id}`,
    "",
    `Klient: ${doc.name}`,
    `Email: ${doc.email}`,
    `Firma: ${doc.company || "nie podano"}`,
    `Kategoria: ${categoryLabel(doc.category)}`,
    `Pilność: ${urgencyLabel(doc.urgency)}`,
    `Temat: ${doc.title}`,
    "",
    `Panel: https://ai-team.pl/panel`,
    `Link klienta: ${doc.public_url}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  if (!response.ok) throw new Error(`Telegram ${response.status}: ${await response.text()}`);
}

function normalizeLinks(value) {
  const raw = Array.isArray(value) ? value.join("\n") : clean(value);
  return raw
    .split(/\s+|\n|,/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item))
    .slice(0, 12);
}

function normalizeUtm(utm) {
  return {
    source: clean(utm.source || utm.utm_source).slice(0, 80),
    medium: clean(utm.medium || utm.utm_medium).slice(0, 80),
    campaign: clean(utm.campaign || utm.utm_campaign).slice(0, 120),
    content: clean(utm.content || utm.utm_content).slice(0, 120),
    term: clean(utm.term || utm.utm_term).slice(0, 120),
  };
}

function categoryLabel(value) {
  return {
    meta_ads: "Meta Ads",
    landing: "Strona / landing",
    ai_system: "AI w firmie",
    crm: "CRM / mini-system",
    content: "Content / newsletter",
    decision: "Decyzja biznesowa",
    inne: "Inne",
  }[value] || value || "Inne";
}

function urgencyLabel(value) {
  return {
    today: "dzisiaj",
    "48h": "24-48h",
    week: "w tym tygodniu",
  }[value] || value || "24-48h";
}

function clean(value) {
  return String(value || "").trim().replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ");
}

function cleanEmail(email) {
  return clean(email).toLowerCase();
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function safeError(error) {
  return {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  };
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}
