// Vercel Serverless Function - Lead magnet „Twój Pierwszy Agent AI"
// POST /api/agent-send { email, branza?, bol?, agent?, godziny_tydzien?, consent, company(honeypot) }
//   -> generuje spersonalizowaną specyfikację agenta (Claude) -> wysyła mailem (SES).
// Zapis na listę AI Radar robi FRONTEND (Firestore JS SDK, jak mapa-ai) — reguły dopuszczają zapis tylko z klienta.
// Reużywa sprawdzonych helperów SES z newsletter-send.js (ten sam produkcyjny SES co Mapa AI). Wzorzec: mapa-send.js.

const lib = require("./newsletter-send.js");

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

const AGENT_PROMPT = `Jesteś planistą wdrożeń AI w AI-Team (studio Darka Szucy: strony, systemy/CRM i automatyzacje dla małych firm). Właściciel małej firmy przeszedł konfigurator „Twój Pierwszy Agent AI" i wybrał jedno powtarzalne zadanie do oddania agentowi. Twoim zadaniem jest napisać dla NIEGO konkretną specyfikację tego agenta: co dokładnie robi u niego, czym to budujemy, ile trwa i od czego zacząć.

ZASADY PISANIA:
- Po polsku, prosto, jak do kolegi. Zero korpomowy. Zakazane słowa: innowacyjny, kompleksowy, holistyczny, synergia, dedykowany (jako ozdobnik), rewolucyjny, cutting-edge, leverage.
- ZERO myślników (długich i półpauz). Używaj kropek, przecinków, dwukropków.
- Pełne polskie znaki (ą ę ś ć ł ń ó ź ż).
- Pisz neutralnie płciowo. Unikaj form 2. osoby czasu przeszłego. Używaj czasu teraźniejszego i przyszłego, trybu rozkazującego albo form bezosobowych.
- Konkretnie pod TĘ firmę i TO zadanie. Bez ogólników.
- Nie zmyślaj liczb ani obietnic wyniku. Nie pisz „oszczędzisz 10 godzin" ani „zarobisz więcej". Mów jakościowo: mniej powtarzalnej roboty, nic nie ginie, szybsza odpowiedź klientowi.
- Ton: spokojny ekspert, który mówi „zrobiłbym to tak". Krótkie zdania.

KONTEKST AGENTÓW (wybór właściciela zdradza, o który chodzi):
- Agent Recepcja: odpowiada klientom od razu na powtarzalne pytania (strona, mail, czat), kwalifikuje i umawia.
- Agent Kalendarz: przyjmuje rezerwacje i zapisy, wysyła potwierdzenia i przypomnienia, obsługuje przełożenia.
- Agent Treści: planuje i pisze posty, opisy i newsletter w głosie firmy, do akceptacji.
- Agent Ofertowanie: składa spersonalizowane oferty i wyceny z cennika, w minuty.
- Agent Dokumenty: wyciąga dane z faktur i dokumentów, porządkuje i wpisuje do systemu.
- Agent Sprzedaż: zbiera leady w jedno miejsce, pilnuje follow-upu, podsuwa gotową treść odezwania.

OFERTA AI-TEAM (fakty, używaj tylko tych cen, wskaż naturalnie to, co pasuje):
- Strona z AI: od 1500 zł netto.
- Spersonalizowany CRM / Mini-System: 3900 zł brutto (promo, docelowo od 5900), wdrożenie 1-2 tygodnie.
- System OS / dedykowana aplikacja: 3000 do 12000 zł brutto, 2-3 miesiące.
- Zewnętrzny Dział AI: od 2500 zł/mies (abonament za zakres).
- Warsztaty AI: od 600 zł. Opieka miesięczna: 490 zł/mies.

Zwróć WYŁĄCZNIE poprawny JSON, bez komentarzy:
{"tytul":"...","wstep":"1-2 zdania osobiście pod tę firmę i to zadanie","co_robi":["...","...","..."],"jak_budujemy":"czym i jak to składamy, 1-2 zdania z realnymi narzędziami","ile_trwa":"realny zakres czasu wdrożenia","pierwszy_krok":"co właściciel przygotowuje na start","nastepny_krok":"jedno zdanie z CTA: 15 minut rozmowy albo bezpłatny Audyt Chaosu"}`;

