(() => {
  "use strict";
  const script = document.currentScript;
  const endpoint = script?.dataset.sessionUrl;
  if (!script?.src || !endpoint) return;

  const systemx = new URL(script.src).origin;
  const sessionUrl = new URL(endpoint, location.href);
  if (sessionUrl.origin !== location.origin) return;

  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; }
    button { display: block; margin-left: auto; padding: 11px 18px; border: 0; border-radius: 24px;
      background: #3341a6; color: #fff; cursor: pointer; font: 600 14px system-ui; }
    iframe { width: min(380px, calc(100vw - 32px)); height: min(490px, calc(100dvh - 90px));
      margin-bottom: 8px; background: white; border: 1px solid #dce2ee; border-radius: 16px;
      box-shadow: 0 10px 45px #15244935; }
    iframe:not([hidden]) { display: block; }
    p { margin: 0 0 8px; max-width: 270px; background: white; color: #902527;
      padding: 10px; border-radius: 8px; font: 14px system-ui; }
  `;
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.title = "Chat de notificações SystemX";
  frame.referrerPolicy = "no-referrer";
  frame.sandbox.add("allow-scripts", "allow-same-origin");
  const feedback = document.createElement("p");
  feedback.hidden = true;
  feedback.setAttribute("role", "alert");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Abrir chat SystemX";
  button.setAttribute("aria-expanded", "false");
  shadow.append(style, frame, feedback, button);
  (document.body || document.documentElement).append(host);

  let opened = false;
  let loading = false;
  async function connect() {
    if (!opened || loading) return;
    loading = true;
    try {
      const response = await fetch(sessionUrl, { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error();
      const { token } = await response.json();
      if (typeof token !== "string" || !token) throw new Error();
      if (opened) {
        feedback.hidden = true;
        frame.contentWindow?.postMessage({ type: "systemx:session", token }, systemx);
      }
    } catch {
      if (opened) {
        feedback.textContent = "Não foi possível abrir o chat. Verifique seu acesso no sistema parceiro.";
        feedback.hidden = false;
      }
    } finally {
      loading = false;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== systemx || event.source !== frame.contentWindow) return;
    if (event.data?.type === "systemx:ready") void connect();
  });

  button.addEventListener("click", () => {
    opened = !opened;
    button.setAttribute("aria-expanded", String(opened));
    button.textContent = opened ? "Fechar chat SystemX" : "Abrir chat SystemX";
    frame.hidden = !opened;
    feedback.hidden = true;
    if (opened) {
      const url = new URL("/widget", systemx);
      url.searchParams.set("parent", location.origin);
      frame.src = url.href;
    } else {
      frame.src = "about:blank";
    }
  });
})();
