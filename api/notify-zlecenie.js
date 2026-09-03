// Vercel Serverless Function - powiadomienie o nowym zleceniu (brief z /zlecenie)
// POST /api/notify-zlecenie { name, email, phone?, category|type, description|brief, budget?, timeline?, company(honeypot), token? }
// GET  /api/notify-zlecenie?token=1 -> { token } (podpisany znacznik czasu; formularz pobiera go przy pierwszym dotknieciu pola)
// Dwa kanaly dostarczenia (lead nie ginie): Telegram (jesli env) + email SES (reuzywa newsletter-send.js).
// Sukces gdy zadzialal co najmniej jeden kanal. Tresc maila = dane leada (PII) -> tylko do skrzynki wlasciciela.
//
// ANTY-SPAM (od 03.09.2026, po fali botow z USA: +1, opis po angielsku, pierwsza opcja w kazdym select):
// 1. honeypot `company` (bylo), 2. Origin/Referer (bylo), 3. punktacja spamScore() -> >= SPAM_DROP = ciche "ok" bez wysylki,
// 4. token czasu (HMAC, min. 4 s od pobrania do wysylki), 5. Cloudflare Turnstile, gdy ustawiony TURNSTILE_SECRET_KEY (na razie brak).

const crypto = require("crypto");
const lib = require("./newsletter-send.js");

const SPAM_DROP = 3; // >= 3 punkty: bot dostaje ok:true, nic nie wysylamy
const SPAM_FLAG = 2; // 2 punkty: wysylamy, temat z dopiskiem [?spam]
const TOKEN_MIN_AGE_MS = 4000;
const TOKEN_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const PL_LETTERS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
// Bez "i" i "to": zderzaja sie z angielskim "I" / "to" (spam 03.09 przeszedl na tym).
const PL_WORDS = /(^|[^a-ząćęłńóśźż])(nie|na|do|jest|się|sie|z|w|o|dla|oraz|czy|jak|mam|chcę|chce|potrzebuję|potrzebuje|firma|firmy|firmę|firme|strona|strony|stronę|strone|proszę|prosze|dzień|dzien|dobry|witam|pozdrawiam)([^a-ząćęłńóśźż]|$)/i;
const EN_WORDS = /(^|[^a-z])(the|and|but|with|it|got|my|you|your|is|are|of|this|that|have|was|all|over)([^a-z]|$)/i;

function tokenSecret() {
  return process.env.ZLECENIE_TOKEN_SECRET || process.env.CRON_SECRET || "";
}
function makeToken() {
  const secret = tokenSecret();
  if (!secret) return "";
  const ts = String(Date.now());
  const sig = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 32);
  return `${ts}.${sig}`;
}
// Zwraca: "ok" | "missing" | "invalid" | "young" | "old" | "off" (brak sekretu, warstwa wylaczona)
function checkToken(token) {
  const secret = tokenSecret();
  if (!secret) return "off";
  const t = String(token || "");
  if (!t) return "missing";
  const [ts, sig] = t.split(".");
  if (!ts || !sig || !/^\d{10,16}$/.test(ts)) return "invalid";
  const expect = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 32);
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return "invalid";
  const age = Date.now() - Number(ts);
  if (age < TOKEN_MIN_AGE_MS) return "young";
  if (age > TOKEN_MAX_AGE_MS) return "old";
  return "ok";
}

