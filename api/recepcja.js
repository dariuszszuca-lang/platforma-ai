// Vercel Serverless Function - mozg recepcjonistki AI (demo: warsztat samochodowy)
// POST /api/recepcja { messages: [{role:"user"|"assistant", content:"..."}] }
//   -> { ok, reply, booking? }  (booking wypelnione, gdy wizyta umowiona)
// Freemium/demo: origin z ai-team.pl + limit na IP. Reuzywa ANTHROPIC_API_KEY z Vercel.

const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";
const RL_MAX = 60;                 // tur na IP / okno (demo)
const RL_WINDOW_MS = 60 * 60 * 1000;

const GREETING = "Auto-Serwis Kowalski, dzień dobry. W czym mogę pomóc?";

const SYSTEM = `Jesteś Ola, recepcjonistka telefoniczna warsztatu samochodowego "Auto-Serwis Kowalski" w Gdańsku. Odbierasz telefon, gdy mechanicy pracują. To rozmowa TELEFONICZNA, więc mów krótko, naturalnie i ciepło, jak żywy człowiek.

TWOJE ZADANIE: pomóc dzwoniącemu i UMÓWIĆ WIZYTĘ. Zbierz naturalnie, po kolei (nie jak formularz, jedno pytanie na raz):
1) jakiej usługi potrzebuje, 2) marka i model auta, 3) preferowany dzień i godzina, 4) imię, 5) numer telefonu.
Gdy masz komplet, potwierdź termin własnymi słowami i zakończ miło.

WARSZTAT (fakty, trzymaj się ich):
- Usługi: wymiana oleju, opony (wymiana i przechowywanie), klocki i tarcze hamulcowe, przegląd okresowy, diagnostyka komputerowa, serwis klimatyzacji.
- Godziny: poniedziałek-piątek 8-17, sobota 9-13.
- Ceny orientacyjne (mów ostrożnie, zawsze dodaj że dokładna wycena po obejrzeniu auta): wymiana oleju od 150 zł, sezonowa wymiana opon od 120 zł, wymiana klocków od 250 zł, diagnostyka komputerowa 100 zł.

ZASADY MOWY:
- Krótkie zdania. Jedno pytanie na raz. Pełne polskie znaki (ą ę ś ć ł ń ó ź ż).
- Zero korpomowy, zero AI-słów, zero długich myślników.
- NIE zmyślaj cen, terminów ani faktów, których nie znasz. Jak ktoś pyta o coś spoza warsztatu, grzecznie wróć do tematu wizyty.
- Nie podawaj konkretnej wolnej godziny jako pewnej. Przyjmij preferencję klienta i potwierdź ją jako propozycję ("zapiszę Pana na...").

FORMAT ODPOWIEDZI:
Odpowiadasz normalnym tekstem (to, co ma zostać wypowiedziane). Gdy wizyta jest kompletna (masz usługę, auto, termin, imię i telefon), NA KOŃCU odpowiedzi dołącz w OSOBNEJ linii marker:
[[UMOWIONO| usluga=...; auto=...; termin=...; imie=...; telefon=...]]
Marker jest tylko dla systemu, nie czytaj go na głos, nie komentuj.`;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = parseBody(req);
    let messages = Array.isArray(body.messages) ? body.messages : [];

    // Pierwsze wejscie: recepcja wita, bez wolania modelu.
    if (!messages.length) return sendJson(res, 200, { ok: true, reply: GREETING });

    if (!originAllowed(req)) return sendJson(res, 403, { ok: false, error: "Nieprawidłowe źródło." });
    if (rateLimited(clientIp(req))) return sendJson(res, 429, { ok: false, error: "Za dużo zapytań, chwila przerwy." });

    // Sanityzacja historii
    messages = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000),
    })).filter((m) => m.content);
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

    // Wyciagnij marker rezerwacji, jesli jest
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

    return sendJson(res, 200, { ok: true, reply: text || "Przepraszam, może Pan powtórzyć?", booking });
  } catch (error) {
    console.error("recepcja error:", error && (error.message || error));
    return sendJson(res, 500, { ok: false, error: "Błąd. Spróbuj ponownie." });
  }
};

const RL = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const hits = (RL.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) { RL.set(ip, hits); return true; }
  hits.push(now); RL.set(ip, hits);
  if (RL.size > 5000) RL.clear();
  return false;
}
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}
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
