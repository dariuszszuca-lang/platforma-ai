// Vercel Serverless Function - Telegram Notification for New Orders
// Endpoint: POST /api/notify-zlecenie

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

  const { name, email, phone, category, description, orderId, aiEstimate } = req.body;

  if (!name || !email || !description) {
    return res.status(400).json({ error: 'Brak wymaganych pól: name, email, description' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return res.status(500).json({ error: 'Błąd konfiguracji powiadomień' });
  }

  // Category labels in Polish
  const categoryLabels = {
    konsultacja: 'Konsultacja AI',
    automatyzacja: 'Automatyzacja procesu',
    narzedzie: 'Narzędzie / Aplikacja',
    wdrozenie: 'Wdrożenie AI w firmie',
    inne: 'Inne'
  };

  const categoryLabel = categoryLabels[category] || category || 'Nie określono';
  const truncatedDesc = description.length > 200 ? description.substring(0, 200) + '...' : description;
  const displayOrderId = orderId || 'brak';

  let message = `🔔 NOWE ZLECENIE: ${displayOrderId}\n\n`;
  message += `👤 Klient: ${name}\n`;
  message += `📧 Email: ${email}\n`;
  message += `📞 Tel: ${phone || 'nie podano'}\n`;
  message += `📂 Kategoria: ${categoryLabel}\n`;
  message += `📝 Opis: ${truncatedDesc}\n`;

  if (aiEstimate) {
    message += `\n🤖 AI Wycena:\n`;
    message += `⏱ Czas: ${aiEstimate.czas || '—'}\n`;
    message += `💰 Cena: ${aiEstimate.cena_min || '?'}–${aiEstimate.cena_max || '?'} PLN\n`;
    message += `📊 Złożoność: ${aiEstimate.zlozonosc || '—'}\n`;
  }

  message += `\n🔗 Panel: https://ai-team.pl/panel`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error:', response.status, errorData);
      return res.status(500).json({ error: 'Błąd wysyłania powiadomienia Telegram' });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message_id: data.result?.message_id
    });

  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: 'Błąd serwera przy wysyłaniu powiadomienia' });
  }
};
