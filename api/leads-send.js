// Vercel Serverless Function - wysylka 1:1 do grupy leadow z reklam (np. Leady AI-Act)
// POST /api/leads-send { token, emails:[...], dryRun?, testTo?, limit? }
//   -> do kazdego adresu osobny mail (jak newsletter), przez ten sam produkcyjny SES co newsletter-send.
// Admin-only (token = NEWSLETTER_CRON_SECRET | CRON_SECRET), zeby SES nie byl open-relay.
// Reuzywa helperow z newsletter-send.js: getAwsConfig, sendSesEmail, parseBody, cleanEmail, sendJson, setCors, publicError.
// Grupa (tag) domyslnie "leady-ai-act". Leady NIE trafiaja do listy AI Radar (osobny kanal, izolacja venture).

const lib = require("./newsletter-send.js");

const GROUP = "leady-ai-act";
const MAX_RECIPIENTS = 200;
const SEND_DELAY_MS = Number(process.env.LEADS_SEND_DELAY_MS || 250);

const PDF_URL = "https://ai-team.pl/ai-act/checklista-ai-act.pdf";
const OFERTA_URL = "https://ai-team.pl/ai-act#oferta";

module.exports = async function handler(req, res) {
  lib.setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return lib.sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = lib.parseBody(req);

    // Admin-only: token w body musi zgadzac sie z sekretem serwera.
    const adminToken = process.env.NEWSLETTER_CRON_SECRET || process.env.CRON_SECRET || "";
    if (!adminToken) throw lib.publicError(500, "Brak sekretu na serwerze.");
    if (String(body.token || "") !== adminToken) throw lib.publicError(401, "Brak autoryzacji.");

    const from = (process.env.SES_FROM || "").trim();
    if (!from) throw lib.publicError(500, "Brak SES_FROM w Vercel.");
    const replyTo = (process.env.SES_REPLY_TO || "").trim();

    const testTo = lib.cleanEmail(body.testTo || "");
    let recipients;
    if (testTo) {
      recipients = [testTo];
    } else {
      const raw = Array.isArray(body.emails) ? body.emails : [];
      recipients = Array.from(new Set(raw.map(lib.cleanEmail).filter((e) => e && e.includes("@"))));
    }
    if (!recipients.length) throw lib.publicError(400, "Brak odbiorcow (emails / testTo).");
    const limit = Number(body.limit || MAX_RECIPIENTS);
    recipients = recipients.slice(0, Math.min(limit, MAX_RECIPIENTS));

    const { subject, html, text } = buildEmail();

    if (body.dryRun === true) {
      return lib.sendJson(res, 200, {
        ok: true,
        mode: "dry-run",
        group: GROUP,
        from,
        subject,
        planned: recipients.length,
        recipients,
      });
    }

    const aws = lib.getAwsConfig();
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const to of recipients) {
      try {
        const r = await lib.sendSesEmail(
          { from, replyTo, to, subject, html, text, tags: { channel: "ad_leads", group: GROUP, test: testTo ? "true" : "false" } },
          aws
        );
        sent += 1;
        results.push({ email: to, status: "sent", id: (r && r.MessageId) || "" });
      } catch (error) {
        failed += 1;
        results.push({ email: to, status: "failed", error: (error && error.message) || "SES send failed" });
      }
      if (SEND_DELAY_MS > 0 && recipients.length > 1) await sleep(SEND_DELAY_MS);
    }

    return lib.sendJson(res, 200, {
      ok: failed === 0,
      mode: testTo ? "test-send" : "send",
      group: GROUP,
      from,
      subject,
      total: recipients.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("leads-send error:", error && (error.message || error));
    return lib.sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Blad wysylki." });
  }
};

function buildEmail() {
  const subject = "Twoja checklista zgodnosci AI Act";

  const text = [
    "Czesc,",
    "",
    "tu Darek z AI-Team. Dzieki za pobranie checklisty zgodnosci AI Act.",
    "",
    `Zostawiam link, gdyby przydal sie jeszcze raz: ${PDF_URL}`,
    "",
    "Warto przejsc ja spokojnie, punkt po punkcie. W jakies 10 minut widac, co dotyczy Twojej firmy i od kiedy. To material edukacyjny, nie porada prawna, ale wystarczy, zeby sie polapac.",
    "",
    `Jesli przyda sie calosc uporzadkowana od A do Z, mam pelny pakiet: przewodnik prostym jezykiem, rejestr narzedzi AI i gotowe szablony. Jest za 67 zl tutaj: ${OFERTA_URL}`,
    "",
    "W razie pytan wystarczy odpisac na tego maila.",
    "",
    "Pozdrawiam,",
    "Darek, AI-Team",
    "",
    "---",
    "Dostajesz te wiadomosc, bo pobrales checkliste AI Act przez reklame AI-Team. Administrator danych: Dariusz Szuca. Nie chcesz wiecej wiadomosci? Odpisz STOP.",
  ].join("\n");

  const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1ede9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1ede9;">
<tr><td align="center" style="padding:26px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e1db;">
    <tr><td style="background:#0d0d0b;padding:20px 30px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#fffaf1;">AI <span style="color:#ff7a1a;">Team</span></span>
    </td></tr>
    <tr><td style="height:4px;background:#ff7a1a;line-height:4px;font-size:0;">&nbsp;</td></tr>
    <tr><td style="padding:32px 30px 6px;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#1c1917;">Twoja checklista zgodności AI Act</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c;">Cześć, tu Darek z AI-Team. Dzięki za pobranie checklisty zgodności AI Act.</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#44403c;">Zostawiam link, gdyby przydał się jeszcze raz:</p>
      <p style="margin:0 0 20px;">
        <a href="${PDF_URL}" style="display:inline-block;padding:12px 20px;background:#ff7a1a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">Pobierz checklistę (PDF)</a>
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44403c;">Warto przejść ją spokojnie, punkt po punkcie. W jakieś 10 minut widać, co dotyczy Twojej firmy i od kiedy. To materiał edukacyjny, nie porada prawna, ale wystarczy, żeby się połapać.</p>
    </td></tr>
    <tr><td style="padding:4px 30px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff4ea;border:1px solid #ffd2ad;border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <div style="font-weight:bold;color:#1c1917;font-size:14px;margin-bottom:6px;">Chcesz od razu całość?</div>
          <div style="color:#3d2a17;font-size:14px;line-height:1.55;margin-bottom:12px;">Pełny pakiet: przewodnik prostym językiem, rejestr narzędzi AI i gotowe szablony. Wszystko uporządkowane od A do Z.</div>
          <a href="${OFERTA_URL}" style="display:inline-block;padding:11px 18px;background:#0d0d0b;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">Zobacz pakiet za 67 zł</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 30px 26px;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#44403c;">W razie pytań wystarczy odpisać na tego maila.</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#1c1917;">Pozdrawiam,<br><b>Darek</b>, AI-Team<br><a href="https://ai-team.pl" style="color:#ff7a1a;text-decoration:none;">ai-team.pl</a></p>
    </td></tr>
    <tr><td style="background:#faf7f4;padding:16px 30px;font-size:11px;line-height:1.5;color:#9a8f86;">
      Dostajesz tę wiadomość, bo pobrałeś checklistę AI Act przez reklamę AI-Team. Administrator danych: Dariusz Szuca. Nie chcesz więcej wiadomości? Odpisz STOP.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  return { subject, html, text };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
