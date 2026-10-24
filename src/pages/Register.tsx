import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (password !== confirmation) {
      setError("As senhas não coincidem. Confira a confirmação.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({ name, email, password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível concluir o cadastro.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="CADASTRO"
      title="Criar conta"
      description="Organize sua rotina, conecte sua equipe e acompanhe cada próximo passo."
    >
      <form
        onSubmit={handleSubmit}
        className="auth-form register-form"
        aria-busy={loading}
      >
        <div className="registration-welcome">
          <span className="registration-icon">
            <UserRound size={19} />
          </span>
          <div>
            <strong>Sua conta, sua marca</strong>
            <p>Três dias grátis para conhecer a plataforma</p>
          </div>
          <span className="registration-badge">3 dias grátis</span>
        </div>
        <label className="field auth-field">
          <span>Nome da sua empresa</span>
          <div className="input-with-icon">
            <UserRound size={18} />
            <input
              type="text"
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Como sua empresa se chama?"
              autoComplete="name"
            />
          </div>
        </label>
        <label className="field auth-field">
          <span>E-mail</span>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              maxLength={255}
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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
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
        <label className="field auth-field">
          <span>Confirmar senha</span>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
              aria-label="Confirmar senha"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              placeholder="Digite sua senha novamente"
              aria-invalid={
                confirmation.length > 0 && confirmation !== password
              }
            />
          </div>
          {confirmation ? (
            <small
              className={
                confirmation === password
                  ? "validation-success"
                  : "validation-error"
              }
            >
              {confirmation === password
                ? "As senhas coincidem."
                : "A confirmação deve ser igual à senha."}
            </small>
          ) : null}
        </label>
        <p className="form-note">
          Sua empresa ganha três dias gratuitos. Depois desse período, uma assinatura é necessária para continuar.
        </p>
        <div className="password-strength" aria-label="Orientação de senha">
          <span className={password.length >= 6 ? "active" : ""} />
          <span className={password.length >= 8 ? "active" : ""} />
          <span className={password.length >= 10 ? "active" : ""} />
          <small>
            {password.length >= 10
              ? "Boa extensão de senha"
              : password.length >= 6
                ? "Mínimo atendido; prefira 10 ou mais caracteres"
                : "Use pelo menos 6 caracteres"}
          </small>
        </div>
        <div className="registration-checklist">
          <span>
            <Check size={14} />
            Conecte seus canais
          </span>
          <span>
            <Check size={14} />
            Convide sua equipe
          </span>
        </div>
        {error ? <InlineFeedback message={error} kind="error" /> : null}
        <button
          type="submit"
          disabled={loading}
          className="button primary auth-submit"
        >
          {loading ? (
            <>
              <span className="spinner" /> Cadastrando...
            </>
          ) : (
            <>
              Criar minha conta <ArrowRight size={17} />
            </>
          )}
        </button>
        <p className="registration-security">
          <ShieldCheck size={15} />
          Seu cadastro cria um espaço exclusivo para sua empresa e sua equipe.
        </p>
      </form>
      <div className="auth-footer">
        Já tem acesso? <Link to="/login">Entrar</Link>
      </div>
    </AuthShell>
  );
}
