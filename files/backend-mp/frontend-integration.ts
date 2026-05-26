// ══════════════════════════════════════════════════════════════════════════
//  GUIA DE INTEGRAÇÃO — CheckoutModal.tsx
//  Cole/adapte os trechos abaixo no seu componente existente.
// ══════════════════════════════════════════════════════════════════════════

// ─── 1. No .env do Vite (frontend) ─────────────────────────────────────────
// VITE_API_URL=http://localhost:3001
// VITE_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx


// ─── 2. Tipos ───────────────────────────────────────────────────────────────
interface PixResponse {
  id: number;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
}

interface CheckoutResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}


// ─── 3. Função — Gerar PIX ──────────────────────────────────────────────────
export async function gerarPix(
  amount: number,
  payer: { email: string; firstName: string; lastName: string; cpf: string }
): Promise<PixResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      description: "Pedido loja de suplementos",
      payer,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao gerar PIX");
  }

  return res.json();
}


// ─── 4. Função — Checkout Pro (cartão / boleto via redirect) ────────────────
export async function gerarCheckout(
  items: { title: string; quantity: number; unit_price: number }[],
  payerEmail?: string
): Promise<CheckoutResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      payer: payerEmail ? { email: payerEmail } : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao criar checkout");
  }

  return res.json();
}


// ─── 5. Função — Verificar status de um pagamento ───────────────────────────
export async function verificarPagamento(paymentId: number | string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/payment/${paymentId}`
  );
  return res.json();
}


// ─── 6. Exemplo de uso dentro do CheckoutModal ──────────────────────────────
/*
  // --- Pix ---
  const handlePixPayment = async () => {
    setLoading(true);
    try {
      const pix = await gerarPix(totalAmount, {
        email: formData.email,
        firstName: formData.nome.split(" ")[0],
        lastName:  formData.nome.split(" ").slice(1).join(" "),
        cpf: formData.cpf,
      });

      setPixData(pix);          // guarda qrCode / qrCodeBase64
      setStep("pix-qrcode");    // muda o passo do modal

      // Polling: verifica se o usuário pagou
      const interval = setInterval(async () => {
        const status = await verificarPagamento(pix.id);
        if (status.status === "approved") {
          clearInterval(interval);
          setStep("success");
        }
      }, 5000); // a cada 5 segundos

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // --- Checkout Pro (cartão / boleto) ---
  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const checkout = await gerarCheckout(
        cartItems.map((i) => ({
          title: i.name,
          quantity: i.qty,
          unit_price: i.price,
        })),
        formData.email
      );

      // Redireciona para a página de pagamento do Mercado Pago
      // Em DEV use sandboxInitPoint; em PROD use initPoint
      window.location.href = import.meta.env.DEV
        ? checkout.sandboxInitPoint
        : checkout.initPoint;

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
*/
