import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { InlineFeedback } from "../components/IntegrationUi";
import { register } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
      await register({ name, email, password });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="NOVO ACESSO" title="Crie sua conta" description="Preencha seus dados para começar a usar a plataforma.">
      <form onSubmit={handleSubmit} className="auth-form compact-auth-form">
        <label className="field auth-field"><span>Nome completo</span><div className="input-with-icon"><UserRound size={18} /><input type="text" required value={name}
          onChange={(event) => setName(event.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" /></div></label>
        <label className="field auth-field"><span>E-mail</span><div className="input-with-icon"><Mail size={18} /><input type="email" required value={email}
          onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" /></div></label>
        <label className="field auth-field"><span>Senha</span><div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} required minLength={6} value={password}
          onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button></div></label>
        <div className="password-strength"><span className={password.length >= 6 ? "active" : ""} /><span className={password.length >= 8 ? "active" : ""} /><span className={password.length >= 10 ? "active" : ""} /><small>Use 8 ou mais caracteres para maior segurança.</small></div>
        {error ? <InlineFeedback message={error} kind="error" /> : null}
        <button type="submit" disabled={loading} className="button primary auth-submit">
          {loading ? <><span className="spinner" /> Criando...</> : "Criar minha conta"}
        </button>
      </form>
      <div className="auth-footer">Já possui uma conta? <Link to="/login">Entrar</Link></div>
    </AuthShell>
  );
}
