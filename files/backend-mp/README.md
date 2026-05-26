# Backend Mercado Pago — Loja de Suplementos

## Estrutura

```
backend-mp/
├── server.js                 ← servidor principal
├── package.json
├── .env.example              ← modelo do .env (NÃO commitar o .env real)
└── frontend-integration.ts  ← trechos prontos para colar no React
```

---

## Setup rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o .env
```bash
cp .env.example .env
```
Edite o `.env` com suas chaves do Mercado Pago.

### 3. Onde pegar as chaves
1. Acesse https://www.mercadopago.com.br/developers/panel/app
2. Crie um novo aplicativo (ou use um existente)
3. Na aba **Credenciais de teste**, copie:
   - `Access Token` → `MP_ACCESS_TOKEN` no .env do backend
   - `Public Key`   → `VITE_MP_PUBLIC_KEY` no .env do frontend (Vite)
4. Quando for colocar em produção, repita com as **Credenciais de produção**

### 4. Rodar o servidor
```bash
# Desenvolvimento (reinicia ao salvar)
npm run dev

# Produção
npm start
```

---

## Rotas disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/pix` | Gera pagamento PIX com QR Code |
| POST | `/api/checkout` | Gera Preference para Checkout Pro |
| GET  | `/api/payment/:id` | Consulta status de pagamento |
| POST | `/api/webhook` | Recebe notificações do Mercado Pago |

---

## Integração com o frontend React/Vite

1. Adicione no `.env` do seu projeto Vite:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_MP_PUBLIC_KEY=TEST-xxxxxxxx...
   ```

2. Copie os trechos de `frontend-integration.ts` para o seu `CheckoutModal.tsx`

3. Substitua as chamadas antigas (ex: direto para a API do MP) pelas funções
   `gerarPix()`, `gerarCheckout()` e `verificarPagamento()`

---

## Webhook (notificações automáticas)

Para receber notificações quando o pagamento for aprovado/rejeitado:

1. Em produção, configure a URL do webhook no painel:
   https://www.mercadopago.com.br/developers/panel/webhooks
   
2. URL a configurar: `https://SEU_DOMINIO/api/webhook`

3. Em desenvolvimento, use o **ngrok** para expor o localhost:
   ```bash
   npx ngrok http 3001
   # Use a URL gerada como webhook no painel do MP
   ```

---

## Testando pagamentos

Use os cartões de teste do Mercado Pago:
- **Aprovado**: 5031 7557 3453 0604 / CVV: 123 / Venc: 11/25
- **Recusado**: 4000 0000 0000 0002
- **CPF para testes**: 12345678909

Documentação completa: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/test
