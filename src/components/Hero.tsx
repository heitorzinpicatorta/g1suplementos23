import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useStore } from "@/context/StoreContext";

const FadeIn = ({ children, d = 0, className = "" }: { children: React.ReactNode; d?: number; className?: string }) => (
  <div
    className={className}
    style={{ animation: "fadeSlideUp 0.5s ease forwards", animationDelay: `${d}ms`, opacity: 0 }}
  >
    {children}
  </div>
);

export function Hero({ onAddToCart, onViewDetails }: { onAddToCart?: (p: any) => void; onViewDetails?: (p: any) => void }) {
  const { isDark } = useTheme();
  const { settings } = useStore();

  const hasBannerImage = settings.heroBannerImage && settings.heroBannerImage.trim() !== "";

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: isDark ? "#0a0a0a" : "#f8f8f8",
        minHeight: hasBannerImage ? "420px" : "340px",
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {hasBannerImage ? (
        /* ── Banner image mode ── */
        <div className="relative w-full h-full" style={{ minHeight: "420px" }}>
          <img
            src={settings.heroBannerImage}
            alt="Banner"
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: "420px" }}
          />
          {/* dark overlay so text stays readable */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
        </div>
      ) : (
        /* ── Original centered text mode ── */
        <div className="relative max-w-6xl mx-auto text-center px-6 pt-20 pb-16">
          <FadeIn d={0}>
            <span
              className="inline-block font-mono text-xs tracking-widest uppercase px-3 py-1 mb-6"
              style={{
                border: `1px solid ${isDark ? "#222" : "#e5e5e5"}`,
                color: "#f97316",
                backgroundColor: isDark ? "transparent" : "#fff",
              }}
            >
              PERFORMANCE · SAÚDE · RESULTADOS
            </span>
          </FadeIn>

          <FadeIn d={100}>
            <h1
              className="font-black mb-5 leading-none"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(3.5rem, 10vw, 7rem)",
                letterSpacing: "-0.02em",
                color: isDark ? "#ffffff" : "#111111",
              }}
            >
              SUPLEMENTOS
              <br />
              <span
                style={{
                  color: "#f97316",
                  WebkitTextStroke: "2px #f97316",
                  WebkitTextFillColor: "transparent",
                }}
              >
                DE ELITE
              </span>
            </h1>
          </FadeIn>

          <FadeIn d={200}>
            <p
              className="text-sm mx-auto"
              style={{
                color: isDark ? "#666" : "#777",
                maxWidth: "480px",
                lineHeight: 1.7,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.78rem",
              }}
            >
              Produtos selecionados para quem leva performance a sério.
              <br />
              Qualidade certificada, preços diretos.
            </p>
          </FadeIn>
        </div>
      )}
    </section>
  );
}
