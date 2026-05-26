const { getDoc, getServerFirestoreToken, publicError } = require("./_async-firestore");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const id = String(req.query.id || "").trim();
    const key = String(req.query.key || "").trim();
    if (!id || !key) throw publicError(400, "Brak identyfikatora sprawy.");

    const token = await getServerFirestoreToken();
    const doc = await getDoc(`zlecenia/${id}`, token);
    if (!doc || doc.case_type !== "async" || doc.public_key !== key) {
      throw publicError(404, "Nie znaleziono sprawy albo link wygasł.");
    }

    return sendJson(res, 200, {
      ok: true,
      case: {
        id: doc.id,
        title: doc.title || "",
        category: doc.category || "",
        status: doc.status || "new",
        created_at: doc.created_at || "",
        updated_at: doc.updated_at || "",
        answered_at: doc.answered_at || "",
        response_text: doc.response_text || "",
        response_url: doc.response_url || "",
        has_answer: Boolean(doc.response_text || doc.response_url),
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("async-case error:", safeError(error));
    return sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Błąd odczytu sprawy." });
  }
};

function safeError(error) {
  return {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  };
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}
