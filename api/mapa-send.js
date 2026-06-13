// Vercel Serverless Function - Mapa AI lead magnet (Cloud CSO)
// POST /api/mapa-send { email, name?, what, pain?, stage?, consent, company(honeypot) }
//   -> generuje spersonalizowana Mape AI (Claude) -> wysyla mailem (SES) -> zapis do AI Radar (Firebase)
// Reuzywa sprawdzonych helperow SES/Firebase z newsletter-send.js (ten sam produkcyjny SES).
// Admin-only (token = CRON_SECRET): dryRun (zwraca Mape+HTML bez wysylki/zapisu), testTo (inny odbiorca).

const lib = require("./newsletter-send.js");

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

const MAPA_PROMPT = `Jesteś planistą wdrożeń AI w AI-Team (studio Darka Szucy: strony, systemy/CRM i automatyzacje dla małych firm). Dostajesz krótkie odpowiedzi właściciela małej firmy z formularza i tworzysz dla NIEGO konkretną, praktyczną Mapę AI: od czego zacząć, czym to zrobić, w jakiej kolejności.

ZASADY PISANIA:
- Po polsku, prosto, jak do kolegi. Zero korpomowy. Zakazane słowa: innowacyjny, kompleksowy, holistyczny, synergia, dedykowany (jako ozdobnik), rewolucyjny, cutting-edge, leverage.
- ZERO myślników (długich i półpauz). Używaj kropek, przecinków, dwukropków.
- Pełne polskie znaki (ą ę ś ć ł ń ó ź ż).
- Konkretnie i pod TĘ firmę. Bez ogólników, które pasują do każdego.
- Nie zmyślaj liczb ani obietnic wyniku. Nie pisz "oszczędzisz 10 godzin" ani "zwiększysz sprzedaż o 30%". Mów jakościowo: mniej powtarzalnej roboty, mniej telefonów, nic nie ginie, szybsza odpowiedź klientowi.
- Rekomendacje opieraj na prostych, realnych narzędziach AI i na tym, co robi AI-Team. Gdy coś pasuje do oferty AI-Team, wskaż to naturalnie (jednym zdaniem), z ceną z oferty, bez nacisku. Mapa ma dawać wartość sama, nie być reklamą.
- Ton: spokojny ekspert, który mówi "zrobiłbym to tak". Krótkie zdania.

STRUKTURA: 3 kroki od czego zacząć (uporządkowane od najłatwiejszego i najszybszego zwrotu); 1-2 rzeczy do odpuszczenia na start; 1 następny krok.

OFERTA AI-TEAM (fakty, używaj tylko tych cen):
- Strona z AI: od 1500 zł netto (wizytówka, strona firmowa, sklep, landing).
- Spersonalizowany CRM / Mini-System: 3900 zł brutto (promo, docelowo od 5900), wdrożenie 1-2 tygodnie.
- System OS / dedykowana aplikacja: 3000 do 12000 zł brutto, 2-3 miesiące.
- Warsztaty AI: od 600 zł (indywidualnie lub grupa do 10 osób).
- Opieka miesięczna: 490 zł/mies albo 1500 zł/rok.

Zwróć WYŁĄCZNIE poprawny JSON, bez komentarzy:
{"tytul":"Mapa AI dla ...","wstep":"1-2 zdania osobiście pod tę firmę i jej problem","od_czego_zaczac":[{"krok":1,"tytul":"...","co_da":"...","jak":"..."},{"krok":2,"tytul":"...","co_da":"...","jak":"..."},{"krok":3,"tytul":"...","co_da":"...","jak":"..."}],"czego_nie_ruszac":["..."],"nastepny_krok":"..."}`;

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = lib.parseBody(req);

    // Honeypot: bot wypelnil ukryte pole -> udajemy sukces, nic nie robimy.
    if (body.company) return lib.sendJson(res, 200, { ok: true });

    const email = lib.cleanEmail(body.email);
    const name = String(body.name || "").trim().slice(0, 120);
    const what = String(body.what || "").trim().slice(0, 500);
    const pain = String(body.pain || "").trim().slice(0, 160);
    const stage = String(body.stage || "").trim().slice(0, 160);
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";

    // Admin-only opcje (chronia SES przed naduzyciem jako open-relay):
    const adminToken = process.env.NEWSLETTER_CRON_SECRET || process.env.CRON_SECRET || "";
    const isAdmin = adminToken && String(body.token || "") === adminToken;
    const dryRun = body.dryRun === true && isAdmin;
    const testTo = isAdmin ? lib.cleanEmail(body.testTo || "") : "";

    if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
    if (!what) return lib.sendJson(res, 400, { ok: false, error: "Napisz w dwóch słowach, czym się zajmujesz." });
    if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, bez tego nie przygotuję Mapy." });

    // 1. Generacja Mapy (Claude)
    const mapa = await generateMapa({ imie: name, firma: what, co_zjada: pain, etap: stage });

    // 2. Render maila (cala Mapa w tresci)
    const html = renderEmail(mapa, { imie: name });
    const text = renderText(mapa, name);
    const subject = `${name ? name + ", " : ""}Twoja Mapa AI jest gotowa`;

    if (dryRun) {
      return lib.sendJson(res, 200, { ok: true, dryRun: true, mapa, subject, html });
    }

    // 3. Zapis do listy AI Radar (Firebase) - merge, nie kasuje innych pol
    let saved = false;
    try {
      saved = await saveSubscriber({ email, name, what, pain, stage });
    } catch (e) {
      console.error("mapa-send firebase:", e && e.message);
    }

    // 4. Wysylka mailem (SES) - do testTo (admin) albo na podany adres
    const aws = lib.getAwsConfig();
    await lib.sendSesEmail(
      {
        from: process.env.SES_FROM,
        replyTo: process.env.SES_REPLY_TO || "",
        to: testTo || email,
        subject,
        text,
        html,
        tags: { product: "mapa_ai", lead: "1" },
      },
      aws
    );

    return lib.sendJson(res, 200, { ok: true, saved, sent_to: testTo || email });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("mapa-send error:", error && (error.message || error));
    return lib.sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Błąd. Spróbuj za chwilę." });
  }
};

