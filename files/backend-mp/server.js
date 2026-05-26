import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

dotenv.config();

// ─── Validação das variáveis de ambiente ───────────────────────────────────
if (!process.env.MP_ACCESS_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN não encontrado no .env");
  process.exit(1);
}

// ─── Configuração do SDK ───────────────────────────────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const payment = new Payment(mpClient);
const preference = new Preference(mpClient);

// ─── Express ────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Libera o front-end local (ajuste a origin em produção)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

// ════════════════════════════════════════════════════════════════════════════
// Health checks — CRÍTICO para Railway
// ════════════════════════════════════════════════════════════════════════════

// GET /health — Usado pelo Railway
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET / — Raiz da API
app.get("/", (_req, res) => {
  res.status(200).json({ 
    message: "✅ Backend Mercado Pago API Online",
    version: "1.0.0"
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ROTA 1 — Gerar pagamento PIX
// Body esperado:
//   { amount: number, description: string, payer: { email, firstName, lastName, cpf } }
// ════════════════════════════════════════════════════════════════════════════
app.post("/api/pix", async (req, res) => {
  const { amount, description, payer } = req.body;

  if (!amount || !payer?.email) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: amount e payer.email" });
  }

  try {
    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description || "Pedido loja de suplementos",
        payment_method_id: "pix",
        payer: {
          email: payer.email,
          first_name: payer.firstName || "",
          last_name: payer.lastName || "",
          identification: payer.cpf
            ? { type: "CPF", number: payer.cpf.replace(/\D/g, "") }
            : undefined,
        },
      },
      requestOptions: { idempotencyKey: crypto.randomUUID() },
    });

    // Retorna só o que o front precisa para exibir o QR Code
    return res.json({
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64:
        result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
      expiresAt: result.date_of_expiration,
    });
  } catch (err) {
    console.error("❌ Erro ao criar PIX:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao gerar PIX" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROTA 2 — Gerar Preference (Checkout Pro / redirect)
// Body esperado:
//   { items: [{ title, quantity, unit_price }], payer: { email } }
// ════════════════════════════════════════════════════════════════════════════
app.post("/api/checkout", async (req, res) => {
  const { items, payer } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: "items é obrigatório" });
  }

  try {
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "BRL",
        })),
        payer: payer ? { email: payer.email } : undefined,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: "approved",
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
        statement_descriptor: process.env.STORE_NAME || "Loja Suplementos",
      },
    });

    return res.json({
      preferenceId: result.id,
      initPoint: result.init_point,        // URL de redirect (produção)
      sandboxInitPoint: result.sandbox_init_point, // URL de redirect (sandbox)
    });
  } catch (err) {
    console.error("❌ Erro ao criar preference:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Erro interno ao criar checkout" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROTA 3 — Consultar status de um pagamento
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/payment/:id", async (req, res) => {
  try {
    const result = await payment.get({ id: req.params.id });
    return res.json({
      id: result.id,
      status: result.status,
      statusDetail: result.status_detail,
      amount: result.transaction_amount,
    });
  } catch (err) {
    console.error("❌ Erro ao buscar pagamento:", err.message);
    return res.status(500).json({ error: err?.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROTA 4 — Webhook (Mercado Pago notifica aqui quando o pagamento muda)
// Configure em: https://www.mercadopago.com.br/developers/panel/webhooks
// ════════════════════════════════════════════════════════════════════════════
app.post("/api/webhook", async (req, res) => {
  const { type, data } = req.body;

  if (type === "payment" && data?.id) {
    try {
      const result = await payment.get({ id: data.id });
      console.log(
        `📦 Pagamento ${result.id} → status: ${result.status}`
      );
      // TODO: atualize seu banco de dados aqui
    } catch (err) {
      console.error("❌ Erro no webhook:", err);
    }
  }

  // Sempre responda 200 para o Mercado Pago parar de reenviar
  return res.sendStatus(200);
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌ Erro não tratado:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Erro interno do servidor" 
  });
});

// ─── Start (Otimizado para Railway) ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 ═══════════════════════════════════════════════════════════════`);
  console.log(`✅ Backend Mercado Pago ONLINE!`);
  console.log(`📍 Rodando em: ${HOST}:${PORT}`);
  console.log(`🏥 Health check: GET /health`);
  console.log(`💳 PIX:          POST /api/pix`);
  console.log(`🛒 Checkout:     POST /api/checkout`);
  console.log(`📊 Status:       GET  /api/payment/:id`);
  console.log(`🔔 Webhook:      POST /api/webhook`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);
});

// ─── Graceful Shutdown (Importante para Railway) ────────────────────────────
process.on("SIGTERM", () => {
  console.log("\n📭 SIGTERM recebido, encerrando gracefully...");
  server.close(() => {
    console.log("✅ Servidor encerrado com sucesso");
    process.exit(0);
  });
  // Force exit após 10s
  setTimeout(() => {
    console.error("❌ Timeout no graceful shutdown, forçando saída");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", () => {
  console.log("\n📭 SIGINT recebido, encerrando gracefully...");
  server.close(() => {
    console.log("✅ Servidor encerrado com sucesso");
    process.exit(0);
  });
});

// ─── Tratamento de exceções não capturadas ──────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("❌ Exceção não capturada:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promise rejection não tratada:", reason);
  process.exit(1);
});
