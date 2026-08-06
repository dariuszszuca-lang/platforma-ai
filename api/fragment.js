// POST /api/fragment { email, consent, company(honeypot) }            -> darmowa checklista
// POST /api/fragment { type:"audyt", name, email, phone, consent, company } -> zgloszenie na Audyt AI Act
// Dwa tryby w jednej funkcji (limit 12 funkcji na planie hobby Vercela).
// Reuzywa helpery SES z newsletter-send.js. Zero Claude, zero zapisu do bazy (lead = mail do wlasciciela).
const crypto = require("node:crypto");
const lib = require("./newsletter-send.js");
const { buildAiActProductUrl } = require("./_ai-act-attribution.js");

const CHECKLIST_URL = "https://ai-team.pl/ai-act/checklista-ai-act.pdf";
const AI_RESET_URL = "https://ai-team.pl/ai-reset.html";
const LEAD_MAGNET_EMAILS = {
  "starter-wdrozen-ai": {
    subject: "Twój Starter Wdrożeń AI jest gotowy",
    preview: "Pełny materiał, karta procesu, prompty i plan na 30 dni.",
    heading: "Twój Starter Wdrożeń AI dla Firmy jest gotowy.",
    intro: "Nie dzielę go na kilka wiadomości. Od razu dostajesz cały materiał.",
    bullets: [
      "diagnozę gotowości procesu",
      "mapę pracy, która wraca, czeka albo ginie",
      "15 zastosowań AI w firmie",
      "macierz wyboru pierwszego wdrożenia",
      "trzy gotowe prompty",
      "plan pilotażu na 30 dni",
      "checklistę bezpieczeństwa i sposób pomiaru",
    ],
    cta: "Otwórz Starter online",
    htmlUrl: "https://ai-team.pl/starter-wdrozen-ai",
    pdfUrl: "https://ai-team.pl/assets/starter-wdrozen-ai.pdf",
    pdfLabel: "Pobierz pełny PDF",
    firstStep: "Na początek otwórz stronę 3 i przejdź 12 pytań. Nie wybieraj jeszcze narzędzia. Najpierw sprawdź, który proces ma dobry zakres do testu.",
    reply: "Jeśli utkniesz przy wyborze procesu, odpisz jednym zdaniem: „Najwięcej czasu tracimy na…”",
    productTag: "starter_wdrozen_ai",
  },
  "system-ai-tygodnia": {
    subject: "System #01 jest gotowy: zapytanie → follow-up",
    preview: "Pełny przepływ, statusy, rola AI, kontrola człowieka i testy.",
    heading: "Pierwszy System AI tygodnia jest gotowy.",
    intro: "Na start rozebrałem proces obsługi zapytań i follow-upu. Od wiadomości klienta do przypisanego właściciela, odpowiedzi, kolejnego kroku i terminu.",
    bullets: [
      "pełny przepływ systemu",
      "minimalny rekord zapytania",
      "statusy, które mówią, co dzieje się teraz",
      "podział zadań między AI, reguły i człowieka",
      "ścieżkę eskalacji i zasady follow-upu",
      "obsługę błędów i duplikatów",
      "trzy poziomy wdrożenia",
      "plan pilotażu, testy i gotowy prompt projektowy",
    ],
    cta: "Zobacz system od środka",
    htmlUrl: "https://ai-team.pl/system-ai-tygodnia-01",
    pdfUrl: "https://ai-team.pl/assets/system-ai-tygodnia-01.pdf",
    pdfLabel: "Pobierz pełny materiał",
    firstStep: "Zacznij od strony 5. Sprawdź, czy statusy używane w Twojej firmie rzeczywiście mówią, kto ma wykonać następny ruch.",
    reply: "Jeśli chcesz podsunąć temat kolejnego systemu, odpisz jednym słowem: CRM, raport, newsletter, wiedza albo content.",
    productTag: "system_ai_tygodnia",
  },
};
const OWNER_EMAIL = "dariusz.szuca@gmail.com";
function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function audytUserHtml(name) {
  const hello = name ? `Cześć ${esc(name)},` : "Cześć,";
  return `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2a44">
  <div style="max-width:560px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px">${hello}</p>
    <p style="font-size:15px;line-height:1.6">dostałem Twoje zgłoszenie na <b>Audyt AI Act</b>. Odezwę się najpóźniej w ciągu 24 godzin, żeby umówić termin rozmowy i zadać kilka krótkich pytań o narzędzia AI w Twojej firmie.</p>
    <p style="font-size:15px;line-height:1.6">Jak to dalej wygląda: ustalamy termin, przed rozmową odsyłasz mi odpowiedzi na 5 prostych pytań, rozmawiamy 60 do 90 minut, a po rozmowie dostajesz raport z konkretnym planem. Płatność (290 zł, cena promocyjna do 2 sierpnia) dopiero po ustaleniu terminu.</p>
    <p style="font-size:13px;color:#69788f;line-height:1.5;margin-top:26px">Audyt ma charakter edukacyjno-organizacyjny, nie stanowi porady prawnej. Dostałeś tego maila, bo zgłosiłeś się przez https://ai-team.pl/ai-act.</p>
    <p style="font-size:13px;color:#8a97ab">Dariusz Szuca &middot; ai-team.pl</p>
  </div></body></html>`;
}
function audytUserText(name) {
  const hello = name ? `Cześć ${name},` : "Cześć,";
  return `${hello}\n\ndostałem Twoje zgłoszenie na Audyt AI Act. Odezwę się w ciągu 24 godzin, żeby umówić termin i zadać kilka pytań o narzędzia AI w Twojej firmie.\n\nDalej: termin, 5 krótkich pytań przed rozmową, rozmowa 60-90 minut, raport z planem. Płatność (290 zł promo do 2 sierpnia) po ustaleniu terminu.\n\nAudyt ma charakter edukacyjno-organizacyjny, nie stanowi porady prawnej.\nDariusz Szuca, ai-team.pl`;
}

