import React, { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

export interface ToastItem {
  id: string;
  productName: string;
  qty?: number;
}

interface CartToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  isDark: boolean;
}

function SingleToast({ toast, onDismiss, isDark }: { toast: ToastItem; onDismiss: (id: string) => void; isDark: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 350);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        background: isDark ? "#1a1a1a" : "#111",
        borderLeft: "3px solid #f97316",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: "13px",
        minWidth: "260px",
        maxWidth: "340px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: "auto",
      }}
    >
      <CheckCircle size={16} style={{ color: "#f97316", flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        <span style={{ color: "#f97316" }}>✓ </span>
        <strong style={{ color: "#fff" }}>{toast.qty && toast.qty > 1 ? `${toast.qty}x ` : ""}{toast.productName}</strong>
        <span style={{ color: "#888" }}> adicionado</span>
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 350); }}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: "2px", flexShrink: 0, display: "flex", alignItems: "center" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function CartToastContainer({ toasts, onDismiss, isDark }: CartToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onDismiss={onDismiss} isDark={isDark} />
      ))}
    </div>
  );
}
