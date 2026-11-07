import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function devMockPlugin(): Plugin {
  const future = new Date(Date.now() + 30 * 86400000).toISOString();
  const clientContext = {
    role: "CLIENTE",
    name: "Empresa Aurora",
    email: "aurora@consortech.com",
    active: true,
    simulationEnabled: true,
    stripeEnabled: false,
    subscription: {
      tier: "TRIAL",
      whatsappLimit: 1,
      gmailLimit: 1,
      upgradePriceCents: 9990,
      currency: "BRL",
    },
    account: {
      id: 7,
      nome: "Aurora Consórcios",
      brandName: "Aurora Consórcios",
      logo: "",
      primaryColor: "#315fe8",
      accentColor: "#35cda0",
      createdAt: new Date().toISOString(),
      trialEndsAt: future,
      paidUntil: null as string | null,
      professional: false,
      suspended: false,
    },
    instances: [{ id: 1, name: "vendas" }],
    mailboxes: [{ id: 1, name: "Financeiro", email: "financeiro@aurora.com.br", verified: true }],
    users: [
      { id: 1, name: "Ana Silva", email: "ana@aurora.com.br", active: true },
      { id: 2, name: "Carlos Souza", email: "carlos@aurora.com.br", active: true },
    ],
  };

  const adminContext = {
    role: "ADMINISTRADOR",
    name: "Administrador Geral",
    email: "admin@consortech.com",
    active: true,
    simulationEnabled: true,
    stripeEnabled: false,
    subscription: {
      tier: "PRO",
      whatsappLimit: 99,
      gmailLimit: 99,
      upgradePriceCents: 9990,
      currency: "BRL",
    },
    account: null,
    instances: [],
    mailboxes: [],
    users: [],
  };

  const clients = [
    { id: 7, nome: "Aurora Consórcios", email: "aurora@consortech.com", trialEndsAt: future, paidUntil: null, suspended: false, instances: 1, gmails: 1, users: 2, professional: false },
    { id: 8, nome: "Center Car Consórcios", email: "contato@centercar.com.br", trialEndsAt: future, paidUntil: "2027-01-01T00:00:00Z", suspended: false, instances: 3, gmails: 2, users: 5, professional: true },
    { id: 9, nome: "Porto Seguro Parcerias", email: "operacoes@porto.com.br", trialEndsAt: future, paidUntil: null, suspended: false, instances: 2, gmails: 1, users: 4, professional: false },
  ];

  const queueItems = [
    {
      id: 1,
      contemplacaoId: 101,
      nomeCliente: "Marcos Oliveira",
      cpf: "123.456.789-00",
      grupo: "1024",
      cota: "045",
      valorCredito: 85000,
      dataContemplacao: new Date(Date.now() - 86400000).toISOString(),
      comunicacao: {
        processoId: 1,
        statusGeral: "COMUNICADO_PARCIAL",
        whatsapp: { id: 1, destinatario: "(11) 98765-4321", status: "SUCESSO", erro: null, criadaEm: new Date().toISOString(), enviadaEm: new Date().toISOString() },
        email: { id: 1, destinatario: "marcos@email.com", status: "PENDENTE", erro: null, criadaEm: new Date().toISOString(), enviadaEm: null },
      },
    },
    {
      id: 2,
      contemplacaoId: 102,
      nomeCliente: "Juliana Santos",
      cpf: "987.654.321-11",
      grupo: "1024",
      cota: "112",
      valorCredito: 120000,
      dataContemplacao: new Date(Date.now() - 172800000).toISOString(),
      comunicacao: {
        processoId: 2,
        statusGeral: "COMUNICADO_NOS_DOIS",
        whatsapp: { id: 2, destinatario: "(11) 91234-5678", status: "SUCESSO", erro: null, criadaEm: new Date().toISOString(), enviadaEm: new Date().toISOString() },
        email: { id: 2, destinatario: "juliana@email.com", status: "SUCESSO", erro: null, criadaEm: new Date().toISOString(), enviadaEm: new Date().toISOString() },
      },
    },
    {
      id: 3,
      contemplacaoId: 103,
      nomeCliente: "Roberto Almeida",
      cpf: "456.789.123-22",
      grupo: "2048",
      cota: "008",
      valorCredito: 65000,
      dataContemplacao: new Date().toISOString(),
      comunicacao: {
        processoId: 3,
        statusGeral: "PENDENTE",
        whatsapp: { id: 3, destinatario: "(15) 99887-6655", status: "PENDENTE", erro: null, criadaEm: new Date().toISOString(), enviadaEm: null },
        email: { id: 3, destinatario: "roberto@email.com", status: "PENDENTE", erro: null, criadaEm: new Date().toISOString(), enviadaEm: null },
      },
    },
  ];

  return {
    name: "dev-mock-server",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api")) {
          return next();
        }

        const method = req.method || "GET";
        const sendJson = (data: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };

        let body = "";
        req.on("data", (chunk: Buffer | string) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          let parsed: Record<string, any> = {};
          try {
            if (body) parsed = JSON.parse(body);
          } catch {}

          // Auth
          if (url.startsWith("/api/auth/login") || url.startsWith("/api/auth/google")) {
            const isAdmin = typeof parsed.email === "string" && parsed.email.includes("admin");
            return sendJson({
              token: "mock-jwt.eyJ1aWQiOjEsInN1YiI6ImF1cm9yYSIsImV4cCI6OTk5OTk5OTk5OX0.sig",
              refreshToken: "mock-refresh-token",
              tipo: isAdmin ? "ADMINISTRADOR" : "CLIENTE",
              expiresIn: 86400,
              email: parsed.email || (isAdmin ? "admin@consortech.com" : "aurora@consortech.com"),
            });
          }

          if (url.startsWith("/api/auth/register")) {
            return sendJson({ id: 10, tipo: "CLIENTE" }, 201);
          }

          if (url.startsWith("/api/auth/logout") || url.startsWith("/api/auth/refresh")) {
            return sendJson({ token: "mock-jwt", refreshToken: "mock-refresh", expiresIn: 86400, tipo: "CLIENTE" });
          }

          // Platform Context
          if (url.startsWith("/api/platform/context")) {
            const hasAccountParam = url.includes("account=");
            const authHeader = req.headers.authorization || "";
            const isAdmin = authHeader.includes("admin") && !hasAccountParam;
            return sendJson(isAdmin ? adminContext : clientContext);
          }

          // Platform Clients
          if (url.startsWith("/api/platform/clients")) {
            if (method === "POST") {
              const newClient = {
                id: clients.length + 10,
                nome: parsed.name || "Novo Cliente",
                email: parsed.email || "novo@cliente.com",
                trialEndsAt: future,
                paidUntil: null,
                suspended: false,
                instances: 0,
                gmails: 0,
                users: 1,
                professional: false,
              };
              clients.push(newClient);
              return sendJson(newClient, 201);
            }
            return sendJson(clients);
          }

          // Platform WhatsApp
          if (url.includes("/whatsapp/status") || url.endsWith("/status")) {
            return sendJson({ instanceName: "vendas", state: "open", qrCode: null, pairingCode: null });
          }
          if (url.includes("/whatsapp/qr") || url.endsWith("/qr")) {
            return sendJson({
              instanceName: "vendas",
              state: "connecting",
              qrCode: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='white'/><rect x='20' y='20' width='50' height='50' fill='%2310213d'/><rect x='130' y='20' width='50' height='50' fill='%2310213d'/><rect x='20' y='130' width='50' height='50' fill='%2310213d'/><circle cx='100' cy='100' r='20' fill='%2335cda0'/></svg>",
            });
          }
          if (url.includes("/disconnect")) {
            return sendJson({}, 204);
          }
          if (url.includes("/instances")) {
            if (method === "POST") {
              const inst = { id: clientContext.instances.length + 1, name: parsed.name || "suporte" };
              clientContext.instances.push(inst);
              return sendJson(inst, 201);
            }
            return sendJson({}, 204);
          }

          // Platform Mailboxes
          if (url.includes("/mailboxes")) {
            if (method === "POST") {
              const box = { id: clientContext.mailboxes.length + 1, name: parsed.name || "Atendimento", email: parsed.email || "contato@aurora.com.br", verified: true };
              clientContext.mailboxes.push(box);
              return sendJson(box, 201);
            }
            return sendJson({}, 204);
          }

          // Platform Brand
          if (url.includes("/brand")) {
            if (method === "PUT" || method === "POST") {
              if (parsed.name) clientContext.account.brandName = parsed.name;
              if (parsed.primary) clientContext.account.primaryColor = parsed.primary;
              if (parsed.accent) clientContext.account.accentColor = parsed.accent;
              return sendJson({}, 204);
            }
            return sendJson(clientContext.account);
          }

          // Platform Users / Team
          if (url.includes("/users")) {
            if (method === "POST") {
              const usr = { id: clientContext.users.length + 1, name: parsed.name || "Novo Usuário", email: parsed.email || "novo@aurora.com.br", active: true };
              clientContext.users.push(usr);
              return sendJson(usr, 201);
            }
            return sendJson({}, 204);
          }

          // Platform Profile
          if (url.includes("/profile")) {
            if (parsed.name) clientContext.name = parsed.name;
            return sendJson({}, 204);
          }

          // Platform Subscription & Checkout
          if (url.includes("/checkout")) {
            return sendJson({
              id: "order-demo-123",
              paymentMethod: parsed.paymentMethod || "PIX",
              status: "PENDING",
              amountCents: 9990,
              currency: "BRL",
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              paidAt: null,
              simulation: true,
              pixCode: "00020126580014br.gov.bcb.pix0136consortech-demo-simulacao520400005303986540599.905802BR5910CONSORTECH6009SAO PAULO62070503***6304ABCD",
            }, 201);
          }
          if (url.includes("/confirm")) {
            clientContext.subscription.tier = "PRO";
            clientContext.subscription.whatsappLimit = 3;
            clientContext.subscription.gmailLimit = 2;
            clientContext.account.professional = true;
            clientContext.account.paidUntil = future;
            return sendJson({ status: "PAID" });
          }

          // Dashboard & Queue
          if (url.startsWith("/api/integracoes/comunicacoes/fila")) {
            if (url.includes("/pagina")) {
              return sendJson({ items: queueItems, total: queueItems.length, totalPages: 1, page: 0 });
            }
            return sendJson(queueItems);
          }

          // Clientes
          if (url.startsWith("/api/clientes")) {
            return sendJson({
              items: [
                { id: 1, nome: "Marcos Oliveira", cpf: "123.456.789-00", email: "marcos@email.com", telefone: "(11) 98765-4321", ativo: true },
                { id: 2, nome: "Juliana Santos", cpf: "987.654.321-11", email: "juliana@email.com", telefone: "(11) 91234-5678", ativo: true },
                { id: 3, nome: "Roberto Almeida", cpf: "456.789.123-22", email: "roberto@email.com", telefone: "(15) 99887-6655", ativo: true },
              ],
              total: 3,
              totalPages: 1,
              page: 0,
            });
          }

          // Consórcios, cotas, auditoria, etc.
          if (url.includes("/pagina")) {
            return sendJson({
              items: [
                { id: 1, nome: "Consórcio Imobiliário Premium", tipoNome: "Imóvel", ativo: true, numero: "1024", valorCredito: 150000, data: new Date().toISOString() },
                { id: 2, nome: "Consórcio Automotivo Express", tipoNome: "Automóvel", ativo: true, numero: "2048", valorCredito: 60000, data: new Date().toISOString() },
              ],
              total: 2,
              totalPages: 1,
              page: 0,
            });
          }

          // Default fallback for any other GET/POST
          return sendJson({ items: [], total: 0, totalPages: 1 });
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devMockPlugin()],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
