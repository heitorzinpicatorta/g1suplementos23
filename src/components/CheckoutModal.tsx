import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useOrders } from "@/context/OrdersContext";
import { X, Loader2, Tag, MapPin, Check, ChevronDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: any[];
}

const COUPONS: Record<string, { type: "percent" | "fixed"; value: number; label: string }> = {
  "G1PROMO":  { type: "percent", value: 10, label: "10% de desconto" },
  "G1FRETE":  { type: "fixed",   value: 15, label: "R$ 15,00 de desconto" },
  "BEMVINDO": { type: "percent", value: 5,  label: "5% de desconto" },
};

function calcFrete(uf: string, subtotal: number): { opcoes: { label: string; prazo: string; valor: number }[] } {
  const gratis = subtotal >= 199;
  const base: Record<string, number> = {
    SP: 12, RJ: 15, MG: 15, ES: 17,
    PR: 18, SC: 18, RS: 20,
    DF: 22, GO: 22, MT: 25, MS: 25,
  };
  const valorPAC = base[uf] ?? 28;
  const valorSEDEX = valorPAC + 12;
  return {
    opcoes: [
      { label: gratis ? "PAC — GRÁTIS" : "PAC", prazo: "5 a 8 dias úteis", valor: gratis ? 0 : valorPAC },
      { label: "SEDEX", prazo: "1 a 3 dias úteis", valor: valorSEDEX },
    ],
  };
}

