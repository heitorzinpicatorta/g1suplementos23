import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useStore } from "@/context/StoreContext";
import { Moon, Sun, ShoppingCart, Search, X, UserCircle } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  cartCount: number;
  onCartOpen: () => void;
  search: string;
  onSearch: (s: string) => void;
}

export function Header({ cartCount, onCartOpen, search, onSearch }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { settings } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 transition-all duration-300"
      style={{
        background: scrolled
          ? isDark ? "rgba(10,10,10,0.97)" : "rgba(255,255,255,0.97)"
          : isDark ? "#0a0a0a" : "#ffffff",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? (isDark ? "#1a1a1a" : "#e5e5e5") : isDark ? "#111" : "#eaeaea"}`,
      }}
    >
      {/* Banner */}
      <div className="text-center py-2 font-mono text-xs tracking-widest" style={{ background: "#f97316", color: "#000" }}>
        {settings.bannerText}
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-6">
        {/* Logo */}
        <Link href="/">
          <div className="flex-shrink-0 cursor-pointer flex flex-col leading-none">
            <span className="font-bold tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", letterSpacing: "-0.02em", color: isDark ? "#ffffff" : "#111111" }}>
              G1%
            </span>
            <span className="font-mono text-xs tracking-widest" style={{ color: "#f97316" }}>SUPLEMENTOS</span>
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 relative">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-sm w-full"
            style={{ background: isDark ? "#111" : "#f8f8f8", border: `1px solid ${isDark ? "#1e1e1e" : "#e5e5e5"}` }}>
            <Search size={16} style={{ color: isDark ? "#444" : "#888" }} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 font-mono"
              style={{ color: isDark ? "#ccc" : "#333", caretColor: "#f97316" }}
            />
            {search && (
              <button onClick={() => onSearch("")}><X size={16} style={{ color: isDark ? "#444" : "#888" }} /></button>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="flex md:hidden flex-1 relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-sm w-full"
              style={{ background: isDark ? "#111" : "#f8f8f8", border: `1px solid ${isDark ? "#1e1e1e" : "#e5e5e5"}` }}>
              <Search size={14} style={{ color: isDark ? "#444" : "#888" }} />
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 font-mono"
                style={{ color: isDark ? "#ccc" : "#333", caretColor: "#f97316" }}
              />
              <button onClick={() => { setMobileSearchOpen(false); onSearch(""); }}>
                <X size={14} style={{ color: isDark ? "#444" : "#888" }} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-5 ml-auto">
          {/* Mobile search toggle */}
          {!mobileSearchOpen && (
            <button
              className="md:hidden transition-colors"
              style={{ color: search ? "#f97316" : isDark ? "#888" : "#666", background: "transparent", border: "none", cursor: "pointer", position: "relative" }}
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search size={18} />
              {search && <span style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />}
            </button>
          )}

          <button onClick={toggleTheme} className="transition-colors" style={{ color: isDark ? "#888" : "#666", background: "transparent", border: "none", cursor: "pointer" }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <a href={`tel:${settings.whatsapp.replace(/\D/g, "")}`}
            className="font-mono text-xs hidden lg:block"
            style={{ color: isDark ? "#444" : "#666" }}>
            {settings.whatsapp}
          </a>

          <Link href="/pedidos">
            <button title="Área do Cliente" className="transition-colors"
              style={{ color: isDark ? "#666" : "#444", background: "transparent", border: "none", cursor: "pointer" }}>
              <UserCircle size={22} strokeWidth={1.5} />
            </button>
          </Link>

          <button
            onClick={onCartOpen}
            className="transition-colors relative"
            style={{ color: cartCount > 0 ? "#f97316" : isDark ? "#666" : "#444", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <ShoppingCart size={22} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-mono font-bold leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