// --- Zabezpieczenie publicznego endpointu (jak mapa-send) ---
const ALLOWED_HOSTS = ["ai-team.pl", "www.ai-team.pl"];
function originAllowed(req) {
  const src = req.headers.origin || req.headers.referer || "";
  if (!src) return false;
  try {
    const h = new URL(src).hostname;
    return ALLOWED_HOSTS.includes(h) || h.endsWith(".vercel.app") || h === "localhost";
  } catch {
    return false;
  }
}
function clientIp(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xff || String(req.headers["x-real-ip"] || "") || "unknown";
}
const RL_HITS = new Map();
const RL_MAX = 5;
const RL_WINDOW_MS = 10 * 60 * 1000;
function rateLimited(ip) {
  const now = Date.now();
  const hits = (RL_HITS.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) {
    RL_HITS.set(ip, hits);
    return true;
  }
  hits.push(now);
  RL_HITS.set(ip, hits);
  if (RL_HITS.size > 5000) RL_HITS.clear();
  return false;
}

const BRANZE = {
  nieruchomosci: "nieruchomości (biuro, agent, deweloper, wynajem)",
  ecommerce: "sklep internetowy / e-commerce",
  uslugi: "usługi lokalne (salon, gabinet, warsztat, gastronomia)",
  freelancer: "freelancer / agencja",
  inne: "mała firma",
};

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = lib.parseBody(req);

    // Honeypot
    if (body.company) return lib.sendJson(res, 200, { ok: true });

    // Admin-only (token): dryRun, testTo — chroni SES przed nadużyciem.
    const adminToken = process.env.NEWSLETTER_CRON_SECRET || process.env.CRON_SECRET || "";
    const isAdmin = adminToken && String(body.token || "") === adminToken;
    const dryRun = body.dryRun === true && isAdmin;
    const testTo = isAdmin ? lib.cleanEmail(body.testTo || "") : "";

    if (!isAdmin) {
      if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
      if (rateLimited(clientIp(req))) return lib.sendJson(res, 429, { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj za parę minut." });
    }

    const email = lib.cleanEmail(body.email);
    const branzaId = String(body.branza || "").trim().slice(0, 40);
    const agent = String(body.agent || "").trim().slice(0, 80) || "Agent AI";
    const bol = String(body.bol || "").trim().slice(0, 60);
    const godziny = Math.max(0, Math.min(80, parseInt(body.godziny_tydzien, 10) || 0));
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";

    if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
    if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, bez tego nie przygotuję specyfikacji." });

    const spec = await generateSpec({ branza: BRANZE[branzaId] || "mała firma", agent, bol, godziny });

    const html = renderEmail(spec, { agent });
    const text = renderText(spec, agent);
    const subject = `Twój ${agent}: jak go zbudować u Ciebie`;

    if (dryRun) {
      return lib.sendJson(res, 200, { ok: true, dryRun: true, spec, subject, html });
    }

    const aws = lib.getAwsConfig();
    await lib.sendSesEmail(
      {
        from: process.env.SES_FROM,
        replyTo: process.env.SES_REPLY_TO || "",
        to: testTo || email,
        subject,
        text,
        html,
        tags: { product: "agent_ai", lead: "1" },
      },
      aws
    );

    return lib.sendJson(res, 200, { ok: true, sent_to: testTo || email });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("agent-send error:", error && (error.message || error));
    return lib.sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Błąd. Spróbuj za chwilę." });
  }
};

async function generateSpec(inp) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Brak ANTHROPIC_API_KEY w Vercel.");

  const userText =
    "Wybór z konfiguratora:\n" +
    `Branża: ${inp.branza}\n` +
    `Wybrany agent: ${inp.agent}\n` +
    `Zadanie do oddania: ${inp.bol || "(nie podano)"}\n` +
    `Godziny tygodniowo na tym zadaniu: ${inp.godziny || "(nie podano)"}\n\n` +
    "Napisz specyfikację tego agenta w formacie JSON zgodnie z instrukcją.";

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1600,
      system: AGENT_PROMPT,
      messages: [{ role: "user", content: userText }],
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Anthropic ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseSpecJson(raw);
}

