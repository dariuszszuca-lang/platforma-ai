// POST /api/audyt { name, email, phone, consent, company(honeypot) }
// Zgloszenie na Audyt AI Act: potwierdzenie do klienta + notyfikacja wlasciciela z danymi leada.
// Wzor: fragment.js (reuse helperow SES z newsletter-send.js). Zero zapisu do bazy.
const lib = require("./newsletter-send.js");

const PAGE_URL = "https://ai-team.pl/ai-act";
const OWNER_EMAIL = "dariusz.szuca@gmail.com";

const RL_HITS = new Map();
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
function clientIp(req) {
  return (String(req.headers["x-forwarded-for"] || "").split(",")[0].trim())
    || (req.socket && req.socket.remoteAddress) || "?";
}
function rateLimited(ip) {
  const now = Date.now();
  const hits = (RL_HITS.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) { RL_HITS.set(ip, hits); return true; }
  hits.push(now); RL_HITS.set(ip, hits);
  if (RL_HITS.size > 5000) RL_HITS.clear();
  return false;
}
function originAllowed(req) {
  const o = String(req.headers.origin || "");
  if (!o) return true;
  return o === "https://ai-team.pl" || o === "https://www.ai-team.pl"
    || /\.vercel\.app$/.test(o) || o.startsWith("http://localhost");
}
function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function userHtml(name) {
  const hello = name ? `Cześć ${esc(name)},` : "Cześć,";
  return `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2a44">
  <div style="max-width:560px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px">${hello}</p>
    <p style="font-size:15px;line-height:1.6">dostałem Twoje zgłoszenie na <b>Audyt AI Act</b>. Odezwę się najpóźniej w ciągu 24 godzin, żeby umówić termin rozmowy i zadać kilka krótkich pytań o narzędzia AI w Twojej firmie.</p>
    <p style="font-size:15px;line-height:1.6">Jak to dalej wygląda: ustalamy termin, przed rozmową odsyłasz mi odpowiedzi na 5 prostych pytań, rozmawiamy 60 do 90 minut, a po rozmowie dostajesz raport z konkretnym planem. Płatność (290 zł, cena promocyjna do 2 sierpnia) dopiero po ustaleniu terminu.</p>
    <p style="font-size:13px;color:#69788f;line-height:1.5;margin-top:26px">Audyt ma charakter edukacyjno-organizacyjny, nie stanowi porady prawnej. Dostałeś tego maila, bo zgłosiłeś się przez ${PAGE_URL}.</p>
    <p style="font-size:13px;color:#8a97ab">Dariusz Szuca &middot; ai-team.pl</p>
  </div></body></html>`;
}
function userText(name) {
  const hello = name ? `Cześć ${name},` : "Cześć,";
  return `${hello}\n\ndostałem Twoje zgłoszenie na Audyt AI Act. Odezwę się w ciągu 24 godzin, żeby umówić termin i zadać kilka pytań o narzędzia AI w Twojej firmie.\n\nDalej: termin, 5 krótkich pytań przed rozmową, rozmowa 60-90 minut, raport z planem. Płatność (290 zł promo do 2 sierpnia) po ustaleniu terminu.\n\nAudyt ma charakter edukacyjno-organizacyjny, nie stanowi porady prawnej.\nDariusz Szuca, ai-team.pl`;
}

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    const body = lib.parseBody(req);
    if (body.company) return lib.sendJson(res, 200, { ok: true }); // honeypot
    const email = lib.cleanEmail(body.email);
    const name = String(body.name || "").trim().slice(0, 80);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";
    if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
    if (rateLimited(clientIp(req))) return lib.sendJson(res, 429, { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj za parę minut." });
    if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
    if (!phone || phone.replace(/\D/g, "").length < 7) return lib.sendJson(res, 400, { ok: false, error: "Podaj numer telefonu, żebym mógł się odezwać." });
    if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę na kontakt w sprawie audytu." });

    const aws = lib.getAwsConfig();
    // 1. potwierdzenie do zglaszajacego
    await lib.sendSesEmail({
      from: process.env.SES_FROM, replyTo: process.env.SES_REPLY_TO || "",
      to: email, subject: "Zgłoszenie na Audyt AI Act przyjęte",
      html: userHtml(name), text: userText(name), tags: { product: "ai_act_audyt", lead: "1" },
    }, aws);
    // 2. notyfikacja leada do wlasciciela
    await lib.sendSesEmail({
      from: process.env.SES_FROM, to: OWNER_EMAIL,
      subject: "AUDYT AI ACT: nowe zgłoszenie",
      html: `<p>Nowe zgłoszenie na audyt AI Act:</p>
<p style="font-size:16px"><b>${esc(name) || "(bez imienia)"}</b><br>${esc(email)}<br>${esc(phone)}</p>
<p style="color:#69788f">Następny krok: kontakt do 24 h, 5 pytań kwalifikacyjnych, termin, link do płatności 290 zł.</p>`,
      text: `Nowe zgłoszenie audyt AI Act:\n${name || "(bez imienia)"}\n${email}\n${phone}\n\nKontakt do 24 h, 5 pytań, termin, płatność 290 zł.`,
      tags: { product: "ai_act_audyt", lead_admin: "1" },
    }, aws);

    return lib.sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("audyt error:", error && (error.message || error));
    return lib.sendJson(res, error.statusCode || 500, { ok: false, error: error.message || "Błąd. Spróbuj za chwilę." });
  }
};
