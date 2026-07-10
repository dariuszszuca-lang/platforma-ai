// Vercel Serverless Function - piksel sledzacy otwarcia maili leadowych
// GET /api/px?l=<sha256(email)>&c=<campaign>  -> loguje otwarcie do Firestore lead_opens/<l>__<c>, zwraca 1x1 gif
// Reuzywa Firestore helperow z newsletter-send.js. Bez PII (tylko hash maila).

const lib = require("./newsletter-send.js");

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, "https://ai-team.pl");
    const l = String(url.searchParams.get("l") || "").replace(/[^a-f0-9]/gi, "").slice(0, 64);
    const c = String(url.searchParams.get("c") || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 20) || "1";

    if (l) {
      try {
        const token = await lib.getServerFirestoreToken();
        const id = `${l}__${c}`;
        const existing = await lib.getDoc(`lead_opens/${id}`, token).catch(() => null);
        const now = new Date().toISOString();
        await lib.setDoc(`lead_opens/${id}`, {
          id,
          hash: l,
          campaign: c,
          first_open: (existing && existing.first_open) || now,
          last_open: now,
          count: ((existing && Number(existing.count)) || 0) + 1,
        }, token);
      } catch (e) {
        // nie blokuj obrazka gdy log padnie
        console.error("px log error:", e && (e.message || e));
      }
    }
  } catch (e) {
    // ignore
  }
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  return res.status(200).send(GIF);
};
