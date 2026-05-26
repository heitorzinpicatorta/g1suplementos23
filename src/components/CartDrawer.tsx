import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { X, Trash2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CartDrawer({ open, onClose, items, onRemove, onUpdateQty, onCheckout }: any) {
  const { isDark } = useTheme();
  const total = items.reduce((s: number, i: any) => s + i.priceTo * i.qty, 0);

  // FIX 7: Confirm before removing
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleRemoveClick = (id: number) => {
    setConfirmId(id);
  };

  const handleConfirmRemove = () => {
    if (confirmId !== null) {
      onRemove(confirmId);
      setConfirmId(null);
    }
  };

  const handleCancelRemove = () => {
    setConfirmId(null);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setConfirmId(null);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: open ? "blur(6px)" : "blur(0px)",
          WebkitBackdropFilter: open ? "blur(6px)" : "blur(0px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.4s cubic-bezier(0.4,0,0.2,1), backdrop-filter 0.4s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          width: "min(420px, 100vw)",
          background: isDark ? "#0f0f0f" : "#ffffff",
          borderLeft: `1px solid ${isDark ? "#1e1e1e" : "#e5e5e5"}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${isDark ? "#1e1e1e" : "#eee"}` }}
        >
          <div>
            <h2
              className="font-bold tracking-widest uppercase text-sm font-mono"
              style={{ color: isDark ? "#fff" : "#111" }}
            >
              CARRINHO
            </h2>
            <span className="font-mono text-xs" style={{ color: isDark ? "#555" : "#777" }}>
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-sm"
            style={{ color: isDark ? "#555" : "#888", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div style={{ fontSize: "3rem", color: isDark ? "#333" : "#ccc" }}>∅</div>
              <p className="font-mono text-sm" style={{ color: isDark ? "#444" : "#888" }}>CARRINHO VAZIO</p>
              <p className="text-xs" style={{ color: isDark ? "#333" : "#aaa" }}>Adicione produtos para continuar</p>
            </div>
          ) : (
            items.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="flex gap-3 pb-4"
                style={{
                  borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#f0f0f0"}`,
                  animation: "fadeSlideUp 0.3s ease forwards",
                  animationDelay: `${idx * 40}ms`,
                  opacity: 0,
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-contain flex-shrink-0"
                  style={{ background: isDark ? "#111" : "#f9f9f9", padding: "4px" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight truncate mb-1" style={{ color: isDark ? "#fff" : "#111" }}>
                    {item.name}
                  </p>
                  <p className="font-mono text-xs mb-3" style={{ color: "#f97316" }}>{fmt(item.priceTo)}</p>

                  {/* FIX 7: Inline removal confirmation */}
                  {confirmId === item.id ? (
                    <div
                      className="flex items-center gap-2 py-1 px-2"
                      style={{ border: `1px solid ${isDark ? "#3a1a1a" : "#fde8e8"}`, background: isDark ? "#1a0a0a" : "#fff5f5" }}
                    >
                      <span className="font-mono text-xs" style={{ color: isDark ? "#f87171" : "#dc2626" }}>
                        Remover item?
                      </span>
                      <button
                        onClick={handleConfirmRemove}
                        className="font-mono text-xs px-2 py-0.5 font-bold"
                        style={{ background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        Sim
                      </button>
                      <button
                        onClick={handleCancelRemove}
                        className="font-mono text-xs px-2 py-0.5"
                        style={{ background: "transparent", color: isDark ? "#666" : "#888", border: `1px solid ${isDark ? "#333" : "#ddd"}`, cursor: "pointer" }}
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center" style={{ border: `1px solid ${isDark ? "#262626" : "#ddd"}` }}>
                        <button
                          onClick={() => onUpdateQty(item.id, item.qty - 1)}
                          className="w-7 h-7 font-mono text-sm flex items-center justify-center transition-colors"
                          style={{ color: isDark ? "#666" : "#888", background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono text-xs" style={{ color: isDark ? "#fff" : "#111" }}>
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          className="w-7 h-7 font-mono text-sm flex items-center justify-center"
                          style={{ color: isDark ? "#666" : "#888", background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveClick(item.id)}
                        style={{ color: isDark ? "#444" : "#bbb", background: "transparent", border: "none", cursor: "pointer" }}
                        className="transition-colors hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-xs font-bold" style={{ color: isDark ? "#e8e8e8" : "#111" }}>
                    {fmt(item.priceTo * item.qty)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5" style={{ borderTop: `1px solid ${isDark ? "#1e1e1e" : "#eee"}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: isDark ? "#555" : "#777" }}>
                Subtotal
              </span>
              <span className="font-mono text-lg font-bold" style={{ color: "#f97316" }}>{fmt(total)}</span>
            </div>
            <p className="font-mono text-xs mb-4" style={{ color: isDark ? "#333" : "#999" }}>
              Frete calculado no checkout
            </p>
            <button
              onClick={onCheckout}
              className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase text-black transition-all duration-200"
              style={{ background: "#f97316", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ea6a0a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f97316")}
            >
              FINALIZAR COMPRA
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 font-mono text-xs tracking-widest uppercase mt-2 transition-colors cursor-pointer"
              style={{ color: isDark ? "#444" : "#888", background: "transparent", border: "none" }}
            >
              CONTINUAR COMPRANDO
            </button>
          </div>
        )}
      </div>
    </>
  );
}
