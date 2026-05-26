import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { useOrders } from "@/context/OrdersContext";
import { CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";

const REDIRECT_SECONDS = 4;

export function CheckoutSuccess() {
  const { isDark } = useTheme();
  const { updateOrderStatus, updatePaymentId } = useOrders();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    // 1. Captura preference_id e collection_id que o MP envia na URL de redirect
    const params = new URLSearchParams(window.location.search);
    const preferenceId = params.get("preference_id");
    const paymentId    = params.get("collection_id"); // ID real do pagamento no MP
    if (preferenceId) {
      updateOrderStatus(preferenceId, "approved");
      if (paymentId) updatePaymentId(preferenceId, paymentId);
    }

    // 2. Count down and redirect to /pedidos automatically
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocation("/pedidos");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const border = isDark ? "#222" : "#e5e5e5";

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: isDark ? "#0a0a0a" : "#f8f8f8" }}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-full max-w-md p-8 text-center border"
          style={{ background: isDark ? "#111" : "#fff", borderColor: border }}
        >
          <div className="flex justify-center mb-6">
            <CheckCircle2 size={64} className="text-orange-500" />
          </div>

          <h1
            className="font-bold mb-3 uppercase tracking-widest font-mono"
            style={{ color: isDark ? "#fff" : "#111", fontSize: "1.5rem" }}
          >
            Pagamento Aprovado
          </h1>

          <p className="text-sm mb-6" style={{ color: isDark ? "#888" : "#666" }}>
            Seu pedido foi confirmado. Redirecionando para seus pedidos…
          </p>

          {/* Countdown bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: isDark ? "#1a1a1a" : "#f0f0f0", height: 3, width: "100%", overflow: "hidden" }}>
              <div
                style={{
                  background: "#f97316",
                  height: "100%",
                  width: `${(countdown / REDIRECT_SECONDS) * 100}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p
              className="font-mono text-xs mt-2"
              style={{ color: isDark ? "#555" : "#aaa", letterSpacing: "0.1em" }}
            >
              REDIRECIONANDO EM {countdown}s
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setLocation("/pedidos")}
              className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase text-black"
              style={{ background: "#f97316", border: "none", cursor: "pointer" }}
            >
              Ver Meus Pedidos Agora
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full py-3 font-mono text-sm tracking-widest uppercase"
              style={{ color: isDark ? "#666" : "#888", border: `1px solid ${border}`, background: "transparent", cursor: "pointer" }}
            >
              Voltar à Loja
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
