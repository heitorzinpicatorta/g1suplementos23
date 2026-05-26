import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

// ─── Carregar .env manualmente (sem dependência extra) ─────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

// ─── Variáveis obrigatórias ────────────────────────────────────────────────
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) {
  console.error("ERRO: MP_ACCESS_TOKEN não definido no .env");
  process.exit(1);
}

// Credenciais admin ficam APENAS no servidor — nunca no bundle JS
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
if (!ADMIN_USER || !ADMIN_PASS) {
  console.error("ERRO: ADMIN_USER e ADMIN_PASS não definidos no .env");
  process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const STORE_NAME   = process.env.STORE_NAME   || "G1 Suplementos";

// ─── Express ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// CORS — permite o frontend chamar a API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── Helper: chamar a API do Mercado Pago ──────────────────────────────────
async function mpFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.mercadopago.com${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || "Erro MP"), { status: res.status, body: data });
  return data;
}

// ══════════════════════════════════════════════════════════════════════════
// Health check
// ══════════════════════════════════════════════════════════════════════════
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Login admin
// Body: { user: string, pass: string }
// Retorna: { ok: true } ou 401
// As credenciais vivem APENAS aqui no servidor — jamais no bundle do Vite.
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body ?? {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return res.json({ ok: true });
  }
  // Delay fixo para dificultar brute-force
  setTimeout(() => res.status(401).json({ error: "Credenciais inválidas." }), 400);
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Checkout Pro (Preference)
// Body: {
//   items: [{ title, quantity, unit_price }],
//   payer: { email, firstName?, lastName?, cpf? },
//   address?: { zip, street, number, complement?, neighborhood, city, state }
// }
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/checkout", async (req, res) => {
  try {
    const { items, payer, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Nenhum item no carrinho." });
    }

    // Monta o objeto payer com CPF quando presente
    const payerObj = {
      email: payer?.email || "comprador@teste.com",
      ...(payer?.firstName && { first_name: payer.firstName }),
      ...(payer?.lastName  && { last_name:  payer.lastName  }),
      ...(payer?.cpf       && {
        identification: { type: "CPF", number: payer.cpf.replace(/\D/g, "") },
      }),
    };

    // Monta endereço quando presente
    const shipmentObj = address
      ? {
          shipments: {
            receiver_address: {
              zip_code:     address.zip?.replace(/\D/g, ""),
              street_name:  address.street,
              street_number: address.number,
              ...(address.complement && { apartment: address.complement }),
              city_name:    address.city,
              state_name:   address.state,
            },
          },
        }
      : {};

    const preference = {
      items: items.map((item) => ({
        title:       String(item.title).slice(0, 255),
        quantity:    Number(item.quantity) || 1,
        unit_price:  Number(item.unit_price),
        currency_id: "BRL",
      })),
      payer: payerObj,
      // FIX: back_urls configuradas para o MP saber pra onde redirecionar
      back_urls: {
        success: `${FRONTEND_URL}/checkout/success`,
        failure: `${FRONTEND_URL}/checkout/failure`,
        pending: `${FRONTEND_URL}/checkout/pending`,
      },
      // auto_return só funciona com URLs públicas — omite em localhost
      ...(FRONTEND_URL.startsWith("http://localhost") ? {} : { auto_return: "approved" }),
      payment_methods: {
        installments: 12,
      },
      statement_descriptor: STORE_NAME,
      ...shipmentObj,
    };

    const data = await mpFetch("/checkout/preferences", "POST", preference);

    res.json({
      preferenceId:    data.id,
      sandboxInitPoint: data.sandbox_init_point,
      initPoint:       data.init_point,
    });
  } catch (err) {
    console.error("Erro /api/checkout:", err);
    res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Gerar pagamento PIX
// Body: { amount, description, payer: { email, firstName?, lastName?, cpf? } }
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/pix", async (req, res) => {
  const { amount, description, payer } = req.body;

  if (!amount || !payer?.email) {
    return res.status(400).json({ error: "Campos obrigatórios: amount e payer.email" });
  }

  try {
    const result = await mpFetch("/v1/payments", "POST", {
      transaction_amount: Number(amount),
      description:        description || "Pedido G1 Suplementos",
      payment_method_id:  "pix",
      payer: {
        email:      payer.email,
        first_name: payer.firstName || "",
        last_name:  payer.lastName  || "",
        ...(payer.cpf && {
          identification: { type: "CPF", number: payer.cpf.replace(/\D/g, "") },
        }),
      },
    });

    return res.json({
      id:           result.id,
      status:       result.status,
      qrCode:       result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl:    result.point_of_interaction?.transaction_data?.ticket_url,
      expiresAt:    result.date_of_expiration,
    });
  } catch (err) {
    console.error("Erro /api/pix:", err);
    return res.status(err.status || 500).json({ error: err.message || "Erro interno ao gerar PIX" });
  }
});


// ══════════════════════════════════════════════════════════════════════════
// ROTA: Consultar status em lote (usado pelo polling do Admin)
// Body: { paymentIds: string[] }
// Retorna: { results: { id, status, statusDetail }[] }
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/payments/status-batch", async (req, res) => {
  const { paymentIds } = req.body;
  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    return res.status(400).json({ error: "paymentIds deve ser um array não vazio." });
  }
  // Limita a 20 IDs por chamada para não sobrecarregar a API do MP
  const ids = paymentIds.slice(0, 20);
  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await mpFetch(`/v1/payments/${id}`);
          return { id: String(r.id), status: r.status, statusDetail: r.status_detail };
        } catch {
          return { id: String(id), status: null, statusDetail: null };
        }
      })
    );
    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Consultar status de um pagamento
// GET /api/payment/:id
// ══════════════════════════════════════════════════════════════════════════
app.get("/api/payment/:id", async (req, res) => {
  try {
    const result = await mpFetch(`/v1/payments/${req.params.id}`);
    return res.json({
      id:           result.id,
      status:       result.status,
      statusDetail: result.status_detail,
      amount:       result.transaction_amount,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Webhook (Mercado Pago notifica aqui quando o pagamento muda)
// Configure em: https://www.mercadopago.com.br/developers/panel/webhooks
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/webhook", async (req, res) => {
  const { type, data } = req.body;

  if (type === "payment" && data?.id) {
    try {
      const result = await mpFetch(`/v1/payments/${data.id}`);
      console.log(`📦 Pagamento ${result.id} → status: ${result.status}`);
      // TODO: atualize seu banco de dados aqui
    } catch (err) {
      console.error("Erro no webhook:", err);
    }
  }

  // Sempre responda 200 para o Mercado Pago parar de reenviar
  return res.sendStatus(200);
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT_SERVER || 3001;
app.listen(PORT, () => {
  console.log(`✅  Backend rodando em http://localhost:${PORT}`);
  console.log(`   Admin    → POST /api/admin/login`);
  console.log(`   Checkout → POST /api/checkout`);
  console.log(`   PIX      → POST /api/pix`);
  console.log(`   Status   → GET  /api/payment/:id`);
  console.log(`   Webhook  → POST /api/webhook`);
});
