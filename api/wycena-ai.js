// Vercel Serverless Function - AI Pricing Estimate
// Endpoint: POST /api/wycena-ai

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, category } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Brak opisu zadania' });
  }

  const validCategories = ['konsultacja', 'automatyzacja', 'narzedzie', 'wdrozenie', 'inne'];
  const selectedCategory = validCategories.includes(category) ? category : 'inne';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'Błąd konfiguracji serwera' });
  }

  const systemPrompt = `Jesteś ekspertem od wyceny projektów AI i automatyzacji. Analizujesz opis zadania i zwracasz wycenę w formacie JSON.

Kontekst cenowy (AI developer z Gdańska, freelancer):
- Konsultacja AI: stała cena 200 PLN, 1 godzina
- Automatyzacja procesu: 500-2000 PLN, 4-16 godzin pracy
- Narzędzie/aplikacja: 1500-5000 PLN, 1-3 tygodnie
- Wdrożenie AI w firmie: 2000-8000 PLN, 1-4 tygodnie
- Developer używa: Claude Code, Python, JavaScript, React, Firebase, Vercel, Stripe, API, narzędzia automatyzacji

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez backticks) w formacie:
{
  "czas": "szacowany czas realizacji, np. '2-3 dni' lub '1 tydzień'",
  "narzedzia": ["lista", "narzędzi", "potrzebnych"],
  "zlozonosc": "Prosta" lub "Średnia" lub "Złożona",
  "cena_min": liczba_w_PLN,
  "cena_max": liczba_w_PLN,
  "opis": "Krótki opis co wchodzi w zakres i jak zostanie zrealizowane (2-3 zdania, po polsku)"
}`;

  const userPrompt = `Kategoria: ${selectedCategory}
Opis zadania: ${description}

Przeanalizuj i zwróć wycenę jako JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(500).json({ error: 'Błąd komunikacji z AI' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Brak odpowiedzi od AI' });
    }

    // Parse the JSON response from Claude
    let estimate;
    try {
      estimate = JSON.parse(text.trim());
    } catch (parseError) {
      // Try to extract JSON from the response if wrapped in extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        estimate = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse AI response:', text);
        return res.status(500).json({ error: 'Błąd parsowania odpowiedzi AI' });
      }
    }

    // Validate required fields
    const requiredFields = ['czas', 'narzedzia', 'zlozonosc', 'cena_min', 'cena_max', 'opis'];
    for (const field of requiredFields) {
      if (estimate[field] === undefined) {
        return res.status(500).json({ error: `Niekompletna wycena AI — brak pola: ${field}` });
      }
    }

    return res.status(200).json(estimate);

  } catch (error) {
    console.error('Wycena AI error:', error);
    return res.status(500).json({ error: 'Błąd serwera podczas wyceny' });
  }
};
