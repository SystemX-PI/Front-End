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
  const showDevQuickAccess =
    import.meta.env.DEV &&
    typeof navigator !== "undefined" &&
    !navigator.webdriver;

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

  async function handleQuickAccess(
    presetEmail: string,
    targetPath: string,
  ) {
    if (loading) return;
    setEmail(presetEmail);
    setPassword("ConsorTech@2026");
    setLoading(true);
    setError("");
    try {
      await login({ email: presetEmail, password: "ConsorTech@2026" });
      navigate(targetPath, { replace: true });
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
        {showDevQuickAccess ? (
          <div className="action-row" style={{ marginTop: 8, justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={loading}
              className="button ghost"
              onClick={() => void handleQuickAccess("admin@consortech.com", "/admin/disparo-manual")}
            >
              Admin (Disparo Manual)
            </button>
            <button
              type="button"
              disabled={loading}
              className="button ghost"
              onClick={() => void handleQuickAccess("aurora@consortech.com", "/app")}
            >
              Meu Espaço SaaS
            </button>
            <button
              type="button"
              disabled={loading}
              className="button ghost"
              onClick={() => void handleQuickAccess("carlos.mendes@cliente.com", "/portal")}
            >
              Portal Cliente
            </button>
          </div>
        ) : null}
      </form>
      <div className="auth-footer">
        Não tem acesso? <Link to="/register">Solicitar cadastro</Link>
      </div>
    </AuthShell>
    </>
  );
}
