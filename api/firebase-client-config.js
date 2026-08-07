function createHandler(environment) {
  const env = environment || process.env;

  return function handler(req, res) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
      return res.status(405).send('window.__AITEAM_FIREBASE_CONFIG_ERROR__ = true;');
    }

    const projectId = String(env.FIREBASE_PROJECT_ID || 'ai-team-zlecenia').trim();
    const apiKey = String(env.FIREBASE_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(503).send('window.__AITEAM_FIREBASE_CONFIG_ERROR__ = true;');
    }

    const config = {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      messagingSenderId: String(env.FIREBASE_MESSAGING_SENDER_ID || '715537035293').trim(),
      appId: String(env.FIREBASE_APP_ID || '1:715537035293:web:fe2978df1e20bfc3e0d6f4').trim(),
      measurementId: String(env.FIREBASE_MEASUREMENT_ID || 'G-N62YHVDCKC').trim(),
    };

    return res.status(200).send(`window.__AITEAM_FIREBASE_CONFIG__ = ${JSON.stringify(config)};`);
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
