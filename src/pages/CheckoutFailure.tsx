import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { useOrders } from "@/context/OrdersContext";
import { XCircle } from "lucide-react";
import { Footer } from "@/components/Footer";

const REDIRECT_SECONDS = 5;

export function CheckoutFailure() {
  const { isDark } = useTheme();
  const { updateOrderStatus } = useOrders();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preferenceId = params.get("preference_id");
    if (preferenceId) {
      updateOrderStatus(preferenceId, "rejected");
    }

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
            <XCircle size={64} style={{ color: "#ef4444" }} />
          </div>

          <h1
            className="font-bold mb-3 uppercase tracking-widest font-mono"
            style={{ color: isDark ? "#fff" : "#111", fontSize: "1.5rem" }}
          >
            Pagamento Recusado
          </h1>

          <p className="text-sm mb-6" style={{ color: isDark ? "#888" : "#666" }}>
            Não foi possível processar o pagamento. Verifique seus dados ou escolha outro método.
          </p>

          {/* Countdown bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: isDark ? "#1a1a1a" : "#f0f0f0", height: 3, width: "100%", overflow: "hidden" }}>
              <div
                style={{
                  background: "#ef4444",
                  height: "100%",
                  width: `${(countdown / REDIRECT_SECONDS) * 100}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p className="font-mono text-xs mt-2" style={{ color: isDark ? "#555" : "#aaa", letterSpacing: "0.1em" }}>
              REDIRECIONANDO EM {countdown}s
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase"
              style={{ background: "#f97316", border: "none", cursor: "pointer", color: "#000" }}
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => setLocation("/pedidos")}
              className="w-full py-3 font-mono text-sm tracking-widest uppercase"
              style={{ color: isDark ? "#666" : "#888", border: `1px solid ${border}`, background: "transparent", cursor: "pointer" }}
            >
              Ver Meus Pedidos
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
