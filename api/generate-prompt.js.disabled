// Vercel Serverless Function - AI Prompt Generator
// Endpoint: POST /api/generate-prompt

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

  const { goal, context, category } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'Brak celu (goal)' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak klucza API' });
  }

  const systemPrompt = `Jesteś ekspertem od prompt engineeringu. Tworzysz profesjonalne, skuteczne prompty dla AI.

ZASADY:
1. Prompt musi być w języku polskim
2. Używaj struktury: Rola → Kontekst → Zadanie → Format → Ograniczenia
3. Bądź konkretny i precyzyjny
4. Dodaj przykłady gdzie potrzebne
5. Prompt ma być gotowy do skopiowania i użycia

KATEGORIE PROMPTÓW:
- email: Profesjonalne maile biznesowe
- social: Posty na social media (LinkedIn, FB, Instagram)
- oferta: Teksty ofertowe i sprzedażowe
- analiza: Analiza danych i dokumentów
- content: Artykuły, blogi, treści
- code: Pomoc w programowaniu
- general: Ogólne zadania

Zwróć TYLKO gotowy prompt, bez dodatkowych wyjaśnień.`;

  const userMessage = `Stwórz profesjonalny prompt dla AI.

CEL UŻYTKOWNIKA: ${goal}
${context ? `DODATKOWY KONTEKST: ${context}` : ''}
KATEGORIA: ${category || 'general'}

Wygeneruj gotowy prompt do skopiowania.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Błąd API OpenAI' });
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    // Szacunkowy koszt (do trackingu)
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const estimatedCost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000; // USD

    return res.status(200).json({
      prompt: generatedPrompt,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      cost_usd: estimatedCost.toFixed(6)
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas generowania' });
  }
}
