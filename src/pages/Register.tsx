import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { InlineFeedback } from "../components/IntegrationUi";
import { register, registerWithGoogle } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const preauthorizedCredential = (location.state as { googleRegistrationCredential?: string } | null)?.googleRegistrationCredential;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleCredential, setGoogleCredential] = useState<string | null>(preauthorizedCredential || null);

  async function handleGoogleRegistration(event: FormEvent) {
    event.preventDefault();
    if (loading || !googleCredential) return;
    setLoading(true);
    setError("");
    try {
      await registerWithGoogle(googleCredential, name);
      // Reload the app entry after storing tokens so the authenticated route initializes cleanly.
      window.location.replace("/app");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível concluir o cadastro com Google.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (googleCredential) {
    return (
      <AuthShell
        registration
        eyebrow="CADASTRO COM GOOGLE"
        title="Quase lá"
        description="Informe somente o nome da sua empresa para criar seu espaço."
      >
        <form onSubmit={handleGoogleRegistration} className="auth-form register-form" aria-busy={loading}>
          <div className="registration-welcome">
            <span className="registration-icon"><UserRound size={19} /></span>
            <div>
              <strong>Fazer Cadastro com o Google</strong>
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
                minLength={2}
                maxLength={255}
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Como sua empresa se chama?"
                autoComplete="organization"
              />
            </div>
          </label>
          {error ? <InlineFeedback message={error} kind="error" /> : null}
          <button type="submit" disabled={loading} className="button primary auth-submit">
            {loading ? <><span className="spinner" /> Cadastrando...</> : <>Concluir cadastro <ArrowRight size={17} /></>}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={loading}
            onClick={() => { setGoogleCredential(null); setName(""); setError(""); }}
          >
            <ArrowLeft size={16} /> Voltar e escolher outra conta
          </button>
        </form>
        <div className="auth-footer">
          Já tem acesso? <Link to="/login">Entrar</Link>
        </div>
      </AuthShell>
    );
  }

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
      registration
      eyebrow="CADASTRO"
      title="Criar conta"
      description="Organize sua rotina, conecte sua equipe e acompanhe cada próximo passo."
    >
      <form
        onSubmit={handleSubmit}
        className="auth-form register-form"
        aria-busy={loading}
      >
        <div className="google-register-entry">
          <strong>Fazer Cadastro com o Google</strong>
          <GoogleSignInButton
            purpose="register"
            busy={loading}
            onCredential={(credential) => { setError(""); setName(""); setGoogleCredential(credential); }}
            onError={setError}
          />
        </div>
        <div className="auth-divider"><span>ou cadastre com e-mail</span></div>
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

