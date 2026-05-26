import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  const { isDark } = useTheme();

  const bg = isDark ? "#080808" : "#f8f8f8";
  const border = isDark ? "#1a1a1a" : "#e5e5e5";
  const textPrimary = isDark ? "#e8e8e8" : "#111";
  const textMuted = isDark ? "#444" : "#aaa";
  const cardBg = isDark ? "#111" : "#fff";

  const paymentMethods = [
    { label: "PIX", color: "#22c55e" },
    { label: "VISA", color: "#1a1f71" },
    { label: "MASTER", color: "#eb001b" },
    { label: "BOLETO", color: "#666" },
    { label: "ELO", color: "#f97316" },
    { label: "AMEX", color: "#2e77bc" },
  ];

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, marginTop: "auto" }}>
      {/* Payment seals row */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: textMuted, marginRight: 4 }}>FORMAS DE PAGAMENTO</span>
          {paymentMethods.map((m) => (
            <span key={m.label} style={{ padding: "3px 9px", border: `1px solid ${isDark ? "#222" : "#e5e5e5"}`, background: cardBg, fontSize: "0.55rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: "0.1em", color: m.color }}>
              {m.label}
            </span>
          ))}
          <span style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e" }}>
            <Lock size={10} />SSL SEGURO
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: isDark ? "#444" : "#aaa" }}>
            <Shield size={10} />COMPRA PROTEGIDA
          </span>
        </div>
      </div>

      {/* Main footer content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 24px 20px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
        {/* Left: brand */}
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>G1%</div>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#f97316", textTransform: "uppercase", marginBottom: 10 }}>SUPLEMENTOS</div>
          <p style={{ fontSize: "0.62rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, maxWidth: 200 }}>
            Suplementos de qualidade com procedência garantida e entrega segura.
          </p>
        </div>

        {/* Center: owner info */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginBottom: 8 }}>RESPONSÁVEL</div>
          <div style={{ fontSize: "0.72rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: textPrimary, letterSpacing: "0.04em", marginBottom: 4 }}>
            PATRÍCIA VIEIRA GARCIA
          </div>
          <div style={{ fontSize: "0.58rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7 }}>
            CNPJ: 64.648.952/0001-07<br />
            Responsável Legal
          </div>
        </div>

        {/* Right: links + compliance */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginBottom: 8 }}>INFORMAÇÕES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            {["Política de Privacidade", "Termos de Uso", "Trocas e Devoluções", "Fale Conosco"].map((link) => (
              <span key={link} style={{ fontSize: "0.6rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace", cursor: "default" }}>{link}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: `1px solid ${border}`, padding: "12px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: "0.55rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>
            © {new Date().getFullYear()} G1% Suplementos · Todos os direitos reservados
          </span>
          <span style={{ fontSize: "0.55rem", color: isDark ? "#2a2a2a" : "#ccc", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>
            Mercado Pago · Pagamento 100% seguro
          </span>
        </div>
      </div>
    </footer>
  );
}
