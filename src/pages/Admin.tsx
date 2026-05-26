import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useStore, type Product, type Badge } from "@/context/StoreContext";
import { useOrders, type Order, type OrderStatus } from "@/context/OrdersContext";
import { useLocation } from "wouter";
import {
  Pencil, Check, X, Plus, Trash2, RotateCcw, LogOut, ExternalLink,
  Tag, Package, Settings, ChevronUp, ChevronDown, ChevronRight,
  ShoppingBag, CheckCircle2, XCircle, Clock,
} from "lucide-react";

type Tab = "products" | "categories" | "settings" | "vendas";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── INLINE TEXT EDIT ─────────────────────────────────────────────────────────
function Editable({ value, onSave, type = "text", wide = false, style }: {
  value: string; onSave: (v: string) => void; type?: string; wide?: boolean; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  if (!editing)
    return (
      <span onClick={() => { setDraft(value); setEditing(true); }}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, ...style }}
        title="Clique para editar">
        {value}
        <Pencil size={10} style={{ opacity: 0.3, flexShrink: 0 }} />
      </span>
    );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <input autoFocus type={type} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid #f97316", color: "inherit", fontFamily: "inherit", fontSize: "inherit", padding: "2px 6px", outline: "none", width: type === "number" ? "80px" : wide ? "220px" : "140px" }}
      />
      <button onClick={commit} style={{ color: "#22c55e", cursor: "pointer", background: "none", border: "none", display: "flex" }}><Check size={12} /></button>
      <button onClick={cancel} style={{ color: "#ef4444", cursor: "pointer", background: "none", border: "none", display: "flex" }}><X size={12} /></button>
    </span>
  );
}

