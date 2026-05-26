import React from "react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { useOrders, type Order, type OrderStatus } from "@/context/OrdersContext";
import { useStore } from "@/context/StoreContext";
import { Footer } from "@/components/Footer";
import { ShoppingBag, ArrowLeft, Package, CheckCircle2, XCircle, Clock, Moon, Sun } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    pending:   { label: "Pendente",   color: "#f59e0b", bg: "#f59e0b18", Icon: Clock },
    approved:  { label: "Aprovado",   color: "#22c55e", bg: "#22c55e18", Icon: CheckCircle2 },
    rejected:  { label: "Cancelado",  color: "#ef4444", bg: "#ef444418", Icon: XCircle },
    cancelled: { label: "Cancelado",  color: "#ef4444", bg: "#ef444418", Icon: XCircle },
  };
  const { label, color, bg, Icon } = map[status] ?? map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: bg, border: `1px solid ${color}44`, fontSize: "0.6rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", textTransform: "uppercase", color, fontWeight: 700 }}>
      <Icon size={10} />{label}
    </span>
  );
}

function OrderCard({ order, isDark, border }: { order: Order; isDark: boolean; border: string }) {
  const cardBg = isDark ? "#111" : "#fff";
  const textPrimary = isDark ? "#e8e8e8" : "#111";
  const textMuted = isDark ? "#555" : "#888";

  const dateStr = new Date(order.date).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${border}`, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: textMuted, marginBottom: 3 }}>PEDIDO</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", fontWeight: 700, color: textPrimary }}>{order.id}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div style={{ padding: "12px 18px" }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${border}` : "none" }}>
            {item.image && (
              <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: "contain", background: isDark ? "#0d0d0d" : "#f5f5f5", padding: 3, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: textPrimary, letterSpacing: "0.02em" }}>{item.name}</div>
              <div style={{ fontSize: "0.6rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace" }}>Qtd: {item.qty} · {fmt(item.priceTo)} cada</div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#f97316", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.priceTo * item.qty)}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: "0.58rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{dateStr}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.6rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>TOTAL</span>
          <span style={{ fontSize: "1rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: textPrimary }}>{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

export function Pedidos() {
  const { isDark, toggleTheme } = useTheme();
  const { orders } = useOrders();
  const { settings } = useStore();

  const bg = isDark ? "#0a0a0a" : "#f4f4f4";
  const border = isDark ? "#1e1e1e" : "#e5e5e5";
  const textPrimary = isDark ? "#e8e8e8" : "#111";
  const textMuted = isDark ? "#555" : "#888";
  const headerBg = isDark ? "#080808" : "#fff";

  const totalGasto = orders.filter((o) => o.status === "approved").reduce((s, o) => s + o.total, 0);

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono',monospace" }}>
      {/* Header */}
      <header style={{ background: headerBg, borderBottom: `1px solid ${border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }}>
            <ArrowLeft size={16} style={{ color: textMuted }} />
            <div>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.3rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.02em" }}>G1%</span>
              <span style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#f97316", textTransform: "uppercase", display: "block", lineHeight: 1, marginTop: -2 }}>SUPLEMENTOS</span>
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ShoppingBag size={14} style={{ color: "#f97316" }} />
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: textPrimary, fontWeight: 700 }}>ÁREA DO CLIENTE</span>
        </div>

        <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", padding: 4 }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px", flex: 1, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 28, height: 2, background: "#f97316", marginBottom: 8 }} />
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1, marginBottom: 6 }}>
            MEUS PEDIDOS
          </h1>
          <p style={{ fontSize: "0.6rem", color: textMuted, letterSpacing: "0.06em" }}>
            Histórico de compras deste navegador
          </p>
        </div>

        {orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            <div style={{ background: isDark ? "#111" : "#fff", border: `1px solid ${border}`, padding: "14px 18px" }}>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginBottom: 6 }}>PEDIDOS REALIZADOS</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: textPrimary }}>{orders.length}</div>
            </div>
            <div style={{ background: isDark ? "#111" : "#fff", border: `1px solid ${border}`, padding: "14px 18px" }}>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginBottom: 6 }}>TOTAL APROVADO</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: "#f97316" }}>{fmt(totalGasto)}</div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", background: isDark ? "#111" : "#fff", border: `1px solid ${border}` }}>
            <Package size={40} style={{ color: isDark ? "#2a2a2a" : "#ddd", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "0.75rem", color: textMuted, marginBottom: 4 }}>Nenhum pedido encontrado neste navegador.</p>
            <p style={{ fontSize: "0.62rem", color: isDark ? "#333" : "#ccc" }}>Os pedidos ficam salvos neste dispositivo.</p>
            <Link href="/">
              <button style={{ marginTop: 20, padding: "10px 24px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>
                IR ÀS COMPRAS
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} isDark={isDark} border={border} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