function parseSpecJson(textRaw) {
  let t = String(textRaw || "").trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(m, inp) {
  const agent = esc(inp.agent || "Agent AI");
  const zadania = (m.co_robi || [])
    .map(
      (x) => `
        <tr><td style="padding:11px 0;border-bottom:1px solid #efeae5;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" width="22" style="color:#ff7a1a;font-weight:bold;font-size:15px;line-height:1.4;">▸</td>
            <td valign="top" style="color:#44403c;font-size:14px;line-height:1.55;">${esc(x)}</td>
          </tr></table>
        </td></tr>`
    )
    .join("");

  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1ede9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ede9;">
<tr><td align="center" style="padding:26px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e1db;">
    <tr><td style="background:#0d0d0b;padding:20px 30px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#fffaf1;">AI <span style="color:#ff7a1a;">Team</span></span>
    </td></tr>
    <tr><td style="height:4px;background:#ff7a1a;line-height:4px;font-size:0;">&nbsp;</td></tr>
    <tr><td style="padding:32px 30px 4px;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#1c1917;">${esc(m.tytul || "Twój " + agent)}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#44403c;">${esc(m.wstep || "")}</p>
    </td></tr>
    <tr><td style="padding:22px 30px 0;">
      <p style="margin:0 0 2px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ff7a1a;font-weight:bold;">Co ${agent} robi za Ciebie</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${zadania}</table>
    </td></tr>
    <tr><td style="padding:20px 30px 0;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ff7a1a;font-weight:bold;">Czym to budujemy</p>
      <p style="margin:0 0 12px;color:#44403c;font-size:14px;line-height:1.55;">${esc(m.jak_budujemy || "")}</p>
      <p style="margin:0;color:#57534e;font-size:13.5px;line-height:1.55;"><b style="color:#1c1917;">Ile trwa:</b> ${esc(m.ile_trwa || "")}</p>
    </td></tr>
    <tr><td style="padding:22px 30px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff4ea;border:1px solid #ffd2ad;border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <div style="font-weight:bold;color:#1c1917;font-size:14px;margin-bottom:5px;">Twój pierwszy krok</div>
          <div style="color:#3d2a17;font-size:14px;line-height:1.55;">${esc(m.pierwszy_krok || "")}</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 30px 26px;">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1c1917;">${esc(m.nastepny_krok || "")}</p>
      <p style="margin:0;padding-top:18px;border-top:1px solid #efeae5;font-size:13px;line-height:1.6;color:#57534e;">Od teraz raz w tygodniu dostaniesz AI Radar: krótki mail o tym, co w AI naprawdę warto sprawdzić. Gdyby było za dużo, wypiszesz się jednym kliknięciem.</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#1c1917;">Do usłyszenia,<br><b>Darek</b><br><a href="https://ai-team.pl" style="color:#ff7a1a;text-decoration:none;">ai-team.pl</a></p>
    </td></tr>
    <tr><td style="background:#faf7f4;padding:16px 30px;font-size:11px;line-height:1.5;color:#9a8f86;">
      Dostajesz tę wiadomość, bo Twój adres trafił do nas przez konfigurator „Twój Pierwszy Agent AI" na ai-team.pl. Administrator danych: Dariusz Szuca. <a href="https://ai-team.pl/ai-radar-wypis.html" style="color:#9a8f86;">Wypisz się</a>.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function renderText(m, agent) {
  const lines = [];
  lines.push(String(m.tytul || "Twój " + agent));
  lines.push("");
  lines.push(String(m.wstep || ""));
  lines.push("");
  lines.push(`CO ${String(agent).toUpperCase()} ROBI ZA CIEBIE`);
  for (const x of m.co_robi || []) lines.push(`- ${x}`);
  lines.push("");
  lines.push("CZYM TO BUDUJEMY");
  lines.push(String(m.jak_budujemy || ""));
  lines.push(`Ile trwa: ${String(m.ile_trwa || "")}`);
  lines.push("");
  lines.push("TWÓJ PIERWSZY KROK");
  lines.push(String(m.pierwszy_krok || ""));
  lines.push("");
  lines.push(String(m.nastepny_krok || ""));
  lines.push("");
  lines.push("Od teraz raz w tygodniu dostaniesz AI Radar. Wypisać się możesz w każdej chwili.");
  lines.push("Darek, ai-team.pl");
  return lines.join("\n");
}
