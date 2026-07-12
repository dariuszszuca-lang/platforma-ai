// Vercel Serverless Function - generator sprzedazowych opisow produktow (Allegro/sklep, PL, SEO)
// POST /api/opis-generuj { nazwa, kategoria, cechy, ton, pro? }
//   -> zwraca { tytul, opis_html, cechy[], frazy_seo[] } (JSON z Claude)
// Freemium: origin z ai-team.pl + limit na IP; klucz PRO (env OPISY_PRO_KEY) omija limit.
// Reuzywa ANTHROPIC_API_KEY z Vercel (ten sam projekt platforma-ai).

const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";
const FREE_LIMIT = Number(process.env.OPISY_FREE_LIMIT || 4);
const RL_WINDOW_MS = 24 * 60 * 60 * 1000;

const SYSTEM = `Jesteś ekspertem od sprzedażowych opisów produktów na Allegro i do sklepów internetowych w Polsce. Tworzysz opis, który SPRZEDAJE i jest zoptymalizowany pod SEO (naturalne frazy, których kupujący realnie szukają).

ZASADY:
- Po polsku, pełne znaki (ą ę ś ć ł ń ó ź ż). Naturalnie, jak dobry sprzedawca, nie jak robot.
- ZERO korpomowy i AI-słów: innowacyjny, kompleksowy, holistyczny, rewolucyjny, dedykowany (jako ozdobnik), synergiczny, cutting-edge.
- ZERO długich myślników (—). Kropki, przecinki, dwukropki.
- Pokazuj KORZYŚCI dla kupującego, nie tylko suche cechy. Buduj zaufanie i rozwiewaj wątpliwości.
- Konkret, nie ogólniki. NIE zmyślaj parametrów ani faktów, których użytkownik nie podał. Jeśli czegoś brak, nie wymyślaj liczb.
- Struktura czytelna: krótki chwytliwy wstęp, korzyści, wypunktowane najważniejsze cechy, krótkie zamknięcie zachęcające do zakupu.
- Tytuł oferty: do 80 znaków, z najważniejszą frazą kluczową na początku, konkretny (marka/model/typ + kluczowa cecha).
- Frazy SEO: 5-8 realnych fraz, których kupujący szukają dla tego produktu (long-tail, po polsku).

Zwróć WYŁĄCZNIE poprawny JSON, bez komentarzy i bez bloków kodu:
{"tytul":"...","opis_html":"opis w prostym HTML: <p>, <ul>, <li>, <b>. 150-300 słów, sprzedażowy","cechy":["Nazwa cechy: wartość", "..."],"frazy_seo":["fraza 1","fraza 2","..."]}`;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = parseBody(req);
    const nazwa = String(body.nazwa || "").trim().slice(0, 200);
    const kategoria = String(body.kategoria || "").trim().slice(0, 120);
    const cechy = String(body.cechy || "").trim().slice(0, 1500);
    const ton = String(body.ton || "").trim().slice(0, 60);

    if (!nazwa) return sendJson(res, 400, { ok: false, error: "Podaj nazwę produktu." });

    // PRO omija limit; wolne konto limitowane na IP + tylko z naszej strony.
    const proKey = process.env.OPISY_PRO_KEY || "";
    const isPro = proKey && String(body.pro || "") === proKey;
    if (!isPro) {
      if (!originAllowed(req)) return sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
      const left = rateLeft(clientIp(req));
      if (left <= 0) {
        return sendJson(res, 402, { ok: false, error: "limit", message: "Wykorzystałeś darmowe opisy na dziś. Odblokuj tryb hurtowy, żeby generować bez limitu." });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return sendJson(res, 500, { ok: false, error: "Brak ANTHROPIC_API_KEY w Vercel." });

    const userText =
      `Produkt: ${nazwa}\n` +
      (kategoria ? `Kategoria: ${kategoria}\n` : "") +
      (cechy ? `Cechy / parametry (od użytkownika, nie zmyślaj innych):\n${cechy}\n` : "") +
      (ton ? `Ton: ${ton}\n` : "") +
      `\nNapisz opis wg zasad i zwróć sam JSON.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM, messages: [{ role: "user", content: userText }] }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return sendJson(res, 502, { ok: false, error: `Anthropic ${resp.status}: ${JSON.stringify(data).slice(0, 200)}` });

    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const opis = parseJson(raw);
    if (!opis || !opis.opis_html) return sendJson(res, 502, { ok: false, error: "Model nie zwrócił poprawnego opisu. Spróbuj ponownie." });

    const remaining = isPro ? -1 : Math.max(0, rateLeft(clientIp(req), true));
    return sendJson(res, 200, { ok: true, pro: Boolean(isPro), remaining, ...opis });
  } catch (error) {
    console.error("opis-generuj error:", error && (error.message || error));
    return sendJson(res, 500, { ok: false, error: "Błąd generowania. Spróbuj za chwilę." });
  }
};

// --- limit na IP (in-memory; wystarczy na v1) ---
const RL = new Map();
function rateLeft(ip, consume) {
  const now = Date.now();
  const hits = (RL.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  const left = FREE_LIMIT - hits.length;
  if (consume && left > 0) {
    hits.push(now);
    RL.set(ip, hits);
    if (RL.size > 5000) RL.clear();
    return left - 1;
  }
  RL.set(ip, hits);
  return left;
}
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || String(req.headers["x-real-ip"] || "") || "unknown";
}
function originAllowed(req) {
  const src = req.headers.origin || req.headers.referer || "";
  if (!src) return false;
  try {
    const h = new URL(src).hostname;
    return ["ai-team.pl", "www.ai-team.pl", "localhost"].includes(h) || h.endsWith(".vercel.app");
  } catch { return false; }
}
function parseJson(t) {
  let s = String(t || "").trim();
  if (s.startsWith("```")) s = s.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch { return null; }
}
function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body;
}
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function sendJson(res, status, data) { return res.status(status).json(data); }
