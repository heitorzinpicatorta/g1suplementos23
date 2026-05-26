import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

// ─── Carregar .env manualmente (Apenas para rodar local) ──────────────────
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
} catch {
  // Ignora erro se o arquivo .env não existir (comum em produção/Railway)
}

// ─── Variáveis obrigatórias ────────────────────────────────────────────────
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

// Log de aviso mas sem travar o boot imediatamente (ajuda a ver o erro no log do Railway)
if (!MP_ACCESS_TOKEN) console.error("⚠️ AVISO: MP_ACCESS_TOKEN não encontrado nas variáveis.");
if (!ADMIN_USER || !ADMIN_PASS) console.error("⚠️ AVISO: Credenciais ADMIN não configuradas.");

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
// Health check (Essencial para o Railway saber que o app está vivo)
// ══════════════════════════════════════════════════════════════════════════
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send("Backend G1 Suplementos Online 🚀"));

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Login admin
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body ?? {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return res.json({ ok: true });
  }
  setTimeout(() => res.status(401).json({ error: "Credenciais inválidas." }), 400);
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Checkout Pro (Preference)
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/checkout", async (req, res) => {
  try {
    const { items, payer, address } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Nenhum item no carrinho." });
    }

    const payerObj = {
      email: payer?.email || "comprador@teste.com",
      ...(payer?.firstName && { first_name: payer.firstName }),
      ...(payer?.lastName  && { last_name:  payer.lastName  }),
      ...(payer?.cpf       && {
        identification: { type: "CPF", number: payer.cpf.replace(/\D/g, "") },
      }),
    };

    const shipmentObj = address
      ? {
          shipments: {
            receiver_address: {
              zip_code:      address.zip?.replace(/\D/g, ""),
              street_name:   address.street,
              street_number: address.number,
              ...(address.complement && { apartment: address.complement }),
              city_name:     address.city,
              state_name:    address.state,
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
      back_urls: {
        success: `${FRONTEND_URL}/checkout/success`,
        failure: `${FRONTEND_URL}/checkout/failure`,
        pending: `${FRONTEND_URL}/checkout/pending`,
      },
      ...(FRONTEND_URL.startsWith("http://localhost") ? {} : { auto_return: "approved" }),
      payment_methods: { installments: 12 },
      statement_descriptor: STORE_NAME,
      ...shipmentObj,
    };

    const data = await mpFetch("/checkout/preferences", "POST", preference);
    res.json({
      preferenceId:     data.id,
      sandboxInitPoint: data.sandbox_init_point,
      initPoint:        data.init_point,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ROTA: Gerar pagamento PIX
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
    return res.status(err.status || 500).json({ error: err.message || "Erro interno ao gerar PIX" });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// Outras rotas (Status e Webhook)
// ══════════════════════════════════════════════════════════════════════════
app.get("/api/payment/:id", async (req, res) => {
  try {
    const result = await mpFetch(`/v1/payments/${req.params.id}`);
    return res.json({ id: result.id, status: result.status, amount: result.transaction_amount });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/api/webhook", async (req, res) => {
  const { type, data } = req.body;
  if (type === "payment" && data?.id) {
    try {
      const result = await mpFetch(`/v1/payments/${data.id}`);
      console.log(`📦 Pagamento ${result.id} → status: ${result.status}`);
    } catch (err) {
      console.error("Erro no webhook:", err);
    }
  }
  return res.sendStatus(200);
});

// ─── Start (Ajustado para o Railway) ───────────────────────────────────────
const PORT = process.env.PORT || 3001; // Railway usa process.env.PORT automaticamente
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend ON na porta ${PORT} (bind 0.0.0.0)`);
});
