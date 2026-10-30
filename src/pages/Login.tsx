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
      eyebrow="ACESSO"
      title="Entrar"
      description="Entre com sua conta Google ou use suas credenciais."
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
        <label className="field auth-field">
          <span>Senha</span>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
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
        </label>
        <Link className="forgot-password-link" to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>Esqueci minha senha</Link>
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
    </AuthShell>
    </>
  );
}