// ─── BADGE TOGGLE ─────────────────────────────────────────────────────────────
function BadgeBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void; }) {
  return (
    <button onClick={onClick} style={{ padding: "3px 9px", fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "#555", cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

// ─── MULTI-CATEGORY CHECKBOXES ─────────────────────────────────────────────────
function CategoryCheckboxes({ selected, options, onChange, inputBg, border, textPrimary, textMuted, isDark }: {
  selected: string[]; options: string[]; onChange: (cats: string[]) => void;
  inputBg: string; border: string; textPrimary: string; textMuted: string; isDark: boolean;
}) {
  const toggle = (cat: string) => {
    if (selected.includes(cat)) onChange(selected.filter((c) => c !== cat));
    else onChange([...selected, cat]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((cat) => {
        const active = selected.includes(cat);
        return (
          <label key={cat} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "5px 10px", background: active ? "rgba(249,115,22,0.1)" : inputBg, border: `1px solid ${active ? "#f97316" : border}`, transition: "all 0.12s", userSelect: "none" }}>
            <input type="checkbox" checked={active} onChange={() => toggle(cat)}
              style={{ accentColor: "#f97316", width: 12, height: 12 }} />
            <span style={{ fontSize: "0.68rem", fontFamily: "'JetBrains Mono',monospace", color: active ? "#f97316" : textMuted }}>{cat}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── NEW PRODUCT MODAL ────────────────────────────────────────────────────────
function NewProductModal({ onClose, categories, isDark }: { onClose: () => void; categories: string[]; isDark: boolean; }) {
  const { addProduct } = useStore();
  const cardBg = isDark ? "#111" : "#fff";
  const border = isDark ? "#222" : "#e5e5e5";
  const inputBg = isDark ? "#0d0d0d" : "#f8f8f8";
  const textPrimary = isDark ? "#e8e8e8" : "#111";
  const textMuted = isDark ? "#555" : "#888";

  const [form, setForm] = useState({
    name: "", sku: "", selectedCategories: categories.slice(0, 1), priceFrom: "", priceTo: "",
    description: "", image: "", inStock: true, badge: null as Badge,
    installmentsCount: 6,
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceFrom = parseFloat(form.priceFrom) || 0;
    const priceTo = parseFloat(form.priceTo) || priceFrom;
    const installValue = priceTo / (form.installmentsCount || 1);
    addProduct({
      name: form.name, sku: form.sku || `SKU${Date.now()}`,
      slug: form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      categories: form.selectedCategories.length > 0 ? form.selectedCategories : [categories[0]],
      priceFrom, priceTo,
      description: form.description,
      image: form.image || "https://placehold.co/300x300/111/555?text=Produto",
      inStock: form.inStock, badge: form.inStock ? form.badge : "ESGOTADO",
      installments: { count: form.installmentsCount, value: parseFloat(installValue.toFixed(2)) },
    });
    onClose();
  };

  const inp = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: "6px" }}>{label}</label>
      <input type={type} placeholder={placeholder} value={(form as any)[key]}
        onChange={(e) => set(key, e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", padding: "9px 11px", outline: "none", caretColor: "#f97316" }}
        onFocus={(e) => (e.target.style.borderColor = "#f97316")}
        onBlur={(e) => (e.target.style.borderColor = border)}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", zIndex: 1, background: cardBg, border: `1px solid ${border}`, width: "min(600px,95vw)", maxHeight: "90vh", overflowY: "auto", padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ width: 28, height: 2, background: "#f97316", marginBottom: 6 }} />
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em" }}>NOVO PRODUTO</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ gridColumn: "1/-1" }}>{inp("Nome do produto *", "name", "text", "Ex: Whey Protein 900g")}</div>
            {inp("SKU", "sku", "text", "Auto se deixar vazio")}
            {inp("Preço original (R$)", "priceFrom", "number", "0.00")}
            {inp("Preço com desconto (R$)", "priceTo", "number", "0.00")}
            {inp("Parcelas (qtd)", "installmentsCount", "number", "6")}
            <div style={{ gridColumn: "1/-1", marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: "8px" }}>CATEGORIAS *</label>
              <CategoryCheckboxes
                selected={form.selectedCategories} options={categories}
                onChange={(cats) => set("selectedCategories", cats)}
                inputBg={inputBg} border={border} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
            </div>
            <div style={{ gridColumn: "1/-1", marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: "6px" }}>DESCRIÇÃO</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={3} placeholder="Descrição do produto..."
                style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", padding: "9px 11px", outline: "none", resize: "vertical", caretColor: "#f97316" }}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = border)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>{inp("URL da imagem", "image", "text", "https://...")}</div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "0.7rem", color: textMuted, userSelect: "none" }}>
              <input type="checkbox" checked={form.inStock} onChange={(e) => set("inStock", e.target.checked)} style={{ accentColor: "#f97316", width: 14, height: 14 }} />
              Em estoque
            </label>
            {(["MAIS VENDIDO", "OFERTA"] as Badge[]).map((b) => (
              <BadgeBtn key={b!} label={b!} active={form.badge === b} color={b === "OFERTA" ? "#facc15" : "#f97316"} onClick={() => set("badge", form.badge === b ? null : b)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>CANCELAR</button>
            <button type="submit" disabled={!form.name.trim()}
              style={{ padding: "10px 20px", background: form.name.trim() ? "#f97316" : "#333", border: "none", cursor: form.name.trim() ? "pointer" : "not-allowed", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: form.name.trim() ? "#000" : "#666" }}>
              CRIAR PRODUTO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EDIT PRODUCT MODAL ───────────────────────────────────────────────────────
function EditProductModal({ product, onClose, categories, isDark }: { product: Product; onClose: () => void; categories: string[]; isDark: boolean; }) {
  const { updateProduct } = useStore();
  const cardBg = isDark ? "#111" : "#fff";
  const border = isDark ? "#222" : "#e5e5e5";
  const inputBg = isDark ? "#0d0d0d" : "#f8f8f8";
  const textPrimary = isDark ? "#e8e8e8" : "#111";
  const textMuted = isDark ? "#555" : "#888";

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    selectedCategories: product.categories,
    priceFrom: product.priceFrom.toFixed(2),
    priceTo: product.priceTo.toFixed(2),
    description: product.description,
    image: product.image,
    inStock: product.inStock,
    badge: product.badge,
    installmentsCount: product.installments?.count ?? 6,
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceFrom = parseFloat(form.priceFrom) || 0;
    const priceTo = parseFloat(form.priceTo) || priceFrom;
    const installValue = priceTo / (form.installmentsCount || 1);
    updateProduct(product.id, {
      name: form.name,
      sku: form.sku,
      slug: form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      categories: form.selectedCategories.length > 0 ? form.selectedCategories : product.categories,
      priceFrom,
      priceTo,
      discount: priceFrom > priceTo ? Math.round(((priceFrom - priceTo) / priceFrom) * 100) : 0,
      description: form.description,
      image: form.image || product.image,
      inStock: form.inStock,
      badge: form.badge,
      installments: { count: form.installmentsCount, value: parseFloat(installValue.toFixed(2)) },
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", padding: "9px 11px", outline: "none", caretColor: "#f97316" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: "6px" };

  const inp = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} placeholder={placeholder} value={(form as any)[key]}
        onChange={(e) => set(key, e.target.value)}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#f97316")}
        onBlur={(e) => (e.target.style.borderColor = border)}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", zIndex: 1, background: cardBg, border: `1px solid ${border}`, width: "min(640px,95vw)", maxHeight: "92vh", overflowY: "auto", padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ width: 28, height: 2, background: "#f97316", marginBottom: 6 }} />
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1 }}>EDITAR PRODUTO</h2>
            <p style={{ fontSize: "0.58rem", color: textMuted, marginTop: 4, letterSpacing: "0.06em" }}>#{product.id} · {product.sku}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Preview */}
          <div style={{ display: "flex", gap: 14, marginBottom: 18, padding: "14px", background: isDark ? "#0d0d0d" : "#f5f5f5", border: `1px solid ${border}` }}>
            <img src={form.image} alt={form.name}
              style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0, background: isDark ? "#161616" : "#e5e5e5", padding: 4, filter: !form.inStock ? "grayscale(1) opacity(0.5)" : "none" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/72x72/111/555?text=IMG"; }} />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 700, color: textPrimary, marginBottom: 2 }}>{form.name || "Nome do produto"}</div>
              <div style={{ fontSize: "0.62rem", color: textMuted, marginBottom: 4 }}>{form.selectedCategories.join(", ") || "—"}</div>
              <div style={{ fontSize: "0.75rem", color: "#f97316", fontWeight: 700 }}>
                {fmt(parseFloat(form.priceTo) || 0)}
                {parseFloat(form.priceFrom) > parseFloat(form.priceTo) && (
                  <span style={{ color: textMuted, textDecoration: "line-through", fontWeight: 400, marginLeft: 6, fontSize: "0.65rem" }}>{fmt(parseFloat(form.priceFrom))}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ gridColumn: "1/-1" }}>{inp("Nome do produto *", "name", "text", "Ex: Whey Protein 900g")}</div>
            {inp("SKU", "sku", "text")}
            {inp("Preço original (R$)", "priceFrom", "number", "0.00")}
            {inp("Preço com desconto (R$)", "priceTo", "number", "0.00")}
            {inp("Parcelas (qtd)", "installmentsCount", "number", "6")}
            <div style={{ gridColumn: "1/-1", marginBottom: "14px" }}>
              <label style={labelStyle}>CATEGORIAS</label>
              <CategoryCheckboxes
                selected={form.selectedCategories} options={categories}
                onChange={(cats) => set("selectedCategories", cats)}
                inputBg={inputBg} border={border} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
            </div>
            <div style={{ gridColumn: "1/-1", marginBottom: "14px" }}>
              <label style={labelStyle}>DESCRIÇÃO</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={4} placeholder="Descrição completa do produto..."
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = border)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>{inp("URL da imagem", "image", "text", "https://...")}</div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "0.7rem", color: textMuted, userSelect: "none" }}>
              <input type="checkbox" checked={form.inStock} onChange={(e) => {
                set("inStock", e.target.checked);
                if (!e.target.checked) set("badge", "ESGOTADO");
                else if (form.badge === "ESGOTADO") set("badge", null);
              }} style={{ accentColor: "#f97316", width: 14, height: 14 }} />
              Em estoque
            </label>
            {(["MAIS VENDIDO", "OFERTA"] as Badge[]).map((b) => (
              <BadgeBtn key={b!} label={b!} active={form.badge === b} color={b === "OFERTA" ? "#facc15" : "#f97316"}
                onClick={() => set("badge", form.badge === b ? null : b)} />
            ))}
            <BadgeBtn label="ESGOTADO" active={form.badge === "ESGOTADO" || !form.inStock} color="#ef4444"
              onClick={() => {
                const goEsgotado = form.badge !== "ESGOTADO";
                set("badge", goEsgotado ? "ESGOTADO" : null);
                set("inStock", !goEsgotado);
              }} />
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>CANCELAR</button>
            <button type="submit" disabled={!form.name.trim()}
              style={{ padding: "10px 22px", background: form.name.trim() ? "#f97316" : "#333", border: "none", cursor: form.name.trim() ? "pointer" : "not-allowed", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: form.name.trim() ? "#000" : "#666" }}>
              SALVAR PRODUTO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PRODUCT ROW ──────────────────────────────────────────────────────────────
function ProductRow({ product, isFirst, isLast, isDark, border, textPrimary, textMuted, inputBg, rowHover, categories }: {
  product: Product; isFirst: boolean; isLast: boolean; isDark: boolean;
  border: string; textPrimary: string; textMuted: string; inputBg: string; rowHover: string; categories: string[];
}) {
  const { updateProduct, deleteProduct, moveProduct } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(product.description);
  const [showEdit, setShowEdit] = useState(false);

  const toggleBadge = (badge: Badge) => {
    if (badge === "ESGOTADO") {
      updateProduct(product.id, { inStock: product.badge === "ESGOTADO", badge: product.badge === "ESGOTADO" ? null : "ESGOTADO" });
    } else {
      updateProduct(product.id, { badge: product.badge === badge ? null : badge });
    }
  };

  return (
    <>
      <div
        style={{ display: "grid", gridTemplateColumns: "32px 52px 1fr 110px 110px 170px 72px 36px 36px 36px", padding: "12px 16px", borderBottom: expanded ? "none" : `1px solid ${border}`, gap: "10px", alignItems: "center", transition: "background 0.12s", background: expanded ? (isDark ? "#151515" : "#fafafa") : "transparent" }}
        onMouseEnter={(e) => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = rowHover; }}
        onMouseLeave={(e) => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        {/* Reorder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button disabled={isFirst} onClick={() => moveProduct(product.id, "up")} style={{ background: "none", border: "none", cursor: isFirst ? "not-allowed" : "pointer", color: isFirst ? "#2a2a2a" : textMuted, display: "flex", padding: 1 }}><ChevronUp size={13} /></button>
          <button disabled={isLast} onClick={() => moveProduct(product.id, "down")} style={{ background: "none", border: "none", cursor: isLast ? "not-allowed" : "pointer", color: isLast ? "#2a2a2a" : textMuted, display: "flex", padding: 1 }}><ChevronDown size={13} /></button>
        </div>

        {/* Image */}
        <div style={{ position: "relative" }}>
          <img src={product.image} alt={product.name} style={{ width: "44px", height: "44px", objectFit: "contain", background: isDark ? "#0d0d0d" : "#f5f5f5", padding: "3px", filter: !product.inStock ? "grayscale(1) opacity(0.5)" : "none", transition: "filter 0.3s" }} />
          <button title="Editar imagem" onClick={() => { const u = window.prompt("Nova URL da imagem:", product.image); if (u?.trim()) updateProduct(product.id, { image: u.trim() }); }}
            style={{ position: "absolute", bottom: 0, right: 0, background: "#f97316", border: "none", cursor: "pointer", padding: "2px", display: "flex" }}>
            <Pencil size={7} color="#000" />
          </button>
        </div>

        {/* Name + Categories */}
        <div>
          <div style={{ marginBottom: 2 }}>
            <Editable value={product.name} onSave={(v) => updateProduct(product.id, { name: v })} wide style={{ color: textPrimary, fontSize: "0.82rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: "0.02em" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {product.categories.length > 0 ? product.categories.map((cat) => (
              <span key={cat} style={{ fontSize: "0.52rem", fontFamily: "'JetBrains Mono',monospace", color: textMuted, background: isDark ? "#1a1a1a" : "#f0f0f0", padding: "1px 5px", letterSpacing: "0.04em" }}>{cat}</span>
            )) : <span style={{ fontSize: "0.55rem", color: isDark ? "#2a2a2a" : "#ccc" }}>sem categoria</span>}
          </div>
        </div>

        {/* Price from */}
        <Editable value={product.priceFrom.toFixed(2)} type="number" onSave={(v) => updateProduct(product.id, { priceFrom: parseFloat(v) || product.priceFrom })}
          style={{ color: textMuted, textDecoration: "line-through", fontSize: "0.7rem" }} />

        {/* Price to */}
        <div>
          <Editable value={product.priceTo.toFixed(2)} type="number" onSave={(v) => updateProduct(product.id, { priceTo: parseFloat(v) || product.priceTo })}
            style={{ color: "#f97316", fontWeight: 700, fontSize: "0.82rem" }} />
          {product.discount > 0 && <div style={{ fontSize: "0.58rem", color: "#f97316", opacity: 0.6 }}>-{product.discount}%</div>}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <BadgeBtn label="Vendido" active={product.badge === "MAIS VENDIDO"} color="#f97316" onClick={() => toggleBadge("MAIS VENDIDO")} />
          <BadgeBtn label="Oferta" active={product.badge === "OFERTA"} color="#facc15" onClick={() => toggleBadge("OFERTA")} />
          <BadgeBtn label="Esgotado" active={!product.inStock || product.badge === "ESGOTADO"} color="#ef4444"
            onClick={() => { if (product.inStock) updateProduct(product.id, { inStock: false, badge: "ESGOTADO" }); else updateProduct(product.id, { inStock: true, badge: null }); }} />
        </div>

        {/* Expand description */}
        <button onClick={() => setExpanded((p) => !p)}
          title={expanded ? "Fechar descrição" : "Editar descrição"}
          style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 8px", background: expanded ? "rgba(249,115,22,0.12)" : "transparent", border: `1px solid ${expanded ? "rgba(249,115,22,0.3)" : border}`, cursor: "pointer", color: expanded ? "#f97316" : textMuted, transition: "all 0.15s", whiteSpace: "nowrap", fontSize: "0.6rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em" }}>
          <ChevronRight size={11} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          DESC
        </button>

        {/* Edit full */}
        <button onClick={() => setShowEdit(true)} title="Editar produto completo"
          style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", padding: 4 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f97316")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = textMuted)}>
          <Pencil size={14} />
        </button>

        {/* Delete */}
        <button onClick={() => { if (window.confirm(`Excluir "${product.name}"?`)) deleteProduct(product.id); }}
          title="Excluir produto"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef444444", display: "flex", padding: 4 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef444444")}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Description expanded panel */}
      {expanded && (
        <div style={{ padding: "12px 16px 16px 110px", borderBottom: `1px solid ${border}`, background: isDark ? "#151515" : "#fafafa" }}>
          <label style={{ display: "block", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 6 }}>DESCRIÇÃO / LEGENDA</label>
          {editingDesc ? (
            <div>
              <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={3} autoFocus
                style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: "1px solid #f97316", color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: "8px 10px", outline: "none", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={() => { updateProduct(product.id, { description: descDraft }); setEditingDesc(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                  <Check size={11} />SALVAR
                </button>
                <button onClick={() => { setDescDraft(product.description); setEditingDesc(false); }}
                  style={{ padding: "5px 10px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", color: textMuted, letterSpacing: "0.1em" }}>
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <p style={{ fontSize: "0.75rem", color: textMuted, lineHeight: 1.6, flex: 1, margin: 0 }}>{product.description || "Sem descrição."}</p>
              <button onClick={() => { setDescDraft(product.description); setEditingDesc(true); }}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", color: textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.1em", flexShrink: 0 }}>
                <Pencil size={10} />EDITAR
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full edit modal */}
      {showEdit && (
        <EditProductModal product={product} onClose={() => setShowEdit(false)} categories={categories} isDark={isDark} />
      )}
    </>
  );
}

// ─── CATEGORY PRODUCTS VIEW ───────────────────────────────────────────────────
function CategoryProducts({ cat, isDark, border, textPrimary, textMuted, inputBg }: {
  cat: string; isDark: boolean; border: string; textPrimary: string; textMuted: string; inputBg: string;
}) {
  const { products, moveProductInCategory, updateProduct, categories } = useStore();
  const catProducts = products.filter((p) => p.categories.includes(cat));

  if (catProducts.length === 0)
    return <p style={{ padding: "16px 0", fontSize: "0.7rem", color: textMuted }}>Nenhum produto nesta categoria.</p>;

  return (
    <div>
      {catProducts.map((product, i) => (
        <div key={product.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < catProducts.length - 1 ? `1px solid ${border}` : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button disabled={i === 0} onClick={() => moveProductInCategory(product.id, "up")}
              style={{ background: "none", border: "none", cursor: i === 0 ? "not-allowed" : "pointer", color: i === 0 ? (isDark ? "#2a2a2a" : "#ccc") : textMuted, display: "flex", padding: 1 }}><ChevronUp size={13} /></button>
            <button disabled={i === catProducts.length - 1} onClick={() => moveProductInCategory(product.id, "down")}
              style={{ background: "none", border: "none", cursor: i === catProducts.length - 1 ? "not-allowed" : "pointer", color: i === catProducts.length - 1 ? (isDark ? "#2a2a2a" : "#ccc") : textMuted, display: "flex", padding: 1 }}><ChevronDown size={13} /></button>
          </div>
          <img src={product.image} alt={product.name} style={{ width: 38, height: 38, objectFit: "contain", background: isDark ? "#0d0d0d" : "#f5f5f5", padding: 3, flexShrink: 0, filter: !product.inStock ? "grayscale(1) opacity(0.5)" : "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: textPrimary, letterSpacing: "0.02em", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
            <div style={{ fontSize: "0.65rem", color: "#f97316", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(product.priceTo)}</div>
          </div>
          {/* Remove/add from category */}
          <button
            onClick={() => {
              const newCats = product.categories.includes(cat)
                ? product.categories.filter((c) => c !== cat)
                : [...product.categories, cat];
              updateProduct(product.id, { categories: newCats });
            }}
            title={product.categories.includes(cat) ? `Remover de ${cat}` : `Adicionar a ${cat}`}
            style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.55rem", color: textMuted, letterSpacing: "0.08em" }}>
            {product.categories.includes(cat) ? "− REMOVER" : "+ ADICIONAR"}
          </button>
          <span style={{ fontSize: "0.58rem", color: textMuted, minWidth: 26, textAlign: "right" }}>#{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ORDER STATUS BADGE ───────────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; color: string; Icon: React.ElementType }> = {
    pending:   { label: "Pendente",  color: "#f59e0b", Icon: Clock },
    approved:  { label: "Aprovado",  color: "#22c55e", Icon: CheckCircle2 },
    rejected:  { label: "Cancelado", color: "#ef4444", Icon: XCircle },
    cancelled: { label: "Cancelado", color: "#ef4444", Icon: XCircle },
  };
  const { label, color, Icon } = map[status] ?? map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", background: `${color}18`, border: `1px solid ${color}44`, fontSize: "0.58rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", textTransform: "uppercase", color, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon size={10} />{label}
    </span>
  );
}

// ─── MAIN ADMIN ───────────────────────────────────────────────────────────────
export function Admin() {
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const { products, categories, settings, addCategory, renameCategory, deleteCategory, moveCategory, updateSettings, resetToDefaults } = useStore();
  const { orders, updateOrderStatusById, updatePaymentId, clearOrders } = useOrders();
  const [, setLocation] = useLocation();
  // ── Polling: atualiza status dos pedidos pendentes a cada 30s ──────────
  const POLL_INTERVAL_MS = 30_000;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    async function pollPendingOrders() {
      const pending = orders.filter(
        (o) => o.status === "pending" && o.paymentId
      );
      if (pending.length === 0) return;

      try {
        const res = await fetch(`${apiUrl}/api/payments/status-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIds: pending.map((o) => o.paymentId!) }),
        });
        if (!res.ok) return;
        const { results } = await res.json();

        for (const r of results) {
          if (!r.status) continue;
          // Mapeia status do MP para status interno
          const statusMap: Record<string, string> = {
            approved:      "approved",
            authorized:    "approved",
            rejected:      "rejected",
            cancelled:     "cancelled",
            refunded:      "cancelled",
            charged_back:  "cancelled",
            in_process:    "pending",
            pending:       "pending",
          };
          const mapped = statusMap[r.status] ?? "pending";
          const order = pending.find((o) => o.paymentId === r.id);
          if (order && mapped !== order.status) {
            updateOrderStatusById(order.id, mapped as any);
          }
        }
      } catch {
        // silencia erros de rede — vai tentar no próximo ciclo
      }
      setLastSync(new Date());
    }

    // Roda imediatamente ao abrir a aba de vendas, depois a cada POLL_INTERVAL_MS
    pollPendingOrders();
    const timer = setInterval(pollPendingOrders, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState(settings);
  const [confirmReset, setConfirmReset] = useState(false);

  const bg = isDark ? "#0a0a0a" : "#f4f4f4";
  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#1e1e1e" : "#e5e5e5";
  const borderStrong = isDark ? "#2a2a2a" : "#d5d5d5";
  const textPrimary = isDark ? "#e8e8e8" : "#111111";
  const textMuted = isDark ? "#555555" : "#888888";
  const inputBg = isDark ? "#0d0d0d" : "#f8f8f8";
  const rowHover = isDark ? "#161616" : "#fafafa";

  const tabs = [
    { id: "products" as Tab, label: "Produtos", icon: <Package size={13} /> },
    { id: "categories" as Tab, label: "Categorias", icon: <Tag size={13} /> },
    { id: "vendas" as Tab, label: "Vendas", icon: <ShoppingBag size={13} /> },
    { id: "settings" as Tab, label: "Configurações", icon: <Settings size={13} /> },
  ];

  // Vendas stats
  const totalVendas = orders.filter((o) => o.status === "approved").reduce((s, o) => s + o.total, 0);
  const countApproved = orders.filter((o) => o.status === "approved").length;
  const countPending = orders.filter((o) => o.status === "pending").length;

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "'JetBrains Mono',monospace", color: textPrimary }}>

      {/* ── TOPBAR ── */}
      <div style={{ background: isDark ? "#080808" : "#fff", borderBottom: `1px solid ${border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.3rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.02em" }}>G1%</span>
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#f97316", textTransform: "uppercase", display: "block", lineHeight: 1 }}>ADMIN</span>
          </a>
          <div style={{ width: 1, height: 22, background: border }} />
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", background: activeTab === t.id ? "rgba(249,115,22,0.1)" : "transparent", color: activeTab === t.id ? "#f97316" : textMuted, border: `1px solid ${activeTab === t.id ? "rgba(249,115,22,0.3)" : "transparent"}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", transition: "all 0.12s", position: "relative" }}>
              {t.icon}{t.label}
              {t.id === "vendas" && countPending > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#f97316", color: "#000", fontSize: "0.5rem", fontWeight: 900, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{countPending}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.58rem", color: textMuted, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}><ExternalLink size={11} />Loja</a>
          <button onClick={() => { logout(); setLocation("/login"); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", background: "transparent", border: `1px solid ${border}`, color: textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            <LogOut size={11} />Sair
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 24px" }}>

        {/* ═══════════════════ PRODUCTS ═══════════════════ */}
        {activeTab === "products" && (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1 }}>PRODUTOS</h1>
                <p style={{ fontSize: "0.6rem", color: textMuted, marginTop: 4, letterSpacing: "0.06em" }}>{products.length} produto{products.length !== 1 ? "s" : ""} · setas para reordenar · clique no ✏️ para editar tudo</p>
              </div>
              <button onClick={() => setShowNewProduct(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" }}>
                <Plus size={13} />NOVO PRODUTO
              </button>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 52px 1fr 110px 110px 170px 72px 36px 36px 36px", padding: "8px 16px", borderBottom: `1px solid ${border}`, gap: "10px" }}>
                {["", "IMG", "NOME / CATEGORIAS", "PREÇO DE", "PREÇO POR", "BADGES", "DESC", "", "", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted }}>{h}</span>
                ))}
              </div>

              {products.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: "0.7rem", color: textMuted }}>Nenhum produto. Clique em "Novo Produto" para adicionar.</p>
                </div>
              ) : (
                products.map((product, i) => (
                  <ProductRow key={product.id} product={product} isFirst={i === 0} isLast={i === products.length - 1}
                    isDark={isDark} border={border} textPrimary={textPrimary} textMuted={textMuted} inputBg={inputBg} rowHover={rowHover} categories={categories} />
                ))
              )}
            </div>
          </>
        )}

        {/* ═══════════════════ CATEGORIES ═══════════════════ */}
        {activeTab === "categories" && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1 }}>CATEGORIAS</h1>
              <p style={{ fontSize: "0.6rem", color: textMuted, marginTop: 4, letterSpacing: "0.06em" }}>Gerencie categorias e a ordem dos produtos em cada uma delas.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.length === 0 ? (
                  <div style={{ background: cardBg, border: `1px solid ${border}`, padding: 24, textAlign: "center", fontSize: "0.7rem", color: textMuted }}>Nenhuma categoria criada.</div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat} style={{ background: cardBg, border: `1px solid ${expandedCat === cat ? "rgba(249,115,22,0.3)" : border}`, transition: "border-color 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 8 }}>
                        {renamingCat === cat ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                            <input autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { renameCategory(cat, renameDraft.trim()); setRenamingCat(null); } if (e.key === "Escape") setRenamingCat(null); }}
                              style={{ flex: 1, background: inputBg, border: "1px solid #f97316", color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", padding: "5px 8px", outline: "none" }} />
                            <button onClick={() => { renameCategory(cat, renameDraft.trim()); setRenamingCat(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e", display: "flex" }}><Check size={14} /></button>
                            <button onClick={() => setRenamingCat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginRight: 2 }}>
                              <button disabled={categories.indexOf(cat) === 0} onClick={() => moveCategory(cat, "up")}
                                style={{ background: "none", border: "none", cursor: categories.indexOf(cat) === 0 ? "not-allowed" : "pointer", color: categories.indexOf(cat) === 0 ? (isDark ? "#2a2a2a" : "#ccc") : textMuted, display: "flex", padding: 1 }}>
                                <ChevronUp size={11} />
                              </button>
                              <button disabled={categories.indexOf(cat) === categories.length - 1} onClick={() => moveCategory(cat, "down")}
                                style={{ background: "none", border: "none", cursor: categories.indexOf(cat) === categories.length - 1 ? "not-allowed" : "pointer", color: categories.indexOf(cat) === categories.length - 1 ? (isDark ? "#2a2a2a" : "#ccc") : textMuted, display: "flex", padding: 1 }}>
                                <ChevronDown size={11} />
                              </button>
                            </div>
                            <button onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: expandedCat === cat ? "#f97316" : textMuted, display: "flex", padding: 2 }}>
                              <ChevronRight size={14} style={{ transform: expandedCat === cat ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                            </button>
                            <span style={{ flex: 1, fontSize: "0.85rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: textPrimary, letterSpacing: "0.02em" }}>{cat}</span>
                            <span style={{ fontSize: "0.6rem", color: textMuted }}>{products.filter((p) => p.categories.includes(cat)).length} produto{products.filter((p) => p.categories.includes(cat)).length !== 1 ? "s" : ""}</span>
                            <button onClick={() => { setRenamingCat(cat); setRenameDraft(cat); }} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", padding: 3 }}><Pencil size={12} /></button>
                            <button onClick={() => { if (window.confirm(`Excluir categoria "${cat}"?`)) { deleteCategory(cat); if (expandedCat === cat) setExpandedCat(null); } }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef444444", display: "flex", padding: 3 }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef444444")}><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                      {expandedCat === cat && (
                        <div style={{ borderTop: `1px solid ${border}`, padding: "4px 16px 12px" }}>
                          <CategoryProducts cat={cat} isDark={isDark} border={border} textPrimary={textPrimary} textMuted={textMuted} inputBg={inputBg} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "16px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 10 }}>NOVA CATEGORIA</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" placeholder="Nome da categoria..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newCatName.trim()) { addCategory(newCatName.trim()); setNewCatName(""); } }}
                      style={{ flex: 1, background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: "8px 11px", outline: "none" }}
                      onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                      onBlur={(e) => (e.target.style.borderColor = border)} />
                    <button onClick={() => { if (newCatName.trim()) { addCategory(newCatName.trim()); setNewCatName(""); } }}
                      style={{ padding: "8px 14px", background: "#f97316", border: "none", cursor: "pointer", color: "#000", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: preview */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "18px 20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 12 }}>PRÉVIA DOS FILTROS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Todos", ...categories].map((cat, i) => (
                      <span key={cat} style={{ padding: "4px 10px", fontSize: "0.6rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em", textTransform: "uppercase", background: i === 0 ? "#f97316" : "transparent", color: i === 0 ? "#000" : textMuted, border: `1px solid ${i === 0 ? "#f97316" : border}` }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                    {categories.map((cat) => (
                      <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${isDark ? "#161616" : "#f5f5f5"}` }}>
                        <span style={{ fontSize: "0.65rem", color: textPrimary, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>{cat}</span>
                        <span style={{ fontSize: "0.58rem", color: textMuted }}>{products.filter((p) => p.categories.includes(cat)).length} itens</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════ VENDAS ═══════════════════ */}
        {activeTab === "vendas" && (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1 }}>VENDAS</h1>
                <p style={{ fontSize: "0.6rem", color: textMuted, marginTop: 4, letterSpacing: "0.06em" }}>{orders.length} pedido{orders.length !== 1 ? "s" : ""} registrado{orders.length !== 1 ? "s" : ""} neste navegador</p>
                {lastSync && (
                  <p style={{ fontSize: "0.55rem", color: isDark ? "#444" : "#bbb", marginTop: 2, letterSpacing: "0.04em" }}>
                    ⟳ sync {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                )}
              </div>
              {orders.length > 0 && (
                <button onClick={() => { if (window.confirm("Limpar todos os pedidos?")) clearOrders(); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: textMuted }}>
                  <Trash2 size={12} />LIMPAR TUDO
                </button>
              )}
            </div>

            {/* Stats */}
            {orders.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Aprovado", value: fmt(totalVendas), color: "#22c55e" },
                  { label: "Aprovados", value: String(countApproved), color: "#22c55e" },
                  { label: "Pendentes", value: String(countPending), color: "#f59e0b" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: cardBg, border: `1px solid ${border}`, padding: "14px 18px" }}>
                    <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted, marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {orders.length === 0 ? (
              <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "60px 24px", textAlign: "center" }}>
                <ShoppingBag size={36} style={{ color: isDark ? "#2a2a2a" : "#ddd", margin: "0 auto 16px" }} />
                <p style={{ fontSize: "0.72rem", color: textMuted }}>Nenhum pedido registrado ainda.</p>
                <p style={{ fontSize: "0.6rem", color: isDark ? "#333" : "#ccc", marginTop: 4 }}>Os pedidos aparecerão aqui quando clientes finalizarem a compra.</p>
              </div>
            ) : (
              <div style={{ background: cardBg, border: `1px solid ${border}` }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 120px 120px 110px", padding: "8px 16px", borderBottom: `1px solid ${border}`, gap: 12 }}>
                  {["PEDIDO / E-MAIL", "DATA", "ITENS", "TOTAL", "STATUS"].map((h) => (
                    <span key={h} style={{ fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: textMuted }}>{h}</span>
                  ))}
                </div>

                {orders.map((order, i) => {
                  const dateStr = new Date(order.date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={order.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 120px 120px 110px", padding: "14px 16px", borderBottom: i < orders.length - 1 ? `1px solid ${border}` : "none", gap: 12, alignItems: "center" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = rowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <div>
                        <div style={{ fontSize: "0.7rem", fontFamily: "'JetBrains Mono',monospace", color: "#f97316", fontWeight: 700, marginBottom: 2 }}>{order.id}</div>
                        {order.nome && (
                          <div style={{ fontSize: "0.62rem", color: textPrimary, fontWeight: 600, marginBottom: 1 }}>{order.nome}</div>
                        )}
                        <div style={{ fontSize: "0.6rem", color: textMuted }}>{order.email}</div>
                        {order.cpf && (
                          <div style={{ fontSize: "0.58rem", color: textMuted, fontFamily: "'JetBrains Mono',monospace" }}>CPF: {order.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}</div>
                        )}
                        {order.address && (
                          <div style={{ fontSize: "0.57rem", color: textMuted, marginTop: 2, lineHeight: 1.5 }}>
                            {order.address.street}, {order.address.number}
                            {order.address.complement ? ` — ${order.address.complement}` : ""}<br />
                            {order.address.neighborhood} · {order.address.city}/{order.address.state}<br />
                            CEP {order.address.zip.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: textMuted }}>{dateStr}</span>
                      <div>
                        {order.items.map((item, j) => (
                          <div key={j} style={{ fontSize: "0.58rem", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.qty}× {item.name}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: "0.82rem", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: textPrimary }}>{fmt(order.total)}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <OrderStatusBadge status={order.status} />
                        <select value={order.status}
                          onChange={(e) => updateOrderStatusById(order.id, e.target.value as OrderStatus)}
                          style={{ fontSize: "0.55rem", background: inputBg, border: `1px solid ${border}`, color: textMuted, fontFamily: "'JetBrains Mono',monospace", padding: "2px 4px", cursor: "pointer", outline: "none" }}>
                          <option value="pending">Pendente</option>
                          <option value="approved">Aprovado</option>
                          <option value="rejected">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ SETTINGS ═══════════════════ */}
        {activeTab === "settings" && (
          <>
            <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.8rem", fontWeight: 900, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1, marginBottom: 20 }}>CONFIGURAÇÕES</h1>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* WhatsApp */}
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 12 }}>CONTATO WHATSAPP</div>
                  <input type="text" value={settingsDraft.whatsapp} onChange={(e) => setSettingsDraft((p) => ({ ...p, whatsapp: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", padding: "9px 11px", outline: "none", marginBottom: 10 }}
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) => (e.target.style.borderColor = border)} />
                  <button onClick={() => updateSettings({ whatsapp: settingsDraft.whatsapp })}
                    style={{ padding: "8px 16px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", color: "#000" }}>
                    SALVAR
                  </button>
                </div>

                {/* Banner text */}
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 12 }}>TEXTO DO BANNER</div>
                  <textarea value={settingsDraft.bannerText} onChange={(e) => setSettingsDraft((p) => ({ ...p, bannerText: e.target.value }))}
                    rows={2} style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", padding: "9px 11px", outline: "none", resize: "vertical", marginBottom: 10 }}
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) => (e.target.style.borderColor = border)} />
                  <button onClick={() => updateSettings({ bannerText: settingsDraft.bannerText })}
                    style={{ padding: "8px 16px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", color: "#000" }}>
                    SALVAR
                  </button>
                </div>

                {/* Hero Banner Image */}
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 6 }}>IMAGEM DO BANNER (HERO)</div>
                  <p style={{ fontSize: "0.6rem", color: textMuted, marginBottom: 10, lineHeight: 1.5 }}>Cole a URL de uma imagem para substituir o texto "SUPLEMENTOS DE ELITE". Deixe em branco para mostrar o texto padrão.</p>
                  <input type="text" placeholder="https://exemplo.com/banner.jpg" value={settingsDraft.heroBannerImage ?? ""} onChange={(e) => setSettingsDraft((p) => ({ ...p, heroBannerImage: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `1px solid ${border}`, color: textPrimary, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", padding: "9px 11px", outline: "none", marginBottom: 10 }}
                    onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                    onBlur={(e) => (e.target.style.borderColor = border)} />
                  {settingsDraft.heroBannerImage && settingsDraft.heroBannerImage.trim() !== "" && (
                    <div style={{ marginBottom: 10, border: `1px solid ${border}`, overflow: "hidden", maxHeight: 120 }}>
                      <img src={settingsDraft.heroBannerImage} alt="Preview" style={{ width: "100%", height: 120, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateSettings({ heroBannerImage: settingsDraft.heroBannerImage })}
                      style={{ padding: "8px 16px", background: "#f97316", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", color: "#000" }}>
                      SALVAR IMAGEM
                    </button>
                    {settingsDraft.heroBannerImage && (
                      <button onClick={() => { setSettingsDraft((p) => ({ ...p, heroBannerImage: "" })); updateSettings({ heroBannerImage: "" }); }}
                        style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: textMuted, letterSpacing: "0.1em" }}>
                        REMOVER
                      </button>
                    )}
                  </div>
                </div>

                {/* Reset */}
                <div style={{ background: cardBg, border: `1px solid ${isDark ? "#2a0000" : "#fee2e2"}`, padding: "20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#ef4444", marginBottom: 8 }}>ZONA DE PERIGO</div>
                  <p style={{ fontSize: "0.62rem", color: textMuted, marginBottom: 12 }}>Restaura todos os produtos e categorias para o padrão inicial. Esta ação não pode ser desfeita.</p>
                  {!confirmReset ? (
                    <button onClick={() => setConfirmReset(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "transparent", border: "1px solid #ef4444", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: "#ef4444", letterSpacing: "0.1em" }}>
                      <RotateCcw size={12} />RESTAURAR PADRÃO
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { resetToDefaults(); setConfirmReset(false); }}
                        style={{ padding: "8px 14px", background: "#ef4444", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>
                        CONFIRMAR
                      </button>
                      <button onClick={() => setConfirmReset(false)}
                        style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.62rem", color: textMuted }}>
                        CANCELAR
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "18px 20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 12 }}>PRÉVIA DO BANNER</div>
                  <div style={{ background: "#f97316", color: "#000", padding: "8px 16px", textAlign: "center", fontSize: "0.65rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", fontWeight: 700 }}>
                    {settingsDraft.bannerText}
                  </div>
                </div>
                <div style={{ background: cardBg, border: `1px solid ${border}`, padding: "18px 20px" }}>
                  <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316", marginBottom: 8 }}>CONFIGURAÇÕES ATIVAS</div>
                  <div style={{ fontSize: "0.65rem", color: textMuted, lineHeight: 1.8 }}>
                    <div>WhatsApp: <span style={{ color: textPrimary }}>{settings.whatsapp}</span></div>
                    <div style={{ marginTop: 4 }}>Produtos: <span style={{ color: textPrimary }}>{products.length}</span></div>
                    <div style={{ marginTop: 4 }}>Categorias: <span style={{ color: textPrimary }}>{categories.length}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showNewProduct && <NewProductModal onClose={() => setShowNewProduct(false)} categories={categories} isDark={isDark} />}
    </div>
  );
}
