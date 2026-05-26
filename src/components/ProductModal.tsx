import React, { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Star, X, ShoppingCart, Package } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StarRating({
  rating,
  reviewCount,
  isDark,
}: {
  rating: number;
  reviewCount: number;
  isDark: boolean;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={14} fill="#f97316" stroke="none" />
        ))}
        {half && (
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: 14,
              height: 14,
            }}
          >
            <Star
              size={14}
              fill={isDark ? "#2a2a2a" : "#e5e5e5"}
              stroke="none"
              style={{ position: "absolute" }}
            />
            <span
              style={{ position: "absolute", overflow: "hidden", width: "50%" }}
            >
              <Star size={14} fill="#f97316" stroke="none" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`e${i}`}
            size={14}
            fill={isDark ? "#2a2a2a" : "#e5e5e5"}
            stroke="none"
          />
        ))}
      </div>
      <span
        className="font-mono"
        style={{ fontSize: "0.75rem", color: isDark ? "#666" : "#888" }}
      >
        {rating.toFixed(1)} ({reviewCount} avaliações)
      </span>
    </div>
  );
}

interface ProductModalProps {
  product: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const { isDark } = useTheme();

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    // Bloquear scroll do body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const bg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#222222" : "#e5e5e5";
  const textPrimary = isDark ? "#e8e8e8" : "#111111";
  const textMuted = isDark ? "#555" : "#888";
  const overlay = isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.55)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          animation: "fadeSlideUp 0.25s ease forwards",
        }}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 10,
            background: isDark ? "#1e1e1e" : "#f0f0f0",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: textMuted,
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
          }}
          className="max-sm:block"
        >
          {/* Imagem */}
          <div
            style={{
              background: isDark ? "#0d0d0d" : "#f4f4f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              minHeight: "300px",
              position: "relative",
            }}
          >
            {product.badge && (
              <span
                className="font-mono text-xs font-bold px-2 py-1 tracking-widest uppercase"
                style={{
                  position: "absolute",
                  top: "1rem",
                  left: "1rem",
                  background:
                    product.badge === "ESGOTADO"
                      ? isDark
                        ? "#262626"
                        : "#e5e5e5"
                      : "#f97316",
                  color:
                    product.badge === "ESGOTADO"
                      ? isDark
                        ? "#666"
                        : "#888"
                      : "#000",
                }}
              >
                {product.badge}
              </span>
            )}
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                maxWidth: "240px",
                objectFit: "contain",
                filter: !product.inStock
                  ? "grayscale(0.8) opacity(0.5)"
                  : "none",
              }}
            />
          </div>

          {/* Info */}
          <div
            style={{
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Categoria */}
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: "#f97316" }}
            >
              {product.categories?.[0] ?? product.category}
            </span>

            {/* Nome */}
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: "0.02em",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {product.name}
            </h2>

            {/* Avaliação */}
            {product.rating != null && (
              <StarRating
                rating={product.rating}
                reviewCount={product.reviewCount ?? 0}
                isDark={isDark}
              />
            )}

            {/* Descrição */}
            <p
              style={{
                fontSize: "0.875rem",
                color: isDark ? "#aaa" : "#444",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {product.description}
            </p>

            {/* SKU */}
            <div
              className="flex items-center gap-2"
              style={{ color: textMuted }}
            >
              <Package size={12} />
              <span className="font-mono text-xs">SKU: {product.sku}</span>
            </div>

            {/* Divisor */}
            <div style={{ borderTop: `1px solid ${border}` }} />

            {/* Preço */}
            {product.inStock ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {product.discount > 0 && (
                  <span
                    className="font-mono text-sm line-through"
                    style={{ color: textMuted }}
                  >
                    {fmt(product.priceFrom)}
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono font-bold"
                    style={{ fontSize: "1.75rem", color: "#f97316" }}
                  >
                    {fmt(product.priceTo)}
                  </span>
                  {product.discount > 0 && (
                    <span
                      className="font-mono text-xs font-bold"
                      style={{
                        background: "#f97316",
                        color: "#000",
                        padding: "2px 6px",
                      }}
                    >
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs" style={{ color: textMuted }}>
                  ou {product.installments.count}x de{" "}
                  {fmt(product.installments.value)} sem juros
                </span>
              </div>
            ) : (
              <span
                className="font-mono font-bold"
                style={{ fontSize: "1.1rem", color: textMuted }}
              >
                INDISPONÍVEL
              </span>
            )}

            {/* Botão */}
            <button
              onClick={() => {
                if (!product.inStock) return;
                onAddToCart(product);
                onClose();
              }}
              disabled={!product.inStock}
              className="w-full py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200"
              style={{
                background: !product.inStock ? (isDark ? "#1a1a1a" : "#eaeaea") : "#f97316",
                color: !product.inStock ? (isDark ? "#333" : "#999") : "#000",
                cursor: !product.inStock ? "not-allowed" : "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <ShoppingCart size={14} />
              {product.inStock ? "ADICIONAR AO CARRINHO" : "PRODUTO ESGOTADO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
