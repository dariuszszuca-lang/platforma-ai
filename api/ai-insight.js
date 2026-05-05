// POST /api/ai-insight — generuj insight dzienny lub tygodniowy raport (OpenAI)
const { kv } = require('@vercel/kv');
const { requireUser } = require('./_lib/auth');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const { mode } = req.body || {}; // 'daily' | 'weekly' | 'decision'

  const tasks = (await kv.get(`tasks:${user.id}`)) || [];
  const profile = user.profile || {};
  const stawka = profile.hourlyRate || 200;

  // Statystyki
  const totalMin = tasks.reduce((s, t) => s + t.minutes, 0);
  const groupStats = {};
  const catStats = {};
  for (const t of tasks) {
    groupStats[t.grupa] = (groupStats[t.grupa] || 0) + t.minutes;
    catStats[t.kategoria] = (catStats[t.kategoria] || 0) + t.minutes;
  }
  const top5 = Object.entries(catStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = {
    totalHours: (totalMin / 60).toFixed(1),
    totalCost: Math.round((totalMin / 60) * stawka),
    weeklyCost: Math.round((totalMin / 60) * stawka),
    yearlyCost: Math.round((totalMin / 60) * stawka * 50),
    top5: top5.map(([k, m]) => ({ kategoria: k, godziny: (m / 60).toFixed(1), koszt: Math.round((m / 60) * stawka) })),
    grupy: groupStats,
    liczbaZadan: tasks.length,
  };

  const userContext = `Profil użytkownika:
- Stawka godzinowa: ${stawka} zł/h
- Branża: ${profile.industry || 'nieznana'}
- Wielkość zespołu: ${profile.teamSize || 'solo'}
- Główny ból: ${profile.pain || 'nieznany'}

Statystyki tygodnia (${tasks.length} zadań, ${stats.totalHours}h łącznie):
- Top 5 kategorii: ${stats.top5.map(t => `${t.kategoria} (${t.godziny}h, ${t.koszt} zł)`).join(', ')}
- Per grupa: ${Object.entries(groupStats).map(([g, m]) => `${g}: ${(m/60).toFixed(1)}h`).join(', ')}
- Łączny koszt tygodnia: ${stats.weeklyCost} zł
- Roczna projekcja kosztów: ${stats.yearlyCost} zł`;

  const prompts = {
    daily: `Jesteś coachem produktywności dla freelancerów. Na podstawie poniższych danych z 1-4 dni trackowania, daj jeden konkretny, krótki insight (max 4 zdania) który:
1. Wskazuje wzór behawioralny (np. "co rano zaczynasz od mejli")
2. Mówi ile to kosztuje rocznie w PLN
3. Sugeruje 1 konkretną akcję

Pisz jak do kolegi, bez pretensjonalnego tonu. Po polsku. Bez wzmianek o "Notion" ani "AI".

${userContext}`,

    weekly: `Jesteś senior konsultantem produktywności. Wygeneruj raport po 7 dniach trackowania w formie:

**3 KLUCZOWE WNIOSKI** (każdy max 3 zdania):
1. [Top wyciek z konkretnymi liczbami i kosztem rocznym]
2. [Jaki obszar wymaga uwagi — z procentami]
3. [Co działa dobrze — replikuj]

Pisz konkretnie, z liczbami w PLN. Bez wody. Po polsku.

${userContext}`,

    decision: `Klient skończył 7 dni trackowania. Jego top 1 stratna kategoria to ${stats.top5[0]?.kategoria || 'nieznana'} (${stats.top5[0]?.godziny || 0}h tygodniowo). Wybierz JEDNĄ ścieżkę dla niego:

- Ścieżka A (Pakiet Dokumentów P3, 297 zł) — gdy TOP to P1, P2, S2, S3 (praca wartościowa, problem skali)
- Ścieżka B (Decoder Stack AI P2, 97 zł) — gdy TOP to A1, A2, A3, M2, Z2 (operacje + rozpraszacze, problem narzędzi)
- Ścieżka C (Warsztat 1-na-1, 1500 zł) — gdy TOP to Z1, Z3, P3 (procesy, problem strukturalny)

Odpowiedź w 3-4 zdaniach: która ścieżka i dlaczego, z konkretnym uzasadnieniem na podstawie jego liczb.

${userContext}`,
  };

  const prompt = prompts[mode] || prompts.daily;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Jesteś polskim coachem produktywności dla freelancerów. Konkretny, bez wody.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const insight = completion.choices[0]?.message?.content?.trim() || 'Brak insightu — spróbuj ponownie.';

    return res.status(200).json({
      mode,
      insight,
      stats,
    });
  } catch (e) {
    console.error('OpenAI error:', e?.message);
    return res.status(500).json({ error: 'Nie udało się wygenerować insightu. Spróbuj za chwilę.' });
  }
};