// Punktacja: 0 = czlowiek z Polski, >= SPAM_DROP = bot. Zwraca { score, reasons }.
function spamScore({ name, email, phone, category, description, budget, timeline, tokenState }) {
  let score = 0;
  const reasons = [];
  const digits = String(phone || "").replace(/\D/g, "");
  const p = String(phone || "").trim();
  if (digits) {
    const isPl = digits.length === 9 || (digits.length === 11 && digits.startsWith("48")) || /^0048\d{9}$/.test(digits);
    if (!isPl) { score += 2; reasons.push("telefon-nie-pl"); }
    else if (p.startsWith("+") && !p.startsWith("+48")) { score += 2; reasons.push("kierunkowy-nie-48"); }
  }
  const local = String(email || "").split("@")[0] || "";
  if (/\d{5,}$/.test(local)) { score += 1; reasons.push("mail-ogon-cyfr"); }
  const d = String(description || "");
  const words = d.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 3 && !PL_LETTERS.test(d) && !PL_WORDS.test(d) && EN_WORDS.test(d)) { score += 2; reasons.push("opis-angielski"); }
  if (!PL_LETTERS.test(String(name || "")) && !PL_WORDS.test(d) && !PL_LETTERS.test(d) && words < 3) { score += 1; reasons.push("opis-pusty-bez-pl"); }
  if (category === "os" && budget === "<1k" && timeline === "asap") { score += 1; reasons.push("pierwsze-opcje"); }
  if (tokenState === "missing") { score += 1; reasons.push("token-brak"); }
  else if (tokenState === "invalid" || tokenState === "young") { score += 2; reasons.push("token-" + tokenState); }
  return { score, reasons };
}

async function turnstileOk(req, body) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // warstwa wylaczona, dopoki nie ma klucza w Vercel
  const response = String(body.turnstileToken || "");
  if (!response) return false;
  try {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response, remoteip: ip }).toString(),
    });
    const j = await r.json().catch(() => ({}));
    return Boolean(j && j.success);
  } catch {
    return false;
  }
}

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

