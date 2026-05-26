import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useStore } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CartToastContainer, ToastItem } from "@/components/ui/CartToast";

const CART_KEY = "g1-cart-v1";
const PAGE_SIZE = 12;

type SortOption = "default" | "price-asc" | "price-desc";

interface CartItem {
  id: number;
  name: string;
  image: string;
  priceTo: number;
  qty: number;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

export function Home() {
  const { isDark } = useTheme();
  const { products, categories } = useStore();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeCategory, priceMin, priceMax, sortBy]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddToCart = useCallback((product: any, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, image: product.image, priceTo: product.priceTo, qty },
      ];
    });
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, productName: product.name, qty }]);
  }, []);

  const handleRemoveFromCart = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleUpdateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) { handleRemoveFromCart(id); return; }
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, [handleRemoveFromCart]);

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const allCategories = ["Todos", ...categories];

  const filteredProducts = useMemo(() => {
    const minVal = priceMin !== "" ? parseFloat(priceMin) : null;
    const maxVal = priceMax !== "" ? parseFloat(priceMax) : null;

    let list = products.filter((p) => {
      const matchesSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "Todos" || p.categories.includes(activeCategory);
      const matchesMinPrice = minVal === null || p.priceTo >= minVal;
      const matchesMaxPrice = maxVal === null || p.priceTo <= maxVal;
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.priceTo - b.priceTo);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.priceTo - a.priceTo);

    return list;
  }, [products, search, activeCategory, priceMin, priceMax, sortBy]);

  const paginatedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const bg = isDark ? "#0a0a0a" : "#f8f8f8";
  const border = isDark ? "#1e1e1e" : "#e5e5e5";
  const textPrimary = isDark ? "#ffffff" : "#111111";
  const textMuted = isDark ? "#555" : "#888";
  const inputBg = isDark ? "#111" : "#fff";
  const inputBorder = isDark ? "#333" : "#ddd";

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: bg }}>
      <Header
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        search={search}
        onSearch={setSearch}
      />

      <Hero onAddToCart={handleAddToCart} onViewDetails={setSelectedProduct} />

      {/* Category filters + Price filter + Sort */}
      <section
        className="sticky z-20 px-6 py-3"
        style={{
          background: isDark ? "rgba(10,10,10,0.97)" : "rgba(248,248,248,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${border}`,
          top: "85px",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2">
          {/* Category buttons */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {allCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex-shrink-0 px-4 py-1.5 font-mono text-xs tracking-widest uppercase transition-all duration-200"
                  style={{
                    background: isActive ? "#f97316" : "transparent",
                    color: isActive ? "#000" : textMuted,
                    border: `1px solid ${isActive ? "#f97316" : border}`,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0 flex-wrap">
            {/* Price range filter */}
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
              Preço:
            </span>
            <input
              type="number"
              min="0"
              placeholder="Mín"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-20 px-2 py-1.5 outline-none font-mono text-xs"
              style={{
                background: inputBg,
                border: `1px solid ${priceMin ? "#f97316" : inputBorder}`,
                color: textPrimary,
                caretColor: "#f97316",
              }}
            />
            <span className="font-mono text-xs" style={{ color: textMuted }}>—</span>
            <input
              type="number"
              min="0"
              placeholder="Máx"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-20 px-2 py-1.5 outline-none font-mono text-xs"
              style={{
                background: inputBg,
                border: `1px solid ${priceMax ? "#f97316" : inputBorder}`,
                color: textPrimary,
                caretColor: "#f97316",
              }}
            />
            {(priceMin || priceMax) && (
              <button
                onClick={() => { setPriceMin(""); setPriceMax(""); }}
                className="font-mono text-xs px-2 py-1.5"
                style={{ color: "#f97316", background: "transparent", border: `1px solid #f97316`, cursor: "pointer" }}
              >
                ✕
              </button>
            )}

            {/* Sort selector */}
            <div style={{ width: 1, height: 20, background: border, margin: "0 4px" }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2 py-1.5 outline-none font-mono text-xs"
              style={{
                background: inputBg,
                border: `1px solid ${sortBy !== "default" ? "#f97316" : inputBorder}`,
                color: sortBy !== "default" ? "#f97316" : textMuted,
                cursor: "pointer",
              }}
            >
              <option value="default">Ordenar</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {search.trim() !== "" && (
          <p className="font-mono text-xs mb-6 tracking-widest uppercase" style={{ color: textMuted }}>
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
          </p>
        )}

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="font-mono text-4xl" style={{ color: isDark ? "#222" : "#ddd" }}>_</span>
            <p className="font-mono text-sm tracking-widest uppercase" style={{ color: textMuted }}>
              Nenhum produto encontrado
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("Todos"); setPriceMin(""); setPriceMax(""); setSortBy("default"); }}
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 transition-colors"
              style={{ border: `1px solid ${border}`, color: "#f97316", background: "transparent", cursor: "pointer" }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} isDark={isDark} />)
                : paginatedProducts.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={setSelectedProduct}
                      index={idx}
                    />
                  ))}
            </div>

            {/* Load more */}
            {!loading && hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="px-8 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-200"
                  style={{ border: `1px solid #f97316`, color: "#f97316", background: "transparent", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f97316"; (e.currentTarget as HTMLElement).style.color = "#000"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#f97316"; }}
                >
                  Carregar mais ({filteredProducts.length - visibleCount} restantes)
                </button>
              </div>
            )}
            {!loading && !hasMore && filteredProducts.length > PAGE_SIZE && (
              <p className="text-center font-mono text-xs mt-8 tracking-widest uppercase" style={{ color: textMuted }}>
                Todos os {filteredProducts.length} produtos carregados
              </p>
            )}
          </>
        )}
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onUpdateQty={handleUpdateQty}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cartItems}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <WhatsAppButton />
      <CartToastContainer toasts={toasts} onDismiss={dismissToast} isDark={isDark} />
    </div>
  );
}