async function handleAudyt(body, res) {
  const email = lib.cleanEmail(body.email);
  const name = String(body.name || "").trim().slice(0, 80);
  const phone = String(body.phone || "").trim().slice(0, 30);
  const consent = body.consent === true || body.consent === "true" || body.consent === "on";
  if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
  if (!phone || phone.replace(/\D/g, "").length < 7) return lib.sendJson(res, 400, { ok: false, error: "Podaj numer telefonu, żebym mógł się odezwać." });
  if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę na kontakt w sprawie audytu." });

  const aws = lib.getAwsConfig();
  await lib.sendSesEmail({
    from: process.env.SES_FROM, replyTo: process.env.SES_REPLY_TO || "",
    to: email, subject: "Zgłoszenie na Audyt AI Act przyjęte",
    html: audytUserHtml(name), text: audytUserText(name), tags: { product: "ai_act_audyt", lead: "1" },
  }, aws);
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
}

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

function userHtml(productUrl) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2a44">
  <div style="max-width:560px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px">Cześć,</p>
    <p style="font-size:15px;line-height:1.6">dzięki, że sięgasz po temat AI Act. Oto Twoja darmowa <b>checklista zgodności</b> do wydruku. Przejdź ją krok po kroku, odhacz i masz podstawy w porządku.</p>
    <p style="margin:22px 0"><a href="${CHECKLIST_URL}" style="background:#2f6fed;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">Pobierz checklistę (PDF)</a></p>
    <p style="font-size:15px;line-height:1.6">Jeśli chcesz mieć całość ogarniętą w jeden wieczór, w pełnym pakiecie za 67 zł jest jeszcze przewodnik (12 sekcji, prostym językiem), gotowy rejestr narzędzi AI i wzór polityki dla zespołu z oświadczeniem do podpisu.</p>
    <p style="margin:18px 0"><a href="${productUrl}" style="color:#2358c9;font-weight:700">Zobacz pełny pakiet →</a></p>
    <p style="font-size:13px;color:#69788f;line-height:1.5;margin-top:26px">To materiał edukacyjno-organizacyjny, nie porada prawna. Dostałeś tego maila, bo poprosiłeś o checklistę na ai-team.pl/ai-act. Nie chcesz więcej wiadomości? Po prostu nie odpisuj, nie dopisuję Cię do żadnej listy.</p>
    <p style="font-size:13px;color:#8a97ab">Dariusz Szuca &middot; ai-team.pl</p>
  </div></body></html>`;
}
function userText(productUrl) {
  return `Cześć,\n\ndzięki za zainteresowanie tematem AI Act. Twoja darmowa checklista zgodności (PDF):\n${CHECKLIST_URL}\n\nChcesz całość w jeden wieczór? Pełny pakiet (67 zł) ma jeszcze przewodnik, rejestr narzędzi i wzór polityki:\n${productUrl}\n\nMateriał edukacyjno-organizacyjny, nie porada prawna.\nDariusz Szuca, ai-team.pl`;
}

const AI_RESET_EMAILS = {
  1: {
    subject: "AI RESET jest gotowy. Zacznij od 15 minut",
    preview: "Najpierw reset chaosu, potem jeden workflow. Nie musisz robić całości naraz.",
    lead: "Twój AI RESET jest gotowy.",
    body: [
      "Nie próbuj przechodzić całego materiału od razu. Na pierwszą sesję zarezerwuj 15 minut.",
      "Otwórz moduł 1, wyrzuć z głowy wszystkie rozpoczęte testy AI, a potem wybierz jeden temat, który naprawdę chcesz uporządkować.",
      "W kolejnych dniach pokażę Ci, jak wybrać jednego asystenta i sprawdzić, czy zbudowany workflow działa także drugi raz.",
    ],
    cta: "Otwórz AI RESET",
    url: `${AI_RESET_URL}#modul-1`,
  },
  2: {
    subject: "Nie uruchamiaj pięciu asystentów naraz",
    preview: "Wybierz jedną rolę i daj jej trzy podobne zadania. To wystarczy na pierwszy test.",
    lead: "Dzisiaj wybierz tylko jednego asystenta.",
    body: [
      "AI RESET zawiera pięć ról, ale uruchomienie wszystkich naraz odtworzy chaos, który właśnie porządkujesz.",
      "Wybierz rolę pasującą do jednego powtarzalnego zadania. Użyj jej trzy razy na podobnych przykładach. Po każdym użyciu dopisz jedną rzecz, której zabrakło w kontekście.",
      "Nie oceniaj jeszcze całego systemu. Sprawdź tylko, czy ten jeden asystent oszczędza Ci odtwarzania instrukcji od zera.",
    ],
    cta: "Wybierz jednego asystenta",
    url: `${AI_RESET_URL}#modul-4`,
  },
  3: {
    subject: "Najważniejszy test AI RESET: czy działa drugi raz?",
    preview: "Powtórz jeden workflow bez przepisywania instrukcji i zobacz, gdzie nadal pojawia się tarcie.",
    lead: "Dobry workflow nie działa tylko raz.",
    body: [
      "Wróć do jednego zadania, które wykonałeś wcześniej, i uruchom ten sam proces ponownie na nowym przykładzie.",
      "Zapisz trzy rzeczy: co poszło bez wyjaśniania, gdzie AI dopytało o brakujący kontekst i co trzeba dopisać do instrukcji.",
      "To jest właściwy test systemu. Nie efektowna pierwsza odpowiedź, tylko mniejszy wysiłek przy drugim użyciu.",
    ],
    cta: "Powtórz jeden workflow",
    url: `${AI_RESET_URL}#modul-6`,
  },
};

