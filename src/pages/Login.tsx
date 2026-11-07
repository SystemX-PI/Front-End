import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { InlineFeedback } from "../components/IntegrationUi";
import { ApiError } from "../services/http";
import { login, loginWithGoogle } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as {
    sessionExpired?: boolean;
    logoutWarning?: string;
    registered?: boolean;
    passwordReset?: boolean;
    email?: string;
  } | null;
  const [email, setEmail] = useState(navigationState?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      navigate("/app", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível entrar no sistema.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle(credential);
      navigate("/app", { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        navigate("/register", {
          replace: true,
          state: { googleRegistrationCredential: credential },
        });
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível entrar com Google.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <AuthShell
      compactLogin
      eyebrow="ACESSO"
      title="Entrar"
    >
      <GoogleSignInButton
        busy={loading}
        onCredential={handleGoogleCredential}
        onError={setError}
      />
      <div className="auth-divider"><span>ou entre com e-mail</span></div>
      <form onSubmit={handleSubmit} className="auth-form">
        {navigationState?.passwordReset ? <InlineFeedback message="Senha redefinida. Entre com sua nova senha." kind="success" /> : null}
        {navigationState?.registered ? (
          <InlineFeedback
            message="Conta criada. Entre com seu e-mail e senha."
            kind="success"
          />
        ) : null}
        {navigationState?.sessionExpired ? (
          <InlineFeedback
            message="Sua sessão expirou. Entre novamente."
            kind="info"
          />
        ) : null}
        {navigationState?.logoutWarning ? (
          <InlineFeedback
            message={navigationState.logoutWarning}
            kind="error"
          />
        ) : null}
        <label className="field auth-field">
          <span>E-mail</span>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
        </label>
        <div className="field auth-field">
          <div className="login-password-label">
            <label htmlFor="login-password">Senha</label>
            <Link className="forgot-password-link" to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
              Esqueci minha senha
            </Link>
          </div>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {error ? <InlineFeedback message={error} kind="error" /> : null}
        <button
          type="submit"
          disabled={loading}
          className="button primary auth-submit"
        >
          {loading ? (
            <>
              <span className="spinner" /> Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>
      <div className="auth-footer">
        Não tem acesso? <Link to="/register">Solicitar cadastro</Link>
      </div>
      {import.meta.env.DEV && (
        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border, #cbd5e1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <small style={{ color: "var(--text-muted, #64748b)", textAlign: "center", fontWeight: 600, fontSize: "0.75rem" }}>DEMO LOCAL (DESENVOLVIMENTO)</small>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              className="button secondary"
              style={{ fontSize: "0.75rem", padding: "0.45rem 0.5rem" }}
              onClick={() => {
                localStorage.setItem("token", "mock-jwt.eyJ1aWQiOjEsInN1YiI6ImF1cm9yYSIsImV4cCI6OTk5OTk5OTk5OX0.sig");
                localStorage.setItem("refreshToken", "mock-refresh-token");
                localStorage.setItem("userType", "CLIENTE");
                localStorage.setItem("userEmail", "aurora@consortech.com");
                sessionStorage.setItem("show-trial-notice", "true");
                navigate("/app", { replace: true });
              }}
            >
              Entrar como Cliente
            </button>
            <button
              type="button"
              className="button secondary"
              style={{ fontSize: "0.75rem", padding: "0.45rem 0.5rem" }}
              onClick={() => {
                localStorage.setItem("token", "mock-jwt.eyJ1aWQiOjEsInN1YiI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.sig");
                localStorage.setItem("refreshToken", "mock-refresh-token");
                localStorage.setItem("userType", "ADMINISTRADOR");
                localStorage.setItem("userEmail", "admin@consortech.com");
                navigate("/admin/dashboard", { replace: true });
              }}
            >
              Entrar como Admin
            </button>
          </div>
        </div>
      )}
    </AuthShell>
    </>
  );
}
