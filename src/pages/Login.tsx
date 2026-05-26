import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(user.trim(), pass);
    if (ok) {
      setLocation("/admin");
    } else {
      setError("Usuário ou senha inválidos.");
    }
    setLoading(false);
  };

  const bg = isDark ? "#0a0a0a" : "#f8f8f8";
  const cardBg = isDark ? "#111111" : "#ffffff";
  const border = isDark ? "#222222" : "#e5e5e5";
  const inputBg = isDark ? "#0d0d0d" : "#f5f5f5";
  const textPrimary = isDark ? "#e8e8e8" : "#111111";
  const textMuted = isDark ? "#555555" : "#777777";

  return (
    <div
      style={{
        background: bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <a
            href="/"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "2.2rem",
                fontWeight: 900,
                color: textPrimary,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              G1%
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: "#f97316",
                textTransform: "uppercase",
              }}
            >
              SUPLEMENTOS
            </div>
          </a>
          <div
            style={{
              marginTop: "16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: textMuted,
              textTransform: "uppercase",
            }}
          >
            ACESSO RESTRITO
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            padding: "40px 36px",
          }}
        >
          {/* Header line */}
          <div
            style={{
              height: "2px",
              background: "#f97316",
              marginBottom: "32px",
              width: "40px",
            }}
          />

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: textMuted,
                  marginBottom: "8px",
                }}
              >
                USUÁRIO
              </label>
              <input
                data-testid="input-username"
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
                style={{
                  width: "100%",
                  background: inputBg,
                  border: `1px solid ${border}`,
                  color: textPrimary,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.85rem",
                  padding: "12px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                  caretColor: "#f97316",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                onBlur={(e) => (e.target.style.borderColor = border)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "28px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: textMuted,
                  marginBottom: "8px",
                }}
              >
                SENHA
              </label>
              <div style={{ position: "relative" }}>
                <input
                  data-testid="input-password"
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{
                    width: "100%",
                    background: inputBg,
                    border: `1px solid ${border}`,
                    color: textPrimary,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.85rem",
                    padding: "12px 44px 12px 14px",
                    outline: "none",
                    boxSizing: "border-box",
                    caretColor: "#f97316",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                  onBlur={(e) => (e.target.style.borderColor = border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: textMuted,
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                data-testid="text-login-error"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  color: "#ef4444",
                  marginBottom: "20px",
                  padding: "10px 12px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.05)",
                  letterSpacing: "0.03em",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              data-testid="button-login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? "#c2410c" : "#f97316",
                color: "#000",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading && (
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #000",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              )}
              {loading ? "VERIFICANDO..." : "ENTRAR"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            href="/"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: textMuted,
              textDecoration: "none",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Voltar à loja
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
