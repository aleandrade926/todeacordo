export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  const VPS_BASE = "http://147.15.112.40:5000";

  // Captura tudo depois de /api/vps-proxy/
  const { path = [] } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const targetUrl = `${VPS_BASE}/${targetPath}`;

  // Headers de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (req.method === "POST" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Stream da resposta
    const contentType = response.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    res.status(response.status);

    const text = await response.text();
    return res.send(text);
  } catch (err) {
    console.error("[VPS Proxy] Erro ao conectar com a VPS:", err.message);
    return res.status(502).json({
      error: "Erro de gateway: não foi possível conectar à VPS.",
      detail: err.message,
    });
  }
}
