import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = { credential?: string };
type GoogleSignInPurpose = "signin" | "link";

interface GoogleIdentitySdk {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        error_callback?: (error: { type?: string }) => void;
        auto_select?: boolean;
        ux_mode?: "popup";
      }): void;
      renderButton(
        element: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          shape: "rectangular";
          text: "signin_with" | "continue_with";
          width: number;
          locale: "pt-BR";
        },
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentitySdk;
  }
}

let googleScriptPromise: Promise<GoogleIdentitySdk> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentitySdk> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<GoogleIdentitySdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error("A biblioteca de autenticação do Google não iniciou."));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Não foi possível carregar o login do Google."));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

export default function GoogleSignInButton({
  purpose = "signin",
  busy = false,
  onCredential,
  onError,
}: {
  purpose?: GoogleSignInPurpose;
  busy?: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const errorHandler = useRef(onError);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(clientId ? "loading" : "missing");

  useEffect(() => {
    credentialHandler.current = onCredential;
    errorHandler.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) return;

    let mounted = true;
    const target = element.current;
    if (!target) return;
    void loadGoogleIdentity().then((google) => {
      if (!mounted) return;
      google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: "popup",
        auto_select: false,
        callback: (response) => {
          const credential = response.credential?.trim();
          if (!credential) {
            errorHandler.current("O Google não retornou uma credencial válida. Tente novamente.");
            return;
          }
          credentialHandler.current(credential);
        },
        error_callback: () => {
          errorHandler.current("Não foi possível abrir a autenticação do Google. Tente novamente.");
        },
      });
      target.replaceChildren();
      google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: purpose === "signin" ? "signin_with" : "continue_with",
        width: Math.max(180, Math.min(400, Math.round(target.clientWidth || 400))),
        locale: "pt-BR",
      });
      setState("ready");
    }).catch(() => {
      if (mounted) setState("error");
    });

    return () => {
      mounted = false;
      target.replaceChildren();
    };
  }, [clientId, purpose]);

  return (
    <div className={`google-signin ${busy ? "is-busy" : ""}`} aria-busy={busy || state === "loading"}>
      <div ref={element} className="google-signin-button" />
      {state === "loading" ? <span className="google-signin-status" role="status">Carregando login do Google…</span> : null}
      {state === "missing" ? (
        <span className="google-signin-status error" role="alert">
          Configure VITE_GOOGLE_CLIENT_ID para habilitar o login com Google.
        </span>
      ) : null}
      {state === "error" ? (
        <span className="google-signin-status error" role="alert">
          Não foi possível carregar o login do Google. Confira a conexão e tente novamente.
        </span>
      ) : null}
    </div>
  );
}
