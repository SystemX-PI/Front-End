import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { InlineFeedback } from "../components/IntegrationUi";
import { login } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as {
    sessionExpired?: boolean;
    logoutWarning?: string;
    registered?: boolean;
  } | null;
  const [email, setEmail] = useState("");
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
      const response = await login({ email, password });
      navigate(response.tipo === "CLIENTE" ? "/portal" : "/admin/dashboard", {
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

  return (
    <AuthShell
      eyebrow="ACESSO"
      title="Entrar"
      description="Use suas credenciais para continuar."
    >
      <form onSubmit={handleSubmit} className="auth-form">
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
  );
}