async function generateMapa(inp) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Brak ANTHROPIC_API_KEY w Vercel.");

  const userText =
    "Odpowiedzi z formularza:\n" +
    `Imie: ${inp.imie || "(brak)"}\n` +
    `Czym zajmuje sie firma: ${inp.firma}\n` +
    `Co najbardziej zjada czas: ${inp.co_zjada || "(brak)"}\n` +
    `Etap decyzji: ${inp.etap || "(brak)"}\n\n` +
    "Napisz Mape AI w formacie JSON zgodnie z instrukcja.";

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1800,
      system: MAPA_PROMPT,
      messages: [{ role: "user", content: userText }],
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Anthropic ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseMapaJson(raw);
}

function parseMapaJson(textRaw) {
  let t = String(textRaw || "").trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

async function saveSubscriber({ email, name, what, pain, stage }) {
  const token = await lib.getServerFirestoreToken();
  const id = lib.docIdFromEmail(email);
  const now = new Date().toISOString();
  const data = {
    id,
    email,
    name: name || "",
    group: "ai-radar",
    groups: ["ai-radar"],
    status: "active",
    source: "mapa-ai",
    mapa_survey: { firma: what, problem: pain, etap: stage },
    consent: {
      newsletter: true,
      text: "Zapis do AI Radar i zgoda na przygotowanie Mapy AI (ai-team.pl/mapa-ai).",
      accepted_at: now,
      privacy_url: "https://ai-team.pl/privacy",
    },
    created_at: now,
    updated_at: now,
    last_signup_at: now,
  };
  await lib.setDoc(`newsletter_subscribers/${id}`, data, token, Object.keys(data));
  return true;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(m, inp) {
  const imie = esc(inp.imie || "") || "Cześć";
  const kroki = (m.od_czego_zaczac || [])
    .map(
      (k) => `
        <tr><td style="padding:14px 0;border-bottom:1px solid #efeae5;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" width="30" style="color:#ff7a1a;font-weight:bold;font-size:16px;line-height:1.35;">${esc(k.krok)}.</td>
            <td valign="top">
              <div style="font-weight:bold;color:#1c1917;font-size:15px;margin-bottom:5px;">${esc(k.tytul)}</div>
              <div style="color:#44403c;font-size:14px;line-height:1.55;margin-bottom:7px;">${esc(k.co_da)}</div>
              <div style="color:#57534e;font-size:13.5px;line-height:1.55;"><b style="color:#1c1917;">Jak:</b> ${esc(k.jak)}</div>
            </td>
          </tr></table>
        </td></tr>`
    )
    .join("");
  const nie = (m.czego_nie_ruszac || [])
    .map((x) => `<li style="margin-bottom:8px;color:#44403c;font-size:14px;line-height:1.55;">${esc(x)}</li>`)
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
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#1c1917;">${imie}, oto Twoja Mapa AI.</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#44403c;">Dzięki, że się zapisałeś. Poniżej cała Twoja Mapa: od czego zacząć, czego nie ruszać na start i jaki jest następny krok. Czytaj na spokojnie, nic się nie spieszy.</p>
    </td></tr>
    <tr><td style="padding:20px 30px 0;">
      <p style="margin:0 0 2px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ff7a1a;font-weight:bold;">Od czego zacząć</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kroki}</table>
    </td></tr>
    <tr><td style="padding:22px 30px 0;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ff7a1a;font-weight:bold;">Czego nie ruszać na start</p>
      <ul style="margin:0;padding-left:20px;">${nie}</ul>
    </td></tr>
    <tr><td style="padding:22px 30px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff4ea;border:1px solid #ffd2ad;border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <div style="font-weight:bold;color:#1c1917;font-size:14px;margin-bottom:5px;">Następny krok</div>
          <div style="color:#3d2a17;font-size:14px;line-height:1.55;">${esc(m.nastepny_krok)}</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 30px 26px;">
      <p style="margin:0;padding-top:18px;border-top:1px solid #efeae5;font-size:13px;line-height:1.6;color:#57534e;">Od teraz raz w tygodniu dostaniesz AI Radar: krótki mail o tym, co w AI naprawdę warto sprawdzić. Gdyby było za dużo, wypiszesz się jednym kliknięciem.</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#1c1917;">Do usłyszenia,<br><b>Darek</b><br><a href="https://ai-team.pl" style="color:#ff7a1a;text-decoration:none;">ai-team.pl</a></p>
    </td></tr>
    <tr><td style="background:#faf7f4;padding:16px 30px;font-size:11px;line-height:1.5;color:#9a8f86;">
      Dostajesz tę wiadomość, bo zapisałeś się po Mapę AI na ai-team.pl. Administrator danych: Dariusz Szuca. <a href="https://ai-team.pl/ai-radar-wypis.html" style="color:#9a8f86;">Wypisz się</a>.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function renderText(m, name) {
  const lines = [];
  lines.push(`${name ? name + ", " : ""}oto Twoja Mapa AI.`);
  lines.push("");
  lines.push(String(m.wstep || ""));
  lines.push("");
  lines.push("OD CZEGO ZACZĄĆ");
  for (const k of m.od_czego_zaczac || []) {
    lines.push(`${k.krok}. ${k.tytul}`);
    lines.push(`   ${k.co_da}`);
    lines.push(`   Jak: ${k.jak}`);
  }
  lines.push("");
  lines.push("CZEGO NIE RUSZAĆ NA START");
  for (const x of m.czego_nie_ruszac || []) lines.push(`- ${x}`);
  lines.push("");
  lines.push("NASTĘPNY KROK");
  lines.push(String(m.nastepny_krok || ""));
  lines.push("");
  lines.push("Od teraz raz w tygodniu dostaniesz AI Radar. Wypisać się możesz w każdej chwili.");
  lines.push("Darek, ai-team.pl");
  return lines.join("\n");
}
