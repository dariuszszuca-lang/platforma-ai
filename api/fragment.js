// POST /api/fragment { email, consent, company(honeypot) }
// Lead magnet AI Act: wysyla darmowa checkliste na maila + notyfikuje wlasciciela o leadzie.
// Reuzywa helpery SES z newsletter-send.js. Zero Claude, zero zapisu do bazy (lead = mail do wlasciciela).
const lib = require("./newsletter-send.js");

const CHECKLIST_URL = "https://ai-team.pl/ai-act/checklista-ai-act.pdf";
const PRODUCT_URL = "https://ai-team.pl/ai-act";
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

function userHtml() {
  return `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2a44">
  <div style="max-width:560px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px">Cześć,</p>
    <p style="font-size:15px;line-height:1.6">dzięki, że sięgasz po temat AI Act. Oto Twoja darmowa <b>checklista zgodności</b> do wydruku. Przejdź ją krok po kroku, odhacz i masz podstawy w porządku.</p>
    <p style="margin:22px 0"><a href="${CHECKLIST_URL}" style="background:#2f6fed;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">Pobierz checklistę (PDF)</a></p>
    <p style="font-size:15px;line-height:1.6">Jeśli chcesz mieć całość ogarniętą w jeden wieczór, w pełnym pakiecie za 67 zł jest jeszcze przewodnik (12 sekcji, prostym językiem), gotowy rejestr narzędzi AI i wzór polityki dla zespołu z oświadczeniem do podpisu.</p>
    <p style="margin:18px 0"><a href="${PRODUCT_URL}" style="color:#2358c9;font-weight:700">Zobacz pełny pakiet →</a></p>
    <p style="font-size:13px;color:#69788f;line-height:1.5;margin-top:26px">To materiał edukacyjno-organizacyjny, nie porada prawna. Dostałeś tego maila, bo poprosiłeś o checklistę na ai-team.pl/ai-act. Nie chcesz więcej wiadomości? Po prostu nie odpisuj, nie dopisuję Cię do żadnej listy.</p>
    <p style="font-size:13px;color:#8a97ab">Dariusz Szuca &middot; ai-team.pl</p>
  </div></body></html>`;
}
function userText() {
  return `Cześć,\n\ndzięki za zainteresowanie tematem AI Act. Twoja darmowa checklista zgodności (PDF):\n${CHECKLIST_URL}\n\nChcesz całość w jeden wieczór? Pełny pakiet (67 zł) ma jeszcze przewodnik, rejestr narzędzi i wzór polityki:\n${PRODUCT_URL}\n\nMateriał edukacyjno-organizacyjny, nie porada prawna.\nDariusz Szuca, ai-team.pl`;
}

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    const body = lib.parseBody(req);
    if (body.company) return lib.sendJson(res, 200, { ok: true }); // honeypot
    const email = lib.cleanEmail(body.email);
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";
    if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
    if (rateLimited(clientIp(req))) return lib.sendJson(res, 429, { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj za parę minut." });
    if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
    if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, żeby dostać checklistę." });

    const aws = lib.getAwsConfig();
    // 1. checklista do zapisujacego sie
    await lib.sendSesEmail({
      from: process.env.SES_FROM, replyTo: process.env.SES_REPLY_TO || "",
      to: email, subject: "Twoja darmowa checklista AI Act",
      html: userHtml(), text: userText(), tags: { product: "ai_act_fragment", lead: "1" },
    }, aws);
    // 2. notyfikacja leada do wlasciciela
    await lib.sendSesEmail({
      from: process.env.SES_FROM, to: OWNER_EMAIL,
      subject: "Nowy lead: checklista AI Act",
      html: `<p>Nowy lead z fragmentu AI Act:</p><p style="font-size:16px"><b>${email}</b></p><p style="color:#69788f">Zapytał o darmową checklistę. Warto domknąć na pełny pakiet.</p>`,
      text: `Nowy lead AI Act (fragment): ${email}`,
      tags: { product: "ai_act_fragment", lead_admin: "1" },
    }, aws);

    return lib.sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("fragment error:", error && (error.message || error));
    return lib.sendJson(res, error.statusCode || 500, { ok: false, error: error.message || "Błąd. Spróbuj za chwilę." });
  }
};
