// Vercel Serverless Function - powiadomienie o nowym zleceniu (brief z /zlecenie)
// POST /api/notify-zlecenie { name, email, phone?, category|type, description|brief, budget?, timeline?, company(honeypot) }
// Dwa kanaly dostarczenia (lead nie ginie): Telegram (jesli env) + email SES (reuzywa newsletter-send.js).
// Sukces gdy zadzialal co najmniej jeden kanal. Tresc maila = dane leada (PII) -> tylko do skrzynki wlasciciela.

const lib = require("./newsletter-send.js");

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
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = lib.parseBody(req);

    // Honeypot: bot wypelnil ukryte pole -> udajemy sukces.
    if (body.company) return lib.sendJson(res, 200, { ok: true });
    if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });

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

    const catLabel = CATEGORY_LABELS[category] || category || "Nie określono";
    const budgetLabel = BUDGET_LABELS[budget] || budget || "—";
    const timelineLabel = TIMELINE_LABELS[timeline] || timeline || "—";
    const subject = source === "kontakt" ? `Nowa wiadomość z /kontakt: ${name}` : `Nowe zlecenie: ${name} (${catLabel})`;

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
