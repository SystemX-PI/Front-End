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
      await register({ name, email, password, userType: "FUNCIONARIO" });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="CADASTRO"
      title="Criar conta"
      description="Preencha os dados abaixo."
    >
      <form onSubmit={handleSubmit} className="auth-form compact-auth-form">
        <label className="field auth-field"><span>Nome</span><div className="input-with-icon"><UserRound size={18} /><input type="text" required value={name}
          onChange={(event) => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" /></div></label>
        <label className="field auth-field"><span>E-mail</span><div className="input-with-icon"><Mail size={18} /><input type="email" required value={email}
          onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" /></div></label>
        <label className="field auth-field"><span>Senha</span><div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} required minLength={6} value={password}
          onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button></div></label>
        <p className="form-note">O cadastro público cria uma conta de funcionário. A atribuição de privilégios administrativos deve ser feita por um processo autorizado no backend.</p>
        <div className="password-strength"><span className={password.length >= 6 ? "active" : ""} /><span className={password.length >= 8 ? "active" : ""} /><span className={password.length >= 10 ? "active" : ""} /><small>Use 8+ caracteres.</small></div>
        {error ? <InlineFeedback message={error} kind="error" /> : null}
        <button type="submit" disabled={loading} className="button primary auth-submit">
          {loading ? <><span className="spinner" /> Cadastrando...</> : "Criar conta"}
        </button>
      </form>
      <div className="auth-footer">Já tem acesso? <Link to="/login">Entrar</Link></div>
    </AuthShell>
  );
}
