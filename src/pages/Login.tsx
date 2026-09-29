import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { InlineFeedback } from "../components/IntegrationUi";
import { login } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      navigate("/integracoes", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="ACESSO SEGURO" title="Bem-vindo de volta" description="Entre com seus dados para acessar a central.">
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="field auth-field">
          <span>E-mail</span>
          <div className="input-with-icon"><Mail size={18} /><input type="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" /></div>
        </label>
        <label className="field auth-field">
          <span>Senha</span>
          <div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} required value={password}
            onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button></div>
        </label>
        {error ? <InlineFeedback message={error} kind="error" /> : null}
        <button type="submit" disabled={loading} className="button primary auth-submit">
          {loading ? <><span className="spinner" /> Entrando...</> : "Entrar na plataforma"}
        </button>
      </form>
      <div className="auth-footer">Ainda não possui uma conta? <Link to="/register">Criar conta</Link></div>
    </AuthShell>
  );
}