const CATEGORY_LABELS = {
  os: "System OS / dedykowana aplikacja", crm: "Mini-System / CRM",
  strona: "Strona z AI", opieka: "Opieka po wdrożeniu", audyt: "Audyt AI firmy",
  sprint: "Sprint Automatyzacji", retainer: "Zewnętrzny Dział AI", inne: "Inne / nie wiem",
  konsultacja: "Konsultacja AI", kontakt: "Wiadomość z /kontakt", automatyzacja: "Automatyzacja procesu", narzedzie: "Narzędzie / Aplikacja", wdrozenie: "Wdrożenie AI",
};
const BUDGET_LABELS = { "<1k": "Do 1 000 zł", "1-3k": "1 000-3 000 zł", "3-10k": "3 000-10 000 zł", "10-25k": "10 000-25 000 zł", ">25k": "Powyżej 25 000 zł", "nie-wiem": "Czeka na wycenę" };
const TIMELINE_LABELS = { asap: "ASAP (w tym tygodniu)", "2tyg": "W ciągu 2 tygodni", miesiac: "W ciągu miesiąca", rozglada: "Rozgląda się / planuje" };

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    // Token czasu dla formularza. Bez sekretu zwracamy pusty token (warstwa wylaczona).
    res.setHeader("Cache-Control", "no-store");
    return lib.sendJson(res, 200, { ok: true, token: makeToken() });
  }
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = lib.parseBody(req);

    // Honeypot: bot wypelnil ukryte pole -> udajemy sukces.
    if (body.company) return lib.sendJson(res, 200, { ok: true });
    if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
    if (!(await turnstileOk(req, body))) return lib.sendJson(res, 403, { ok: false, error: "Nie przeszło sprawdzenie antyspamowe. Odśwież stronę i spróbuj ponownie." });

    const name = String(body.name || "").trim().slice(0, 120);
    const email = lib.cleanEmail(body.email);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const category = String(body.category || body.type || "").trim().slice(0, 60);
    const description = String(body.description || body.brief || "").trim().slice(0, 4000);
    const budget = String(body.budget || "").trim().slice(0, 40);
    const timeline = String(body.timeline || "").trim().slice(0, 40);
    const source = String(body.source || "zlecenie").replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "zlecenie";

    if (!name || !email || !description) {
      return lib.sendJson(res, 400, { ok: false, error: "Brakuje pól: imię, email i opis projektu." });
    }

    const tokenState = checkToken(body.token);
    const spam = spamScore({ name, email, phone, category, description, budget, timeline, tokenState });
    if (spam.score >= SPAM_DROP) {
      // Cicha blokada: bot widzi sukces, my nie dostajemy maila. W logu tylko powody i domena (bez PII).
      console.log("notify-zlecenie: spam-drop", JSON.stringify({ score: spam.score, reasons: spam.reasons, source, domain: email.split("@")[1] || "" }));
      return lib.sendJson(res, 200, { ok: true });
    }

    const catLabel = CATEGORY_LABELS[category] || category || "Nie określono";
    const budgetLabel = BUDGET_LABELS[budget] || budget || "—";
    const timelineLabel = TIMELINE_LABELS[timeline] || timeline || "—";
    const flag = spam.score >= SPAM_FLAG ? "[?spam] " : "";
    const subject = flag + (source === "kontakt" ? `Nowa wiadomość z /kontakt: ${name}` : `Nowe zlecenie: ${name} (${catLabel})`);

    const delivered = [];
    const errors = [];

    // --- Kanal 1: Telegram (jesli skonfigurowany) ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        let msg = `🔔 ${source === "kontakt" ? "NOWA WIADOMOŚĆ /kontakt" : "NOWE ZLECENIE"}\n\n👤 ${name}\n📧 ${email}\n📞 ${phone || "nie podano"}\n📂 ${catLabel}\n💰 ${budgetLabel}\n⏱ ${timelineLabel}\n\n📝 ${description.slice(0, 600)}`;
        const tg = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: msg }),
        });
        if (tg.ok) delivered.push("telegram");
        else errors.push("telegram:" + tg.status);
      } catch (e) {
        errors.push("telegram:" + (e.message || "err"));
      }
    }

    // --- Kanal 2: email SES (reuzywa produkcyjnego SES z newsletter-send) ---
    const notifyTo = process.env.ZLECENIE_NOTIFY_TO || process.env.SES_REPLY_TO || process.env.SES_FROM;
    if (process.env.SES_FROM && notifyTo) {
      try {
        const text = `Nowe zgłoszenie z /${source}\n\nImie: ${name}\nEmail: ${email}\nTelefon: ${phone || "nie podano"}\nKategoria: ${catLabel}\nBudzet: ${budgetLabel}\nTermin: ${timelineLabel}\n\nOpis:\n${description}`;
        const html = `<h2 style="font-family:Arial">Nowe zgłoszenie z /${esc(source)}</h2>
<table style="font-family:Arial;font-size:14px;border-collapse:collapse">
<tr><td style="padding:4px 10px;color:#777">Imię</td><td style="padding:4px 10px"><b>${esc(name)}</b></td></tr>
<tr><td style="padding:4px 10px;color:#777">Email</td><td style="padding:4px 10px"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
<tr><td style="padding:4px 10px;color:#777">Telefon</td><td style="padding:4px 10px">${esc(phone || "nie podano")}</td></tr>
<tr><td style="padding:4px 10px;color:#777">Kategoria</td><td style="padding:4px 10px">${esc(catLabel)}</td></tr>
<tr><td style="padding:4px 10px;color:#777">Budżet</td><td style="padding:4px 10px">${esc(budgetLabel)}</td></tr>
<tr><td style="padding:4px 10px;color:#777">Termin</td><td style="padding:4px 10px">${esc(timelineLabel)}</td></tr>
</table>
<p style="font-family:Arial;font-size:14px"><b>Opis:</b><br>${esc(description).replace(/\n/g, "<br>")}</p>`;
        const aws = lib.getAwsConfig();
        await lib.sendSesEmail(
          { from: process.env.SES_FROM, replyTo: email, to: notifyTo, subject, text, html, tags: { product: "zlecenie", lead: "1" } },
          aws
        );
        delivered.push("email");
      } catch (e) {
        errors.push("email:" + (e.message || "err"));
      }
    }

    if (delivered.length) {
      return lib.sendJson(res, 200, { ok: true, via: delivered });
    }
    console.error("notify-zlecenie: brak kanalu dostarczenia", errors);
    return lib.sendJson(res, 500, { ok: false, error: "Nie udało się wysłać briefu. Zadzwoń 730 600 383 albo napisz na WhatsApp." });
  } catch (error) {
    console.error("notify-zlecenie error:", error && (error.message || error));
    return lib.sendJson(res, 500, { ok: false, error: "Błąd serwera. Zadzwoń 730 600 383 albo WhatsApp." });
  }
};

Object.assign(module.exports, { spamScore, checkToken, makeToken, SPAM_DROP, SPAM_FLAG });
