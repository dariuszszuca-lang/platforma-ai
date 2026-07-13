// Vercel Serverless Function - recepcjonistka AI (demo: warsztat). Glos: nagranie -> STT -> Claude -> TTS.
// POST /api/recepcja { messages:[{role,content}], audio?:base64, mime?:string }
//   - puste messages i brak audio -> powitanie (z audio)
//   - audio -> transkrypcja (ElevenLabs Scribe) jako nowa tura usera
//   -> { ok, transcript?, reply, booking?, audio }
// Jeden klucz ELEVENLABS_API_KEY (STT + TTS) + ANTHROPIC_API_KEY (mozg). Origin z ai-team.pl + limit na IP.

const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";
const RL_MAX = 80;
const RL_WINDOW_MS = 60 * 60 * 1000;

const GREETING = "Auto-Serwis Kowalski, dzień dobry. W czym mogę pomóc?";
const VOICE_ID = process.env.RECEPCJA_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Sarah (żeński)
const TTS_MODEL = "eleven_multilingual_v2";

const SYSTEM = `Jesteś Ola, recepcjonistka telefoniczna warsztatu samochodowego "Auto-Serwis Kowalski" w Gdańsku. Odbierasz telefon, gdy mechanicy pracują. To rozmowa TELEFONICZNA, więc mów krótko, naturalnie i ciepło, jak żywy człowiek.

TWOJE ZADANIE: pomóc dzwoniącemu i UMÓWIĆ WIZYTĘ. Zbierz naturalnie, po kolei (jedno pytanie na raz): 1) jakiej usługi potrzebuje, 2) marka i model auta, 3) preferowany dzień i godzina, 4) imię, 5) numer telefonu. Gdy masz komplet, potwierdź termin własnymi słowami i zakończ miło.

WARSZTAT (fakty):
- Usługi: wymiana oleju, opony (wymiana i przechowywanie), klocki i tarcze hamulcowe, przegląd okresowy, diagnostyka komputerowa, serwis klimatyzacji.
- Godziny: poniedziałek-piątek 8-17, sobota 9-13.
- Ceny orientacyjne (mów ostrożnie, dodaj że dokładna wycena po obejrzeniu auta): wymiana oleju od 150 zł, sezonowa wymiana opon od 120 zł, wymiana klocków od 250 zł, diagnostyka komputerowa 100 zł.

ZASADY MOWY: krótkie zdania, jedno pytanie na raz, pełne polskie znaki. Zero korpomowy, zero AI-słów, zero długich myślników. NIE zmyślaj cen ani faktów. Jak ktoś pyta o coś spoza warsztatu, grzecznie wróć do wizyty.

FORMAT: odpowiadasz normalnym tekstem do wypowiedzenia. Gdy wizyta jest kompletna (usługa, auto, termin, imię, telefon), NA KOŃCU dołącz w OSOBNEJ linii marker (nie czytaj go na głos):
[[UMOWIONO| usluga=...; auto=...; termin=...; imie=...; telefon=...]]`;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = parseBody(req);
    let messages = Array.isArray(body.messages) ? body.messages : [];

    // Powitanie
    if (!messages.length && !body.audio) {
      return sendJson(res, 200, { ok: true, reply: GREETING, audio: await ttsBase64(GREETING) });
    }

    if (!originAllowed(req)) return sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło." });
    if (rateLimited(clientIp(req))) return sendJson(res, 429, { ok: false, error: "Za dużo zapytań, chwila przerwy." });

    // Historia
    messages = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000),
    })).filter((m) => m.content);

    // Nowa tura usera: z nagrania (STT) albo z tekstu (ostatnia wiadomosc)
    let transcript = null;
    if (body.audio) {
      transcript = await sttFromBase64(body.audio, body.mime);
      if (!transcript) return sendJson(res, 200, { ok: true, transcript: "", reply: "Przepraszam, nie dosłyszałam. Może Pan powtórzyć?", audio: await ttsBase64("Przepraszam, nie dosłyszałam. Może Pan powtórzyć?") });
      messages.push({ role: "user", content: transcript });
    }
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return sendJson(res, 400, { ok: false, error: "Brak wypowiedzi klienta." });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return sendJson(res, 500, { ok: false, error: "Brak ANTHROPIC_API_KEY." });

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM, messages }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return sendJson(res, 502, { ok: false, error: `Anthropic ${resp.status}` });

    let text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();

    let booking = null;
    const m = text.match(/\[\[UMOWIONO\|([^\]]*)\]\]/i);
    if (m) {
      booking = {};
      for (const part of m[1].split(";")) {
        const [k, ...v] = part.split("=");
        if (k && v.length) booking[k.trim()] = v.join("=").trim();
      }
      text = text.replace(m[0], "").trim();
    }
    const reply = text || "Przepraszam, może Pan powtórzyć?";
    return sendJson(res, 200, { ok: true, transcript, reply, booking, audio: await ttsBase64(reply) });
  } catch (error) {
    console.error("recepcja error:", error && (error.message || error));
    return sendJson(res, 500, { ok: false, error: "Błąd. Spróbuj ponownie." });
  }
};

async function sttFromBase64(b64, mime) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || !b64) return "";
  try {
    const buf = Buffer.from(b64, "base64");
    const fd = new FormData();
    fd.append("model_id", "scribe_v1");
    fd.append("file", new Blob([buf], { type: mime || "audio/webm" }), "nagranie");
    const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
    if (!r.ok) return "";
    const d = await r.json().catch(() => ({}));
    return String(d.text || "").trim();
  } catch (e) { return ""; }
}

async function ttsBase64(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || !text) return null;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text: String(text).slice(0, 600), model_id: TTS_MODEL, voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
    });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer()).toString("base64");
  } catch (e) { return null; }
}

const RL = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const hits = (RL.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) { RL.set(ip, hits); return true; }
  hits.push(now); RL.set(ip, hits);
  if (RL.size > 5000) RL.clear();
  return false;
}
function clientIp(req) { return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown"; }
function originAllowed(req) {
  const src = req.headers.origin || req.headers.referer || "";
  if (!src) return false;
  try { const h = new URL(src).hostname; return ["ai-team.pl","www.ai-team.pl","localhost"].includes(h) || h.endsWith(".vercel.app"); }
  catch { return false; }
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
function sendJson(res, s, d) { return res.status(s).json(d); }
