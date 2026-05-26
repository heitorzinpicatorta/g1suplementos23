# G1% Suplementos — Projeto Completo

Projeto React + Vite (frontend) + Node.js/Express (backend) com integração real ao Mercado Pago.

---

## Estrutura de pastas

```
g1-projeto/                    ← Raiz do frontend (React + Vite)
├── src/
│   ├── App.tsx                ← Rotas (wouter)
│   ├── main.tsx
│   ├── index.css
│   ├── pages/
│   │   ├── Home.tsx           ← Loja principal
│   │   ├── Admin.tsx          ← Painel admin (protegido)
│   │   ├── Login.tsx          ← Login do admin
│   │   ├── Pedidos.tsx        ← Área do cliente
│   │   ├── CheckoutSuccess.tsx
│   │   ├── CheckoutPending.tsx
│   │   ├── CheckoutFailure.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── CheckoutModal.tsx  ← Integração com /api/checkout
│   │   ├── CartDrawer.tsx
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── ProductCard.tsx
│   │   ├── Footer.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── StoreContext.tsx
│   │   └── OrdersContext.tsx
│   ├── data/products.ts
│   ├── hooks/use-toast.ts
│   └── lib/utils.ts
├── .env.example               ← Copie para .env
├── package.json
├── vite.config.ts             ← proxy /api → localhost:3001
├── tailwind.config.js
└── tsconfig.json

backend/                       ← Backend Node.js (server.js do passo anterior)
├── server.js
├── package.json
└── .env.example
```

---

## Rotas do frontend

| Caminho               | Componente          | Proteção     |
|-----------------------|---------------------|--------------|
| `/`                   | `Home`              | Pública      |
| `/login`              | `Login`             | Pública      |
| `/pedidos`            | `Pedidos`           | Pública      |
| `/admin`              | `Admin`             | Requer login |
| `/checkout/success`   | `CheckoutSuccess`   | Pública      |
| `/checkout/failure`   | `CheckoutFailure`   | Pública      |
| `/checkout/pending`   | `CheckoutPending`   | Pública      |

---

## Setup

### 1. Frontend

```bash
cd g1-projeto
npm install
cp .env.example .env     # edite com suas configurações
npm run dev              # abre em http://localhost:5173
```

### 2. Backend

```bash
cd backend               # pasta do server.js gerado anteriormente
npm install
cp .env.example .env     # coloque seu MP_ACCESS_TOKEN
npm run dev              # roda em http://localhost:3001
```

> O Vite já está configurado com proxy: qualquer chamada a `/api/*`
> do frontend é automaticamente redirecionada para `http://localhost:3001`.
> Em produção, configure CORS no backend apontando para seu domínio.

---

## Fluxo de checkout

```
Cliente clica "Finalizar" 
  → CheckoutModal coleta e-mail
  → POST /api/checkout (backend)
  → Mercado Pago cria Preference
  → Redireciona para sandboxInitPoint (DEV) ou initPoint (PROD)
  → MP redireciona de volta para /checkout/success|failure|pending
  → Página atualiza status do pedido no OrdersContext (localStorage)
  → Admin vê status em /admin → aba Vendas
```

---

## Credenciais padrão do admin

Definidas no `.env` do frontend:
- Usuário: `admin` (ou `VITE_ADMIN_USER`)
- Senha: a que você definir em `VITE_ADMIN_PASS`

Se não definir as variáveis, o fallback é `gostrider1987` / `gostrider1987`
(veja `src/context/AuthContext.tsx`).

---

## Back-URLs do Mercado Pago

Configure no `backend/.env`:
```
FRONTEND_URL=http://localhost:5173
```

Em produção, troque pelo domínio real. O backend já monta as back_urls
automaticamente:
- `/checkout/success`
- `/checkout/failure`
- `/checkout/pending`
"# g1suplementos23" 
