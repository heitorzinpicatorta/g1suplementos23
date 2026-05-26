import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Star, Minus, Plus } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FadeIn = ({ children, d = 0, className = "" }: { children: React.ReactNode, d?: number, className?: string }) => (
  <div
    className={className}
    style={{
      animation: `fadeSlideUp 0.5s ease forwards`,
      animationDelay: `${d}ms`,
      opacity: 0,
    }}
  >
    {children}
  </div>
);

function StarRating({ rating, reviewCount, isDark }: { rating: number; reviewCount: number; isDark: boolean }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={10} fill="#f97316" stroke="none" />
        ))}
        {half && (
          <span style={{ position: "relative", display: "inline-block", width: 10, height: 10 }}>
            <Star size={10} fill={isDark ? "#2a2a2a" : "#e5e5e5"} stroke="none" style={{ position: "absolute" }} />
            <span style={{ position: "absolute", overflow: "hidden", width: "50%" }}>
              <Star size={10} fill="#f97316" stroke="none" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={10} fill={isDark ? "#2a2a2a" : "#e5e5e5"} stroke="none" />
        ))}
      </div>
      <span className="font-mono" style={{ fontSize: "0.6rem", color: isDark ? "#555" : "#999" }}>
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function ProductCardSkeleton({ isDark }: { isDark: boolean }) {
  const shimmer = isDark ? "#1e1e1e" : "#ececec";
  const shimmerLight = isDark ? "#2a2a2a" : "#f5f5f5";
  return (
    <div
      className="flex flex-col h-full border"
      style={{ background: isDark ? "#111111" : "#ffffff", borderColor: isDark ? "#222" : "#e5e5e5" }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, ${shimmer} 25%, ${shimmerLight} 50%, ${shimmer} 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>
      {/* Image area */}
      <div className="skeleton-pulse" style={{ aspectRatio: "1/1", width: "100%" }} />
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="skeleton-pulse h-3 w-16 rounded" />
        <div className="skeleton-pulse h-5 w-3/4 rounded" />
        <div className="skeleton-pulse h-3 w-24 rounded" />
        <div className="skeleton-pulse h-3 w-full rounded" />
        <div className="skeleton-pulse h-3 w-2/3 rounded" />
        <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${isDark ? "#1e1e1e" : "#eee"}` }}>
          <div className="skeleton-pulse h-6 w-28 rounded mb-2" />
          <div className="skeleton-pulse h-3 w-36 rounded" />
        </div>
        <div className="skeleton-pulse h-10 w-full rounded mt-2" />
        <div className="skeleton-pulse h-8 w-full rounded" />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function ProductCard({ product, onAddToCart, onViewDetails, index }: any) {
  const { isDark } = useTheme();
  const [adding, setAdding] = useState(false);
  const [hover, setHover] = useState(false);
  const [qty, setQty] = useState(1);

  const handleAdd = async () => {
    if (!product.inStock) return;
    setAdding(true);
    await delay(500);
    onAddToCart(product, qty);
    setAdding(false);
    setQty(1);
  };

  return (
    <FadeIn d={index * 120} className="h-full">
      <div
        className="group relative flex flex-col h-full border transition-all duration-300"
        style={{
          background: isDark ? "#111111" : "#ffffff",
          borderColor: hover ? "#f97316" : isDark ? "#222222" : "#e5e5e5",
          transform: hover ? "translateY(-2px)" : "translateY(0)",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-xs font-mono font-bold px-2 py-1 tracking-widest uppercase"
              style={{
                background: product.badge === "ESGOTADO" ? (isDark ? "#262626" : "#e5e5e5") : "#f97316",
                color: product.badge === "ESGOTADO" ? (isDark ? "#666" : "#888") : "#000",
              }}>
              {product.badge}
            </span>
          </div>
        )}

        {product.discount > 0 && product.inStock && (
          <div className="absolute top-3 right-3 z-10">
            <span className="font-mono text-xs font-bold" style={{ color: "#f97316" }}>-{product.discount}%</span>
          </div>
        )}

        <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: isDark ? "#0d0d0d" : "#f4f4f4" }}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500"
            style={{
              transform: hover ? "scale(1.05)" : "scale(1)",
              filter: !product.inStock ? "grayscale(0.8) opacity(0.5)" : "none",
            }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          }} />
        </div>

        <div className="flex flex-col flex-1 p-4 gap-2">
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: isDark ? "#555" : "#777" }}>
            {product.categories?.[0] ?? product.category}
          </span>
          <h3 className="font-bold leading-tight"
            style={{ color: isDark ? "#e8e8e8" : "#111111", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", letterSpacing: "0.02em" }}>
            {product.name}
          </h3>

          {product.rating != null && (
            <StarRating rating={product.rating} reviewCount={product.reviewCount ?? 0} isDark={isDark} />
          )}

          <p className="text-xs leading-relaxed" style={{ color: isDark ? "#555" : "#666", flexGrow: 1 }}>
            {product.description}
          </p>

          <span className="font-mono text-xs" style={{ color: isDark ? "#333" : "#999" }}>SKU: {product.sku}</span>

          <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${isDark ? "#1e1e1e" : "#eee"}` }}>
            {product.inStock ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-xs line-through" style={{ color: isDark ? "#444" : "#999" }}>
                    {fmt(product.priceFrom)}
                  </span>
                  <span className="font-mono font-bold text-lg" style={{ color: "#f97316" }}>
                    {fmt(product.priceTo)}
                  </span>
                </div>
                <span className="font-mono text-xs" style={{ color: isDark ? "#555" : "#777" }}>
                  {product.installments.count}x de {fmt(product.installments.value)} s/ juros
                </span>
              </>
            ) : (
              <span className="font-mono text-sm font-bold" style={{ color: isDark ? "#444" : "#999" }}>INDISPONÍVEL</span>
            )}
          </div>

          {/* Qty selector — only when in stock */}
          {product.inStock && (
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-xs" style={{ color: isDark ? "#555" : "#777" }}>Quantidade:</span>
              <div className="flex items-center" style={{ border: `1px solid ${isDark ? "#2a2a2a" : "#ddd"}` }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center transition-colors"
                  style={{ color: isDark ? "#666" : "#888", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center font-mono text-xs" style={{ color: isDark ? "#fff" : "#111" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ color: isDark ? "#666" : "#888", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!product.inStock || adding}
            className="w-full py-3 text-xs font-mono font-bold tracking-widest uppercase transition-all duration-200 mt-2 relative overflow-hidden"
            style={{
              background: !product.inStock ? (isDark ? "#1a1a1a" : "#eaeaea") : adding ? "#c2410c" : "#f97316",
              color: !product.inStock ? (isDark ? "#333" : "#999") : "#000",
              cursor: !product.inStock ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            {adding ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                ADICIONANDO
              </span>
            ) : product.inStock ? (
              qty > 1 ? `ADICIONAR ${qty}x AO CARRINHO` : "ADICIONAR AO CARRINHO"
            ) : (
              "PRODUTO ESGOTADO"
            )}
          </button>

          <button
            onClick={() => onViewDetails?.(product)}
            className="w-full py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200"
            style={{
              background: "transparent",
              color: isDark ? "#555" : "#888",
              cursor: "pointer",
              border: `1px solid ${isDark ? "#222" : "#e5e5e5"}`,
            }}
          >
            VER DETALHES
          </button>
        </div>
      </div>
    </FadeIn>
  );
}