function buildAiResetEmail(step) {
  const email = AI_RESET_EMAILS[Number(step)];
  if (!email) {
    const error = new Error("Nieprawidłowy etap AI RESET.");
    error.statusCode = 400;
    throw error;
  }
  const paragraphs = email.body
    .map((paragraph) => `<p style="font-size:15px;line-height:1.65;margin:0 0 14px">${paragraph}</p>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2a44">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${email.preview}</div>
  <div style="max-width:560px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px;margin:0 0 18px">Cześć,</p>
    <h1 style="font-size:24px;line-height:1.25;margin:0 0 18px">${email.lead}</h1>
    ${paragraphs}
    <p style="margin:24px 0"><a data-primary-cta href="${email.url}" style="background:#ff7a1a;color:#111827;text-decoration:none;font-weight:800;padding:13px 24px;border-radius:8px;display:inline-block">${email.cta}</a></p>
    <p style="font-size:13px;color:#69788f;line-height:1.55;margin-top:28px">Dostajesz tę wiadomość, bo poprosiłeś o AI RESET i zapisałeś się do AI Radar. <a href="https://ai-team.pl/ai-radar-wypis.html" style="color:#4b6385">Wypisz się</a>.</p>
    <p style="font-size:13px;color:#8a97ab">Dariusz Szuca &middot; ai-team.pl</p>
  </div></body></html>`;
  const text = [
    "Cześć,",
    "",
    email.lead,
    "",
    ...email.body.flatMap((paragraph) => [paragraph, ""]),
    `${email.cta}: ${email.url}`,
    "",
    "Dostajesz tę wiadomość, bo poprosiłeś o AI RESET i zapisałeś się do AI Radar.",
    "Wypis: https://ai-team.pl/ai-radar-wypis.html",
    "",
    "Dariusz Szuca · ai-team.pl",
  ].join("\n");
  return { subject: email.subject, html, text };
}

function aiResetAutomationAuthorized(req) {
  const expected = String(process.env.AI_RESET_AUTOMATION_TOKEN || "");
  const authorization = String(req.headers.authorization || "");
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

async function handleAiReset(body, req, res) {
  const email = lib.cleanEmail(body.email);
  const consent = body.consent === true || body.consent === "true" || body.consent === "on";
  const step = Number(body.step || 1);
  if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
  if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, żeby dostać AI RESET." });
  if (![1, 2, 3].includes(step)) return lib.sendJson(res, 400, { ok: false, error: "Nieprawidłowy etap AI RESET." });
  if (step > 1 && !aiResetAutomationAuthorized(req)) {
    return lib.sendJson(res, 401, { ok: false, error: "Brak autoryzacji automatyzacji." });
  }

  const message = buildAiResetEmail(step);
  const aws = lib.getAwsConfig();
  await lib.sendSesEmail({
    from: process.env.SES_FROM,
    replyTo: process.env.SES_REPLY_TO || "",
    to: email,
    subject: message.subject,
    html: message.html,
    text: message.text,
    tags: { product: "ai_reset", sequence_step: String(step) },
  }, aws);

  if (step !== 1 || body.delivered_by === "meta-automat") {
    return lib.sendJson(res, 200, { ok: true });
  }
  await lib.sendSesEmail({
    from: process.env.SES_FROM,
    to: OWNER_EMAIL,
    subject: "Nowy lead: AI RESET",
    html: `<p>Nowy zapis na AI RESET:</p><p style="font-size:16px"><b>${esc(email)}</b></p>`,
    text: `Nowy zapis na AI RESET: ${email}`,
    tags: { product: "ai_reset", lead_admin: "1" },
  }, aws);
  return lib.sendJson(res, 200, { ok: true });
}

function buildLeadMagnetEmail(type, name = "") {
  const email = LEAD_MAGNET_EMAILS[type];
  if (!email) {
    const error = new Error("Nieprawidłowy materiał.");
    error.statusCode = 400;
    throw error;
  }
  const hello = name ? `Cześć ${esc(name)},` : "Cześć,";
  const bullets = email.bullets.map((item) => `<li style="margin:0 0 8px">${item}</li>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#172033">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${email.preview}</div>
  <div style="max-width:580px;margin:0 auto;padding:28px 22px">
    <p style="font-size:16px;margin:0 0 18px">${hello}</p>
    <h1 style="font-size:25px;line-height:1.25;margin:0 0 16px">${email.heading}</h1>
    <p style="font-size:15px;line-height:1.65;margin:0 0 16px">${email.intro}</p>
    <ul style="font-size:15px;line-height:1.55;padding-left:22px;margin:0 0 22px">${bullets}</ul>
    <p style="margin:24px 0"><a data-primary-cta href="${email.htmlUrl}" style="background:#ff761a;color:#111827;text-decoration:none;font-weight:800;padding:13px 24px;border-radius:8px;display:inline-block">${email.cta}</a></p>
    <p style="font-size:14px;line-height:1.55;margin:0 0 22px">Wolisz zachować materiał na komputerze? <a href="${email.pdfUrl}" style="color:#1d4ed8;font-weight:700">${email.pdfLabel}</a>.</p>
    <p style="font-size:15px;line-height:1.65;margin:0 0 16px">${email.firstStep}</p>
    <div style="background:#fff0e5;border-left:4px solid #ff761a;border-radius:0 10px 10px 0;padding:14px 16px;margin:22px 0">
      <p style="font-size:14px;line-height:1.6;margin:0"><b>AI Radar:</b> poniedziałek o 18:00 to praktyczne AI, narzędzie, prompt albo ruch do wykonania. W czwartek o 18:00 pokazuję jeden system AI od środka.</p>
    </div>
    <p style="font-size:15px;line-height:1.65;margin:0 0 20px">${email.reply}</p>
    <p style="font-size:14px;line-height:1.5;margin:0">Darek<br>AI-Team</p>
    <p style="font-size:12px;color:#69788f;line-height:1.55;margin-top:28px">Dostajesz tę wiadomość, ponieważ zamówiłeś materiał i zapisałeś się do AI Radar. <a href="https://ai-team.pl/ai-radar-wypis.html" style="color:#4b6385">Wypisz się</a>.</p>
  </div></body></html>`;
  const text = [
    hello,
    "",
    email.heading,
    "",
    email.intro,
    "",
    ...email.bullets.map((item) => `- ${item}`),
    "",
    `${email.cta}: ${email.htmlUrl}`,
    `${email.pdfLabel}: ${email.pdfUrl}`,
    "",
    email.firstStep,
    "",
    "AI Radar: poniedziałek 18:00 i czwartek 18:00.",
    "",
    email.reply,
    "",
    "Darek",
    "AI-Team",
    "",
    "Wypis: https://ai-team.pl/ai-radar-wypis.html",
  ].join("\n");
  return { ...email, html, text };
}

async function handleLeadMagnet(body, res) {
  const emailAddress = lib.cleanEmail(body.email);
  const name = String(body.name || body.full_name || "").trim().slice(0, 80);
  const consent = body.consent === true || body.consent === "true" || body.consent === "on";
  if (!emailAddress) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
  if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, żeby dostać materiał i AI Radar." });

  const message = buildLeadMagnetEmail(body.type, name);
  const aws = lib.getAwsConfig();
  await lib.sendSesEmail({
    from: process.env.SES_FROM,
    replyTo: process.env.SES_REPLY_TO || "",
    to: emailAddress,
    subject: message.subject,
    html: message.html,
    text: message.text,
    tags: { product: message.productTag, lead: "1" },
  }, aws);

  if (body.delivered_by === "meta-automat") {
    return lib.sendJson(res, 200, { ok: true });
  }
  await lib.sendSesEmail({
    from: process.env.SES_FROM,
    to: OWNER_EMAIL,
    subject: `Nowy lead: ${message.subject}`,
    html: `<p>Nowy zapis na materiał:</p><p style="font-size:16px"><b>${esc(emailAddress)}</b></p><p>${esc(message.heading)}</p>`,
    text: `Nowy zapis na materiał: ${emailAddress}\n${message.heading}`,
    tags: { product: message.productTag, lead_admin: "1" },
  }, aws);
  return lib.sendJson(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });
  try {
    const body = lib.parseBody(req);
    if (body.company) return lib.sendJson(res, 200, { ok: true }); // honeypot
    if (!originAllowed(req)) return lib.sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło żądania." });
    if (rateLimited(clientIp(req))) return lib.sendJson(res, 429, { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj za parę minut." });
    if (body.type === "audyt") return await handleAudyt(body, res);
    if (body.type === "ai-reset") return await handleAiReset(body, req, res);
    if (LEAD_MAGNET_EMAILS[body.type]) return await handleLeadMagnet(body, res);
    const email = lib.cleanEmail(body.email);
    const consent = body.consent === true || body.consent === "true" || body.consent === "on";
    if (!email) return lib.sendJson(res, 400, { ok: false, error: "Podaj poprawny adres email." });
    if (!consent) return lib.sendJson(res, 400, { ok: false, error: "Zaznacz zgodę, żeby dostać checklistę." });

    const attribution = body.attribution && typeof body.attribution === "object" ? body.attribution : {};
    const productUrl = buildAiActProductUrl({
      email,
      attribution,
      secret: process.env.ATTRIBUTION_HMAC_SECRET,
    });
    const aws = lib.getAwsConfig();
    // 1. checklista do zapisujacego sie
    await lib.sendSesEmail({
      from: process.env.SES_FROM, replyTo: process.env.SES_REPLY_TO || "",
      to: email, subject: "Twoja darmowa checklista AI Act",
      html: userHtml(productUrl), text: userText(productUrl), tags: { product: "ai_act_fragment", lead: "1" },
    }, aws);
    // 2. notyfikacja leada do wlasciciela (pomijana, gdy checkliste dostarcza automat leadow Meta,
    //    bo o tym leadzie wlasciciel dostal juz osobne powiadomienie z eksportu)
    if (body.delivered_by === "meta-automat") return lib.sendJson(res, 200, { ok: true });
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

module.exports.buildAiResetEmail = buildAiResetEmail;
module.exports.buildLeadMagnetEmail = buildLeadMagnetEmail;