async function createCheckoutPreference(
  items: any[],
  payer: {
    email: string;
    firstName?: string;
    lastName?: string;
    cpf?: string;
  },
  freteValor: number,
  address?: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  }
): Promise<{ preferenceId: string; sandboxInitPoint: string; initPoint: string }> {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const allItems = [...items.map((i) => ({
    title: i.name,
    quantity: i.qty,
    unit_price: i.priceTo,
  }))];
  if (freteValor > 0) {
    allItems.push({ title: "Frete", quantity: 1, unit_price: freteValor });
  }
  const res = await fetch(`${apiUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: allItems, payer, address }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar preferência de pagamento");
  }
  return res.json();
}

function formatCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

export function CheckoutModal({ open, onClose, items }: CheckoutModalProps) {
  const { isDark } = useTheme();
  const { addOrder } = useOrders();
  const { toast } = useToast();

  // FIX 9: Full buyer fields
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Cupom
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | typeof COUPONS[string] & { code: string }>(null);
  const [couponError, setCouponError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);

  // CEP / Frete / Endereço
  const [cep, setCep] = useState("");
  const [freteOpen, setFreteOpen] = useState(false);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteOpcoes, setFreteOpcoes] = useState<{ label: string; prazo: string; valor: number }[] | null>(null);
  const [freteSelecionado, setFreteSelecionado] = useState<{ label: string; prazo: string; valor: number } | null>(null);
  const [cepInfo, setCepInfo] = useState<{ localidade: string; uf: string } | null>(null);

  // FIX 9: Address fields
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");

  // FIX 8: shipping required error
  const [freteError, setFreteError] = useState(false);

  if (!open) return null;

  const border    = isDark ? "#222" : "#e5e5e5";
  const inputBg   = isDark ? "#0a0a0a" : "#f8f8f8";
  const inputBorder = isDark ? "#333" : "#ddd";
  const textMuted = isDark ? "#666" : "#999";
  const textMain  = isDark ? "#fff" : "#111";
  const errorColor = "#ef4444";

  const subtotal = items.reduce((s, i) => s + i.priceTo * i.qty, 0);
  const desconto = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? subtotal * (appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const freteValor = freteSelecionado?.valor ?? 0;
  const total = Math.max(0, subtotal - desconto) + freteValor;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = COUPONS[code];
    if (found) {
      setAppliedCoupon({ ...found, code });
      setCouponError("");
      setCouponInput("");
    } else {
      setCouponError("Cupom inválido ou expirado.");
      setAppliedCoupon(null);
    }
  };

  const handleBuscarCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast({ variant: "destructive", title: "CEP inválido", description: "Digite um CEP com 8 dígitos." });
      return;
    }
    setFreteLoading(true);
    setFreteOpcoes(null);
    setFreteSelecionado(null);
    setFreteError(false);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("CEP não encontrado.");
      setCepInfo({ localidade: data.localidade, uf: data.uf });
      // FIX 9: Auto-fill address from ViaCEP
      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      const { opcoes } = calcFrete(data.uf, subtotal);
      setFreteOpcoes(opcoes);
      setFreteSelecionado(opcoes[0]);
    } catch (err: any) {
      toast({ variant: "destructive", title: "CEP não encontrado", description: "Verifique o CEP e tente novamente." });
    } finally {
      setFreteLoading(false);
    }
  };

  const handleCepChange = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    setCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
  };

  const handleCpfChange = (v: string) => {
    setCpf(formatCPF(v));
    setCpfError("");
  };

  // FIX 8 + 9: Full validation on submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!nome.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório", description: "Informe seu nome completo." });
      return;
    }

    // Validate CPF
    if (!validateCPF(cpf)) {
      setCpfError("CPF inválido. Verifique e tente novamente.");
      return;
    }

    // Validate email
    if (!email) return;

    // FIX 8: Validate shipping selection
    if (!freteSelecionado) {
      setFreteError(true);
      setFreteOpen(true);
      toast({ variant: "destructive", title: "Frete obrigatório", description: "Calcule e selecione uma opção de frete antes de continuar." });
      return;
    }

    // FIX 9: Validate address
    if (!numero.trim()) {
      toast({ variant: "destructive", title: "Número obrigatório", description: "Informe o número do endereço de entrega." });
      return;
    }

    if (isPending) return;
    setIsPending(true);
    try {
      // Monta payer com CPF e nome para o backend e para o MP
      const nameParts = nome.trim().split(/\s+/);
      const payerData = {
        email,
        firstName: nameParts[0] || "",
        lastName:  nameParts.slice(1).join(" ") || "",
        cpf:       cpf.replace(/\D/g, ""),
      };

      // Monta endereço completo (preenchido via ViaCEP + campos manuais)
      const addressData = freteSelecionado && cepInfo
        ? {
            zip:          cep.replace(/\D/g, ""),
            street:       logradouro,
            number:       numero,
            complement:   complemento || undefined,
            neighborhood: bairro,
            city:         cepInfo.localidade,
            state:        cepInfo.uf,
          }
        : undefined;

      const data = await createCheckoutPreference(items, payerData, freteValor, addressData);

      addOrder({
        email,
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, ""),
        address: addressData,
        items: items.map((i: any) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          priceTo: i.priceTo,
          image: i.image ?? null,
        })),
        total,
        status: "pending",
        preferenceId: data.preferenceId ?? null,
      });

      window.location.href = data.initPoint;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: err.message || "Ocorreu um erro ao processar o pagamento. Tente novamente.",
      });
      setIsPending(false);
    }
  };

  const inputStyle = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textMain,
    caretColor: "#f97316",
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#f97316");
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = inputBorder);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-md shadow-2xl overflow-y-auto"
        style={{ background: isDark ? "#111" : "#fff", border: `1px solid ${border}`, maxHeight: "92dvh" }}
      >
        <div className="p-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="absolute top-4 right-4"
            style={{ color: textMuted, background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>

          <h3
            className="text-xl font-bold mb-4 uppercase tracking-widest"
            style={{ color: textMain, fontFamily: "'JetBrains Mono', monospace" }}
          >
            Finalizar Compra
          </h3>

          {/* Resumo do pedido */}
          <div className="mb-4 p-3" style={{ background: isDark ? "#0d0d0d" : "#f8f8f8", border: `1px solid ${border}` }}>
            {items.map((i: any) => (
              <div key={i.id} className="flex justify-between text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: isDark ? "#888" : "#666" }}>
                <span>{i.qty}× {i.name}</span>
                <span>{fmt(i.priceTo * i.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-2 mt-2" style={{ borderTop: `1px solid ${border}`, fontFamily: "'JetBrains Mono', monospace", color: isDark ? "#666" : "#888" }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {appliedCoupon && desconto > 0 && (
              <div className="flex justify-between text-xs mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>
                <span>Desconto ({appliedCoupon.code})</span><span>-{fmt(desconto)}</span>
              </div>
            )}
            {freteSelecionado && (
              <div className="flex justify-between text-xs mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: freteSelecionado.valor === 0 ? "#22c55e" : isDark ? "#888" : "#666" }}>
                <span>{freteSelecionado.label}</span>
                <span>{freteSelecionado.valor === 0 ? "GRÁTIS" : fmt(freteSelecionado.valor)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: `1px solid ${border}`, fontFamily: "'JetBrains Mono', monospace", color: "#f97316" }}>
              <span>TOTAL</span><span>{fmt(total)}</span>
            </div>
          </div>

          {/* Cupom */}
          <div className="mb-3" style={{ border: `1px solid ${border}` }}>
            <button type="button" onClick={() => setCouponOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3" style={{ background: "transparent", border: "none", cursor: "pointer", color: textMain }}>
              <span className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
                <Tag size={13} style={{ color: "#f97316" }} />
                {appliedCoupon ? <span style={{ color: "#22c55e" }}>Cupom: {appliedCoupon.code} ({appliedCoupon.label})</span> : "Adicionar cupom de desconto"}
              </span>
              <ChevronDown size={14} style={{ color: textMuted, transform: couponOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            {couponOpen && (
              <div className="px-4 pb-4" style={{ borderTop: `1px solid ${border}` }}>
                <div className="flex gap-2 mt-3">
                  <input type="text" value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }} placeholder="CÓDIGO DO CUPOM" className="flex-1 px-3 py-2 outline-none font-mono text-xs tracking-widest uppercase" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} />
                  <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase" style={{ background: "#f97316", color: "#000", border: "none", cursor: "pointer", flexShrink: 0 }}>APLICAR</button>
                </div>
                {couponError && <p className="font-mono text-xs mt-2" style={{ color: errorColor }}>{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center gap-2 mt-2">
                    <Check size={13} style={{ color: "#22c55e" }} />
                    <p className="font-mono text-xs" style={{ color: "#22c55e" }}>{appliedCoupon.label} aplicado!</p>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="ml-auto font-mono text-xs" style={{ color: textMuted, background: "none", border: "none", cursor: "pointer" }}>remover</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FIX 8: Frete obrigatório — indicador visual de erro */}
          <div className="mb-4" style={{ border: `1px solid ${freteError ? errorColor : border}` }}>
            <button type="button" onClick={() => { setFreteOpen((v) => !v); setFreteError(false); }} className="w-full flex items-center justify-between px-4 py-3" style={{ background: "transparent", border: "none", cursor: "pointer", color: textMain }}>
              <span className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
                <MapPin size={13} style={{ color: freteError ? errorColor : "#f97316" }} />
                {freteSelecionado
                  ? <span style={{ color: freteSelecionado.valor === 0 ? "#22c55e" : textMain }}>{freteSelecionado.label} — {freteSelecionado.valor === 0 ? "GRÁTIS" : fmt(freteSelecionado.valor)}</span>
                  : <span style={{ color: freteError ? errorColor : textMuted }}>Calcular frete {freteError ? "(obrigatório)" : ""}</span>
                }
              </span>
              <ChevronDown size={14} style={{ color: freteError ? errorColor : textMuted, transform: freteOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>

            {freteError && !freteOpen && (
              <div className="flex items-center gap-1 px-4 pb-3" style={{ color: errorColor }}>
                <AlertCircle size={12} />
                <span className="font-mono text-xs">Selecione uma opção de frete para continuar</span>
              </div>
            )}

            {freteOpen && (
              <div className="px-4 pb-4" style={{ borderTop: `1px solid ${border}` }}>
                <div className="flex gap-2 mt-3">
                  <input type="text" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} className="flex-1 px-3 py-2 outline-none font-mono text-sm" style={{ ...inputStyle, letterSpacing: "0.1em" }} onKeyDown={(e) => e.key === "Enter" && handleBuscarCep()} onFocus={focusBorder} onBlur={blurBorder} />
                  <button type="button" onClick={handleBuscarCep} disabled={freteLoading} className="px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase flex items-center gap-1" style={{ background: freteLoading ? (isDark ? "#333" : "#ccc") : "#f97316", color: freteLoading ? textMuted : "#000", border: "none", cursor: freteLoading ? "wait" : "pointer", flexShrink: 0 }}>
                    {freteLoading ? <Loader2 size={13} className="animate-spin" /> : "OK"}
                  </button>
                </div>

                {cepInfo && freteOpcoes && (
                  <div className="mt-3">
                    <p className="font-mono text-xs mb-2" style={{ color: textMuted }}>Entregando em {cepInfo.localidade} — {cepInfo.uf}</p>
                    <div className="flex flex-col gap-2">
                      {freteOpcoes.map((op) => (
                        <label key={op.label} className="flex items-center justify-between px-3 py-2 cursor-pointer" style={{ border: `1px solid ${freteSelecionado?.label === op.label ? "#f97316" : border}`, background: freteSelecionado?.label === op.label ? (isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.05)") : inputBg }}>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="frete" checked={freteSelecionado?.label === op.label} onChange={() => { setFreteSelecionado(op); setFreteError(false); }} style={{ accentColor: "#f97316" }} />
                            <div>
                              <p className="font-mono text-xs font-bold" style={{ color: textMain }}>{op.label}</p>
                              <p className="font-mono text-xs" style={{ color: textMuted }}>{op.prazo}</p>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold" style={{ color: op.valor === 0 ? "#22c55e" : "#f97316" }}>{op.valor === 0 ? "GRÁTIS" : fmt(op.valor)}</span>
                        </label>
                      ))}
                    </div>

                    {/* FIX 9: Address fields after CEP lookup */}
                    <div className="mt-4 space-y-2">
                      <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: textMuted }}>Endereço de entrega</p>
                      <input
                        type="text"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        placeholder="Logradouro"
                        className="w-full px-3 py-2 outline-none font-mono text-xs"
                        style={inputStyle}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          placeholder="Número *"
                          required
                          className="w-24 px-3 py-2 outline-none font-mono text-xs"
                          style={inputStyle}
                          onFocus={focusBorder}
                          onBlur={blurBorder}
                        />
                        <input
                          type="text"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          placeholder="Complemento"
                          className="flex-1 px-3 py-2 outline-none font-mono text-xs"
                          style={inputStyle}
                          onFocus={focusBorder}
                          onBlur={blurBorder}
                        />
                      </div>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Bairro"
                        className="w-full px-3 py-2 outline-none font-mono text-xs"
                        style={inputStyle}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <p className="font-mono text-xs" style={{ color: textMuted }}>
                        {cepInfo.localidade} — {cepInfo.uf}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FIX 9: Buyer data fields */}
          <p className="font-mono text-xs mb-3 tracking-widest uppercase" style={{ color: textMuted }}>
            Dados do comprador
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome completo */}
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo *"
              required
              disabled={isPending}
              className="w-full px-4 py-3 outline-none font-mono text-sm"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />

            {/* CPF */}
            <div>
              <input
                type="text"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="CPF * (000.000.000-00)"
                disabled={isPending}
                className="w-full px-4 py-3 outline-none font-mono text-sm"
                style={{ ...inputStyle, borderColor: cpfError ? errorColor : inputBorder }}
                onFocus={(e) => (e.target.style.borderColor = cpfError ? errorColor : "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = cpfError ? errorColor : inputBorder)}
              />
              {cpfError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle size={12} style={{ color: errorColor }} />
                  <p className="font-mono text-xs" style={{ color: errorColor }}>{cpfError}</p>
                </div>
              )}
            </div>

            {/* E-mail */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail * (para receber o comprovante)"
              required
              disabled={isPending}
              className="w-full px-4 py-3 outline-none font-mono text-sm"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />

            <p className="font-mono text-xs" style={{ color: textMuted, fontSize: "0.68rem" }}>
              Seus dados são obrigatórios pelo Mercado Pago e para entrega. Não serão compartilhados com terceiros.
            </p>

            <button
              type="submit"
              disabled={isPending || !email || !nome}
              className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2"
              style={{
                background: isPending || !email || !nome ? (isDark ? "#333" : "#ccc") : "#f97316",
                cursor: isPending || !email || !nome ? "not-allowed" : "pointer",
                color: isPending || !email || !nome ? (isDark ? "#666" : "#888") : "#000",
                border: "none",
              }}
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending ? "Processando..." : "Ir para pagamento →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
