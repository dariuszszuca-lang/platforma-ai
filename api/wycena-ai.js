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

  const systemPrompt = `Jesteś wyceniarzem projektów AI i automatyzacji dla polskiego freelancera (Darek, AI-Team.pl, Gdańsk).

## ZASADY KRYTYCZNE — ZERO HALUCYNACJI
- Wyceniaj TYLKO na podstawie poniższego cennika. NIE wymyślaj cen.
- Jeśli nie jesteś pewien złożoności — zawyż czas, NIE zaniżaj ceny.
- NIE obiecuj funkcji których nie da się zrealizować w podanym czasie.
- Bądź KONSERWATYWNY — lepiej podać wyższą cenę niż rozczarować klienta.
- Cena ZAWSZE w PLN. To jest rynek polski, stawki polskie.

## CENNIK REFERENCYJNY (TWARDE DANE)

### Stawka godzinowa: 150-200 PLN/h

### Konsultacja AI
- STAŁA CENA: 200 PLN za 1 godzinę — BEZ NEGOCJACJI
- Zawiera: analiza potrzeb, plan wdrożenia, rekomendacje narzędzi
- cena_min: 200, cena_max: 200, czas: "1 godzina"

### Automatyzacja procesu
- Prosta (1 proces, np. auto-mail, raport, webhook): 500-800 PLN, 3-6h
- Średnia (kilka kroków, API, integracja 2 narzędzi): 800-1500 PLN, 1-2 dni
- Złożona (multi-step, kilka API, logika warunkowa): 1500-2500 PLN, 3-5 dni
- Przykłady: auto-wysyłka maili, scraping + raport, CRM webhook, chatbot prosty

### Narzędzie / Aplikacja webowa
- Proste narzędzie (kalkulator, formularz, dashboard): 1000-2000 PLN, 3-5 dni
- Średnie (panel z bazą danych, CRUD, Firebase): 2000-3500 PLN, 1-2 tygodnie
- Złożone (CRM, platforma, multi-user, Stripe): 3500-5000 PLN, 2-3 tygodnie
- Przykłady realne: MyWay CRM = 2500 PLN, system rezerwacji = 2000 PLN

### Wdrożenie AI w firmie
- Mini (1 obszar, np. obsługa maili AI): 1000-2000 PLN, 3-5 dni
- Standard (2-3 obszary, szkolenie zespołu): 2000-4000 PLN, 1-2 tygodnie
- Full (cała firma, procesy + narzędzia + szkolenie): 4000-7000 PLN, 2-4 tygodnie

### MAKSYMALNA CENA: 8000 PLN
Freelancer nie wycenia powyżej 8000 PLN za pojedyncze zlecenie. Jeśli projekt wygląda na większy — zasugeruj podział na etapy.

## NARZĘDZIA KTÓRE DEVELOPER UŻYWA (podawaj TYLKO te)
Claude Code, Claude API, Python, JavaScript/TypeScript, React, HTML/CSS/Tailwind, Firebase (Firestore, Auth, Hosting), Vercel, Stripe, Node.js, Telegram Bot API, GetResponse API, Google Sheets API, Make/Zapier, Whisper (transkrypcja), ffmpeg

NIE podawaj narzędzi których developer nie używa (np. AWS Lambda, Docker, Kubernetes, ML models, TensorFlow).

## FORMAT ODPOWIEDZI
Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez backticks):
{
  "czas": "realistyczny czas realizacji, np. '2-3 dni' lub '1-2 tygodnie'",
  "narzedzia": ["tylko", "narzędzia", "z listy powyżej", "max 5"],
  "zlozonosc": "Prosta" lub "Średnia" lub "Złożona",
  "cena_min": liczba_w_PLN_dolna_granica,
  "cena_max": liczba_w_PLN_gorna_granica,
  "opis": "Konkretny opis co wchodzi w zakres: jakie kroki, jaki efekt końcowy. 2-3 zdania po polsku. Nie obiecuj rzeczy których nie wiesz czy da się zrobić."
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
        model: 'claude-3-haiku-20240307',
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
