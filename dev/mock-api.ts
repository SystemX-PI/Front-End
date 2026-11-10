import type { Plugin } from "vite";

type MockRole = "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE" | "USUARIO";

function createMockJwt(payload: {
  uid: number;
  email: string;
  tipo: MockRole;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      uid: payload.uid,
      sub: payload.email,
      tipo: payload.tipo,
      av: 1,
      iat: Math.floor(Date.now() / 1000),
      exp: 9999999999,
    }),
  ).toString("base64url");
  return `${header}.${body}.mock-signature`;
}

function parseAuthUser(authHeader?: string): {
  uid: number;
  email: string;
  tipo: MockRole;
} {
  const raw = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
  const parts = raw.split(".");
  if (parts.length === 3) {
    try {
      const decoded = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      ) as {
        uid?: number;
        sub?: string;
        tipo?: MockRole;
      };
      if (
        decoded.tipo === "ADMINISTRADOR" ||
        decoded.tipo === "FUNCIONARIO" ||
        decoded.tipo === "CLIENTE" ||
        decoded.tipo === "USUARIO"
      ) {
        return {
          uid: Number.isSafeInteger(decoded.uid) ? Number(decoded.uid) : 1,
          email: decoded.sub || "usuario@consortech.com",
          tipo: decoded.tipo,
        };
      }
    } catch {
      // Fallback for opaque tokens below
    }
  }
  const lower = raw.toLowerCase();
  if (lower.includes("admin")) {
    return { uid: 1, email: "admin@consortech.com", tipo: "ADMINISTRADOR" };
  }
  if (lower.includes("func") || lower.includes("operador")) {
    return {
      uid: 2,
      email: "funcionario@consortech.com",
      tipo: "FUNCIONARIO",
    };
  }
  return { uid: 7, email: "aurora@consortech.com", tipo: "CLIENTE" };
}

export function devMockPlugin(): Plugin {
  const nowIso = new Date().toISOString();
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgoIso = new Date(Date.now() - 172800000).toISOString();
  const future = new Date(Date.now() + 30 * 86400000).toISOString();

  const clientContext = {
    role: "CLIENTE" as MockRole,
    name: "Empresa Aurora",
    email: "aurora@consortech.com",
    photo: null as string | null,
    active: true,
    simulationEnabled: true,
    stripeEnabled: false,
    subscription: {
      tier: "TRIAL" as "TRIAL" | "PRO",
      whatsappLimit: 1,
      gmailLimit: 1,
      upgradePriceCents: 9990,
      currency: "BRL",
      billingProvider: null as string | null,
    },
    account: {
      id: 7,
      nome: "Aurora Consórcios",
      brandName: "Aurora Consórcios",
      logo: "",
      primaryColor: "#315fe8",
      accentColor: "#35cda0",
      createdAt: nowIso,
      trialEndsAt: future,
      paidUntil: null as string | null,
      professional: false,
      suspended: false,
    },
    instances: [{ id: 1, name: "vendas" }],
    mailboxes: [
      {
        id: 1,
        name: "Financeiro",
        email: "financeiro@aurora.com.br",
        verified: true,
      },
    ],
    users: [
      { id: 1, name: "Ana Silva", email: "ana@aurora.com.br", active: true },
      {
        id: 2,
        name: "Carlos Souza",
        email: "carlos@aurora.com.br",
        active: true,
      },
    ],
  };

  const adminContext = {
    role: "ADMINISTRADOR" as MockRole,
    name: "Administrador Geral",
    email: "admin@consortech.com",
    photo: null as string | null,
    active: true,
    simulationEnabled: true,
    stripeEnabled: false,
    subscription: {
      tier: "PRO" as const,
      whatsappLimit: 99,
      gmailLimit: 99,
      upgradePriceCents: 9990,
      currency: "BRL",
      billingProvider: null as string | null,
    },
    account: null,
    instances: [] as { id: number; name: string }[],
    mailboxes: [] as {
      id: number;
      name: string;
      email: string;
      verified: boolean;
    }[],
    users: [] as { id: number; name: string; email: string; active: boolean }[],
  };

  const operationChannelsContext = {
    operationChannels: true,
    role: "ADMINISTRADOR" as MockRole,
    name: "Administração ConsorTech",
    email: "admin@consortech.com",
    photo: null as string | null,
    active: true,
    simulationEnabled: true,
    stripeEnabled: false,
    subscription: {
      tier: "PRO" as const,
      whatsappLimit: 5,
      gmailLimit: 5,
      upgradePriceCents: 9990,
      currency: "BRL",
      billingProvider: null as string | null,
    },
    account: {
      id: 1,
      nome: "Operação Interna ConsorTech",
      brandName: "ConsorTech Operação",
      logo: "",
      primaryColor: "#315fe8",
      accentColor: "#35cda0",
      createdAt: nowIso,
      trialEndsAt: future,
      paidUntil: future,
      professional: true,
      suspended: false,
    },
    instances: [{ id: 101, name: "operacao-central" }],
    mailboxes: [
      {
        id: 101,
        name: "Notificações ConsorTech",
        email: "notificacoes@consortech.com.br",
        verified: true,
      },
    ],
    users: [] as { id: number; name: string; email: string; active: boolean }[],
  };

  const clients = [
    {
      id: 7,
      nome: "Aurora Consórcios",
      email: "aurora@consortech.com",
      trialEndsAt: future,
      paidUntil: null as string | null,
      suspended: false,
      instances: 1,
      gmails: 1,
      users: 2,
      professional: false,
    },
    {
      id: 8,
      nome: "Center Car Consórcios",
      email: "contato@centercar.com.br",
      trialEndsAt: future,
      paidUntil: "2027-01-01T00:00:00Z",
      suspended: false,
      instances: 3,
      gmails: 2,
      users: 5,
      professional: true,
    },
    {
      id: 9,
      nome: "Porto Seguro Parcerias",
      email: "operacoes@porto.com.br",
      trialEndsAt: future,
      paidUntil: null as string | null,
      suspended: false,
      instances: 2,
      gmails: 1,
      users: 4,
      professional: false,
    },
  ];

  const widgetInstallation = {
    accountId: 7,
    origin: "https://parceiro.aurora.com.br" as string | null,
    key: null as string | null,
  };

  const processes: Array<{
    id: number;
    contemplacaoId: number;
    responsavelId: number | null;
    status: string;
    criadoEm: string;
    atualizadoEm: string;
  }> = [
    {
      id: 1,
      contemplacaoId: 101,
      responsavelId: 1,
      status: "EM_COMUNICACAO",
      criadoEm: yesterdayIso,
      atualizadoEm: yesterdayIso,
    },
    {
      id: 2,
      contemplacaoId: 102,
      responsavelId: 1,
      status: "CLIENTE_CONTATADO",
      criadoEm: twoDaysAgoIso,
      atualizadoEm: yesterdayIso,
    },
    {
      id: 3,
      contemplacaoId: 103,
      responsavelId: 2,
      status: "EM_PROCESSO_DE_BAIXA",
      criadoEm: twoDaysAgoIso,
      atualizadoEm: nowIso,
    },
  ];

  const closures = new Map<
    number,
    {
      id: number;
      processoId: number;
      usuarioId: number;
      data: string;
      observacao: string | null;
    }
  >();

  const queueItems: Array<{
    processoId: number;
    origem: string;
    idExterno: string;
    statusProcesso: string;
    recebidaEm: string;
    comunicacao: {
      processoId: number;
      statusGeral: string;
      whatsapp: {
        id: number;
        destinatario: string | null;
        status: string;
        erro: string | null;
        criadaEm: string;
        enviadaEm: string | null;
      } | null;
      email: {
        id: number;
        destinatario: string | null;
        status: string;
        erro: string | null;
        criadaEm: string;
        enviadaEm: string | null;
      } | null;
    };
  }> = [
    {
      processoId: 1,
      origem: "SENAI-ERP",
      idExterno: "CONT-2026-001",
      statusProcesso: "EM_COMUNICACAO",
      recebidaEm: yesterdayIso,
      comunicacao: {
        processoId: 1,
        statusGeral: "COMUNICADO_PARCIAL",
        whatsapp: {
          id: 1,
          destinatario: "5511987654321",
          status: "SUCESSO",
          erro: null,
          criadaEm: yesterdayIso,
          enviadaEm: yesterdayIso,
        },
        email: {
          id: 2,
          destinatario: "marcos@email.com",
          status: "PENDENTE",
          erro: null,
          criadaEm: yesterdayIso,
          enviadaEm: null,
        },
      },
    },
    {
      processoId: 2,
      origem: "SENAI-ERP",
      idExterno: "CONT-2026-002",
      statusProcesso: "CLIENTE_CONTATADO",
      recebidaEm: twoDaysAgoIso,
      comunicacao: {
        processoId: 2,
        statusGeral: "COMUNICADO_NOS_DOIS",
        whatsapp: {
          id: 3,
          destinatario: "5511912345678",
          status: "SUCESSO",
          erro: null,
          criadaEm: twoDaysAgoIso,
          enviadaEm: twoDaysAgoIso,
        },
        email: {
          id: 4,
          destinatario: "juliana@email.com",
          status: "SUCESSO",
          erro: null,
          criadaEm: twoDaysAgoIso,
          enviadaEm: twoDaysAgoIso,
        },
      },
    },
    {
      processoId: 3,
      origem: "PORTAL-CORP",
      idExterno: "CONT-2026-003",
      statusProcesso: "EM_PROCESSO_DE_BAIXA",
      recebidaEm: nowIso,
      comunicacao: {
        processoId: 3,
        statusGeral: "PENDENTE",
        whatsapp: {
          id: 5,
          destinatario: "5515998876655",
          status: "PENDENTE",
          erro: null,
          criadaEm: nowIso,
          enviadaEm: null,
        },
        email: {
          id: 6,
          destinatario: "roberto@email.com",
          status: "PENDENTE",
          erro: null,
          criadaEm: nowIso,
          enviadaEm: null,
        },
      },
    },
  ];

  const historyByProcess = new Map<
    number,
    Array<{
      id: number;
      processoId: number;
      canal: string;
      destinatario: string | null;
      mensagem: string;
      observacao: string;
      usuarioNome: string;
      data: string;
      status: string;
      erro: string | null;
      criadaEm: string;
      enviadaEm: string | null;
    }>
  >([
    [
      1,
      [
        {
          id: 1,
          processoId: 1,
          canal: "WHATSAPP",
          destinatario: "5511987654321",
          mensagem:
            "Olá! Informamos que o seu processo #1 (CONT-2026-001) foi contemplado no ConsorTech.",
          observacao:
            "Olá! Informamos que o seu processo #1 (CONT-2026-001) foi contemplado no ConsorTech.",
          usuarioNome: "Administrador Geral",
          data: yesterdayIso,
          status: "SUCESSO",
          erro: null,
          criadaEm: yesterdayIso,
          enviadaEm: yesterdayIso,
        },
      ],
    ],
    [
      2,
      [
        {
          id: 2,
          processoId: 2,
          canal: "WHATSAPP",
          destinatario: "5511912345678",
          mensagem:
            "Olá! Informamos que o seu processo #2 (CONT-2026-002) foi contemplado no ConsorTech.",
          observacao:
            "Olá! Informamos que o seu processo #2 (CONT-2026-002) foi contemplado no ConsorTech.",
          usuarioNome: "Administrador Geral",
          data: twoDaysAgoIso,
          status: "SUCESSO",
          erro: null,
          criadaEm: twoDaysAgoIso,
          enviadaEm: twoDaysAgoIso,
        },
        {
          id: 3,
          processoId: 2,
          canal: "EMAIL",
          destinatario: "juliana@email.com",
          mensagem: "Comunicado oficial de contemplação #2.",
          observacao: "Comunicado oficial de contemplação #2.",
          usuarioNome: "Administrador Geral",
          data: twoDaysAgoIso,
          status: "SUCESSO",
          erro: null,
          criadaEm: twoDaysAgoIso,
          enviadaEm: twoDaysAgoIso,
        },
      ],
    ],
  ]);

  const registries: Record<string, Array<Record<string, any>>> = {
    usuarios: [
      {
        id: 1,
        nome: "Administrador Geral",
        email: "admin@consortech.com",
        tipo: "ADMINISTRADOR",
        ativo: true,
      },
      {
        id: 2,
        nome: "Operador de Atendimento",
        email: "funcionario@consortech.com",
        tipo: "FUNCIONARIO",
        ativo: true,
      },
      {
        id: 7,
        nome: "Marcos Oliveira",
        email: "marcos@email.com",
        tipo: "CLIENTE",
        ativo: true,
      },
      {
        id: 8,
        nome: "Juliana Santos",
        email: "juliana@email.com",
        tipo: "CLIENTE",
        ativo: true,
      },
      {
        id: 9,
        nome: "Roberto Almeida",
        email: "roberto@email.com",
        tipo: "CLIENTE",
        ativo: true,
      },
    ],
    "tipos-consorcio": [
      { id: 1, nome: "Imobiliário" },
      { id: 2, nome: "Automotivo" },
      { id: 3, nome: "Pesados e Frota" },
    ],
    consorcios: [
      {
        id: 1,
        nome: "Consórcio Imobiliário Premium",
        tipoId: 1,
        tipoNome: "Imobiliário",
      },
      {
        id: 2,
        nome: "Consórcio Automotivo Express",
        tipoId: 2,
        tipoNome: "Automotivo",
      },
    ],
    grupos: [
      {
        id: 1,
        numero: "1024",
        consorcioId: 1,
        consorcioNome: "Consórcio Imobiliário Premium",
        quantidadeCotas: 120,
        valorParcela: 1450.0,
      },
      {
        id: 2,
        numero: "2048",
        consorcioId: 2,
        consorcioNome: "Consórcio Automotivo Express",
        quantidadeCotas: 80,
        valorParcela: 890.0,
      },
    ],
    cotas: [
      {
        id: 1,
        numero: "045",
        grupoId: 1,
        grupoNúmero: "1024",
        valorCredito: 150000,
      },
      {
        id: 2,
        numero: "112",
        grupoId: 2,
        grupoNúmero: "2048",
        valorCredito: 65000,
      },
    ],
  };

  const auditLogs = [
    {
      id: 1,
      acao: "LOGIN",
      entidade: "Autenticacao",
      entidadeId: 1,
      usuarioId: 1,
      usuarioEmail: "admin@consortech.com",
      ip: "127.0.0.1",
      detalhes: "Sessão autenticada com sucesso.",
      data: nowIso,
    },
    {
      id: 2,
      acao: "CONTEMPLACAO_RECEBIDA",
      entidade: "ProcessoContemplacao",
      entidadeId: 1,
      usuarioId: 1,
      usuarioEmail: "admin@consortech.com",
      ip: "127.0.0.1",
      detalhes: "Processo #1 registrado via integração SENAI-ERP.",
      data: yesterdayIso,
    },
  ];

  let nextIdCounter = 200;

  return {
    name: "dev-mock-server",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api")) {
          return next();
        }

        const parsedUrl = new URL(url, "http://localhost");
        const pathname = parsedUrl.pathname;
        const searchParams = parsedUrl.searchParams;
        const method = (req.method || "GET").toUpperCase();

        const sendJson = (data: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };

        const sendNoContent = () => {
          res.statusCode = 204;
          res.end();
        };

        let body = "";
        req.on("data", (chunk: Buffer | string) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          let parsed: Record<string, any> = {};
          try {
            if (body) parsed = JSON.parse(body);
          } catch {
            // Ignore malformed JSON in mock
          }

          const authUser = parseAuthUser(req.headers.authorization);

          // 1. Auth Endpoints
          if (
            pathname === "/api/auth/login" ||
            pathname === "/api/auth/google" ||
            pathname === "/api/auth/google/register"
          ) {
            const rawEmail =
              typeof parsed.email === "string" && parsed.email.trim()
                ? parsed.email.trim()
                : "aurora@consortech.com";
            const lowerEmail = rawEmail.toLowerCase();
            const registeredUser = registries.usuarios.find(
              (u) => String(u.email).toLowerCase() === lowerEmail,
            );
            let tipo: MockRole = "CLIENTE";
            let uid = 7;
            if (
              registeredUser &&
              (registeredUser.tipo === "ADMINISTRADOR" ||
                registeredUser.tipo === "FUNCIONARIO" ||
                registeredUser.tipo === "CLIENTE")
            ) {
              tipo = registeredUser.tipo;
              uid = Number(registeredUser.id);
            } else if (lowerEmail.includes("admin")) {
              tipo = "ADMINISTRADOR";
              uid = 1;
            } else if (
              lowerEmail.includes("func") ||
              lowerEmail.includes("operador") ||
              lowerEmail.includes("atendente")
            ) {
              tipo = "FUNCIONARIO";
              uid = 2;
            }

            return sendJson({
              token: createMockJwt({ uid, email: rawEmail, tipo }),
              refreshToken: `mock-refresh-${tipo.toLowerCase()}-${uid}`,
              tipo,
              expiresIn: 86400,
              email: rawEmail,
            });
          }

          if (pathname === "/api/auth/register") {
            const newId = ++nextIdCounter;
            registries.usuarios.push({
              id: newId,
              nome: parsed.nome || "Novo Cliente",
              email: parsed.email || `cliente${newId}@consortech.com`,
              tipo: "CLIENTE",
              ativo: true,
            });
            return sendJson({ id: newId, tipo: "CLIENTE" }, 201);
          }

          if (pathname === "/api/auth/forgot-password") {
            return sendJson({
              message: "Código enviado para o seu e-mail.",
              expiresIn: 300,
            });
          }

          if (pathname === "/api/auth/reset-password") {
            return sendJson({ success: true });
          }

          if (pathname === "/api/auth/logout") {
            return sendNoContent();
          }

          if (pathname === "/api/auth/refresh") {
            const rt = String(parsed.refreshToken || "").toLowerCase();
            const tipo: MockRole = rt.includes("administrador")
              ? "ADMINISTRADOR"
              : rt.includes("funcionario")
                ? "FUNCIONARIO"
                : "CLIENTE";
            const uid =
              tipo === "ADMINISTRADOR" ? 1 : tipo === "FUNCIONARIO" ? 2 : 7;
            const email =
              tipo === "ADMINISTRADOR"
                ? "admin@consortech.com"
                : tipo === "FUNCIONARIO"
                  ? "funcionario@consortech.com"
                  : "aurora@consortech.com";
            return sendJson({
              token: createMockJwt({ uid, email, tipo }),
              refreshToken:
                parsed.refreshToken ||
                `mock-refresh-${tipo.toLowerCase()}-${uid}`,
              expiresIn: 86400,
              tipo,
              email,
            });
          }

          // 2. Platform Endpoints (/api/platform/*)
          if (pathname === "/api/platform/context") {
            if (authUser.tipo === "FUNCIONARIO") {
              return sendJson(
                {
                  message:
                    "Seu perfil não possui permissão para acessar esta área.",
                },
                403,
              );
            }
            const accountParam =
              searchParams.get("accountId") || searchParams.get("account");
            if (authUser.tipo === "ADMINISTRADOR") {
              if (!accountParam) {
                return sendJson(adminContext);
              }
              const targetClient =
                clients.find((c) => String(c.id) === accountParam) ||
                clients[0];
              return sendJson({
                ...clientContext,
                role: "ADMINISTRADOR",
                name: adminContext.name,
                email: adminContext.email,
                account: {
                  ...clientContext.account,
                  id: targetClient.id,
                  nome: targetClient.nome,
                  brandName:
                    targetClient.id === clientContext.account.id
                      ? clientContext.account.brandName
                      : targetClient.nome,
                  suspended: targetClient.suspended,
                  professional: targetClient.professional,
                  paidUntil: targetClient.paidUntil,
                },
              });
            }
            return sendJson(clientContext);
          }

          if (pathname === "/api/platform/operation-channels") {
            if (authUser.tipo !== "ADMINISTRADOR") {
              return sendJson(
                {
                  message:
                    "Seu perfil não possui permissão para acessar esta área.",
                },
                403,
              );
            }
            return sendJson(operationChannelsContext);
          }

          if (
            pathname === "/api/platform/operation-channels/test/whatsapp" &&
            method === "POST"
          ) {
            if (authUser.tipo !== "ADMINISTRADOR") {
              return sendJson(
                {
                  message:
                    "Seu perfil não possui permissão para acessar esta área.",
                },
                403,
              );
            }
            const senderId = Number(parsed.senderId);
            const sender = operationChannelsContext.instances.find(
              (item) => item.id === senderId,
            );
            if (!sender) {
              return sendJson(
                { message: "Remetente de WhatsApp não encontrado." },
                404,
              );
            }
            return sendJson({
              accepted: true,
              message: `Mensagem de teste enviada pelo WhatsApp (${sender.name}).`,
            });
          }

          if (
            pathname === "/api/platform/operation-channels/test/gmail" &&
            method === "POST"
          ) {
            if (authUser.tipo !== "ADMINISTRADOR") {
              return sendJson(
                {
                  message:
                    "Seu perfil não possui permissão para acessar esta área.",
                },
                403,
              );
            }
            const senderId = Number(parsed.senderId);
            const sender = operationChannelsContext.mailboxes.find(
              (item) => item.id === senderId,
            );
            if (!sender) {
              return sendJson(
                { message: "Remetente Gmail não encontrado." },
                404,
              );
            }
            return sendJson({
              accepted: true,
              message: `E-mail de teste enviado para ${String(parsed.recipient || "destinatário")} por ${sender.email}.`,
            });
          }

          if (pathname === "/api/platform/clients") {
            if (method === "POST") {
              const newClient = {
                id: ++nextIdCounter,
                nome: String(parsed.name || "Novo Cliente"),
                email: String(parsed.email || "novo@cliente.com"),
                trialEndsAt: future,
                paidUntil: null as string | null,
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

          const clientActiveMatch = pathname.match(
            /^\/api\/platform\/clients\/(\d+)\/active$/,
          );
          if (clientActiveMatch && method === "PUT") {
            const clientId = Number(clientActiveMatch[1]);
            const target = clients.find((c) => c.id === clientId);
            if (!target) {
              return sendJson({ message: "Cliente não encontrado." }, 404);
            }
            target.suspended = !parsed.active;
            if (clientContext.account.id === clientId) {
              clientContext.account.suspended = target.suspended;
            }
            return sendNoContent();
          }

          // Platform WhatsApp Instances
          const instanceActionMatch = pathname.match(
            /^\/api\/platform\/instances\/(\d+)\/(status|qr|disconnect)$/,
          );
          if (instanceActionMatch) {
            const instanceId = Number(instanceActionMatch[1]);
            const action = instanceActionMatch[2];
            const found =
              clientContext.instances.find((i) => i.id === instanceId) ||
              operationChannelsContext.instances.find(
                (i) => i.id === instanceId,
              );
            const instanceName = found?.name || "vendas";
            if (action === "status") {
              return sendJson({
                instanceName,
                state: "open",
                qrCode: null,
                pairingCode: null,
              });
            }
            if (action === "qr") {
              return sendJson({
                instanceName,
                state: "connecting",
                qrCode:
                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='white'/><rect x='20' y='20' width='50' height='50' fill='%2310213d'/><rect x='130' y='20' width='50' height='50' fill='%2310213d'/><rect x='20' y='130' width='50' height='50' fill='%2310213d'/><circle cx='100' cy='100' r='20' fill='%2335cda0'/></svg>",
                pairingCode: null,
              });
            }
            return sendNoContent();
          }

          const instanceItemMatch = pathname.match(
            /^\/api\/platform\/instances\/(\d+)$/,
          );
          if (instanceItemMatch && method === "DELETE") {
            const instanceId = Number(instanceItemMatch[1]);
            clientContext.instances = clientContext.instances.filter(
              (i) => i.id !== instanceId,
            );
            operationChannelsContext.instances =
              operationChannelsContext.instances.filter(
                (i) => i.id !== instanceId,
              );
            return sendNoContent();
          }

          if (pathname === "/api/platform/instances" && method === "POST") {
            const inst = {
              id: ++nextIdCounter,
              name: String(parsed.name || "suporte"),
            };
            if (
              authUser.tipo === "ADMINISTRADOR" &&
              !searchParams.get("accountId")
            ) {
              operationChannelsContext.instances.push(inst);
            } else {
              clientContext.instances.push(inst);
            }
            return sendJson(inst, 201);
          }

          // Platform Mailboxes
          const mailboxItemMatch = pathname.match(
            /^\/api\/platform\/mailboxes\/(\d+)$/,
          );
          if (mailboxItemMatch && method === "DELETE") {
            const mailboxId = Number(mailboxItemMatch[1]);
            clientContext.mailboxes = clientContext.mailboxes.filter(
              (m) => m.id !== mailboxId,
            );
            operationChannelsContext.mailboxes =
              operationChannelsContext.mailboxes.filter(
                (m) => m.id !== mailboxId,
              );
            return sendNoContent();
          }

          if (pathname === "/api/platform/mailboxes" && method === "POST") {
            const box = {
              id: ++nextIdCounter,
              name: String(parsed.name || "Atendimento"),
              email: String(parsed.email || "contato@aurora.com.br"),
              verified: true,
            };
            if (
              authUser.tipo === "ADMINISTRADOR" &&
              !searchParams.get("accountId")
            ) {
              operationChannelsContext.mailboxes.push(box);
            } else {
              clientContext.mailboxes.push(box);
            }
            return sendJson(box, 201);
          }

          // Platform Brand
          if (pathname === "/api/platform/brand") {
            if (method === "PUT" || method === "POST") {
              if (typeof parsed.name === "string" && parsed.name.trim()) {
                clientContext.account.brandName = parsed.name.trim();
              }
              if (typeof parsed.logo === "string") {
                clientContext.account.logo = parsed.logo;
              }
              if (typeof parsed.primary === "string" && parsed.primary) {
                clientContext.account.primaryColor = parsed.primary;
              }
              if (typeof parsed.accent === "string" && parsed.accent) {
                clientContext.account.accentColor = parsed.accent;
              }
              return sendNoContent();
            }
            return sendJson(clientContext.account);
          }

          // Platform Team Users
          const teamUserActiveMatch = pathname.match(
            /^\/api\/platform\/users\/(\d+)\/active$/,
          );
          if (teamUserActiveMatch && method === "PUT") {
            const userId = Number(teamUserActiveMatch[1]);
            const target = clientContext.users.find((u) => u.id === userId);
            if (target) target.active = Boolean(parsed.active);
            return sendNoContent();
          }

          const teamUserItemMatch = pathname.match(
            /^\/api\/platform\/users\/(\d+)$/,
          );
          if (teamUserItemMatch && method === "DELETE") {
            const userId = Number(teamUserItemMatch[1]);
            clientContext.users = clientContext.users.filter(
              (u) => u.id !== userId,
            );
            return sendNoContent();
          }

          if (pathname === "/api/platform/users" && method === "POST") {
            const usr = {
              id: ++nextIdCounter,
              name: String(parsed.name || "Novo Usuário"),
              email: String(parsed.email || "novo@aurora.com.br"),
              active: true,
            };
            clientContext.users.push(usr);
            return sendJson(usr, 201);
          }

          // Platform Profile
          if (pathname === "/api/platform/profile" && method === "PUT") {
            if (typeof parsed.name === "string" && parsed.name.trim()) {
              if (authUser.tipo === "ADMINISTRADOR") {
                adminContext.name = parsed.name.trim();
              } else {
                clientContext.name = parsed.name.trim();
              }
            }
            if (typeof parsed.photo === "string") {
              if (authUser.tipo === "ADMINISTRADOR") {
                adminContext.photo = parsed.photo || null;
              } else {
                clientContext.photo = parsed.photo || null;
              }
            }
            return sendNoContent();
          }

          // Platform Partner Widget
          if (pathname === "/api/platform/widget") {
            if (method === "GET") {
              return sendJson({
                accountId: widgetInstallation.accountId,
                origin: widgetInstallation.origin,
                key: null,
              });
            }
            if (method === "PUT") {
              widgetInstallation.origin =
                typeof parsed.origin === "string" && parsed.origin.trim()
                  ? parsed.origin.trim()
                  : null;
              widgetInstallation.key = `ctw_live_${Date.now().toString(36)}`;
              return sendJson({
                accountId: widgetInstallation.accountId,
                origin: widgetInstallation.origin,
                key: widgetInstallation.key,
              });
            }
            if (method === "DELETE") {
              widgetInstallation.origin = null;
              widgetInstallation.key = null;
              return sendNoContent();
            }
          }

          if (pathname === "/api/widget/chat" && method === "POST") {
            return sendJson({
              empresa: clientContext.account.brandName,
              total: 14,
              aceitas: 11,
              pendentes: 2,
              falhas: 1,
            });
          }

          // Platform Subscription & Checkout
          if (
            pathname.startsWith("/api/platform/subscription/checkout/") &&
            pathname.endsWith("/confirm") &&
            method === "POST"
          ) {
            clientContext.subscription.tier = "PRO";
            clientContext.subscription.whatsappLimit = 3;
            clientContext.subscription.gmailLimit = 2;
            clientContext.account.professional = true;
            clientContext.account.paidUntil = future;
            return sendJson({
              id: "order-demo-123",
              paymentMethod: "CARD",
              status: "PAID",
              amountCents: 9990,
              currency: "BRL",
              expiresAt: future,
              paidAt: new Date().toISOString(),
              simulation: true,
              pixCode: null,
            });
          }

          if (
            pathname === "/api/platform/subscription/checkout" &&
            method === "POST"
          ) {
            return sendJson(
              {
                id: "order-demo-123",
                paymentMethod: parsed.paymentMethod || "PIX",
                status: "PENDING",
                amountCents: 9990,
                currency: "BRL",
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                paidAt: null,
                simulation: true,
                pixCode:
                  "00020126580014br.gov.bcb.pix0136consortech-demo-simulacao520400005303986540599.905802BR5910CONSORTECH6009SAO PAULO62070503***6304ABCD",
              },
              201,
            );
          }

          // 3. Integrations & Queue Endpoints
          if (pathname === "/api/integracoes/comunicacoes/fila/resumo") {
            const pendentes = queueItems.filter(item => item.comunicacao.statusGeral === "PENDENTE").length;
            const comFalha = queueItems.filter(item => item.comunicacao.email?.status === "FALHA"
              || item.comunicacao.whatsapp?.status === "FALHA").length;
            return sendJson({ total: queueItems.length, pendentes, comunicados: queueItems.length - pendentes, comFalha });
          }

          if (pathname === "/api/integracoes/comunicacoes/remetentes-whatsapp") {
            return sendJson([]);
          }

          if (pathname === "/api/integracoes/comunicacoes/fila") {
            return sendJson(queueItems);
          }

          if (pathname === "/api/integracoes/comunicacoes/fila/pagina") {
            const q = (searchParams.get("q") || "").trim().toLowerCase();
            const status = (searchParams.get("status") || "").trim();
            const filtered = queueItems.filter((item) => {
              const matchesStatus =
                !status || item.comunicacao.statusGeral === status;
              const matchesQuery =
                !q ||
                String(item.processoId).includes(q) ||
                item.idExterno.toLowerCase().includes(q) ||
                item.origem.toLowerCase().includes(q) ||
                (item.comunicacao.email?.destinatario || "")
                  .toLowerCase()
                  .includes(q) ||
                (item.comunicacao.whatsapp?.destinatario || "")
                  .toLowerCase()
                  .includes(q);
              return matchesStatus && matchesQuery;
            });
            return sendJson({
              items: filtered,
              total: filtered.length,
              totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
              page: Number(searchParams.get("page") || 0),
              size: 20,
            });
          }

          if (
            pathname === "/api/integracoes/contemplacoes" &&
            method === "POST"
          ) {
            const newProcId = ++nextIdCounter;
            const newContId = ++nextIdCounter;
            const createdNow = new Date().toISOString();
            const comm = {
              processoId: newProcId,
              statusGeral: "PENDENTE",
              whatsapp: parsed.telefone
                ? {
                    id: ++nextIdCounter,
                    destinatario: String(parsed.telefone),
                    status: "PENDENTE",
                    erro: null,
                    criadaEm: createdNow,
                    enviadaEm: null,
                  }
                : null,
              email: {
                id: ++nextIdCounter,
                destinatario: String(parsed.email || "cliente@email.com"),
                status: "PENDENTE",
                erro: null,
                criadaEm: createdNow,
                enviadaEm: null,
              },
            };
            processes.unshift({
              id: newProcId,
              contemplacaoId: newContId,
              responsavelId: authUser.uid,
              status: "AGUARDANDO_COMUNICACAO",
              criadoEm: createdNow,
              atualizadoEm: createdNow,
            });
            queueItems.unshift({
              processoId: newProcId,
              origem: String(parsed.origem || "INTEGRACAO"),
              idExterno: String(parsed.idExterno || `EXT-${newProcId}`),
              statusProcesso: "AGUARDANDO_COMUNICACAO",
              recebidaEm: createdNow,
              comunicacao: comm,
            });
            return sendJson(
              {
                processoId: newProcId,
                contemplacaoId: newContId,
                statusProcesso: "AGUARDANDO_COMUNICACAO",
                duplicada: false,
                comunicacao: comm,
              },
              201,
            );
          }

          const processCommMatch = pathname.match(
            /^\/api\/integracoes\/processos\/(\d+)\/comunicacao$/,
          );
          if (processCommMatch && method === "GET") {
            const procId = Number(processCommMatch[1]);
            const queueItem = queueItems.find((i) => i.processoId === procId);
            if (!queueItem) {
              return sendJson(
                { message: "Processo não encontrado na fila de comunicação." },
                404,
              );
            }
            return sendJson(queueItem.comunicacao);
          }

          const processResendMatch = pathname.match(
            /^\/api\/integracoes\/processos\/(\d+)\/comunicacao\/reenvio$/,
          );
          if (processResendMatch && method === "POST") {
            const procId = Number(processResendMatch[1]);
            const queueItem = queueItems.find((i) => i.processoId === procId);
            if (!queueItem) {
              return sendJson(
                { message: "Processo não encontrado para reenvio." },
                404,
              );
            }
            const sentAt = new Date().toISOString();
            if (queueItem.comunicacao.whatsapp) {
              queueItem.comunicacao.whatsapp.status = "SUCESSO";
              queueItem.comunicacao.whatsapp.erro = null;
              queueItem.comunicacao.whatsapp.enviadaEm = sentAt;
            }
            if (queueItem.comunicacao.email) {
              queueItem.comunicacao.email.status = "SUCESSO";
              queueItem.comunicacao.email.erro = null;
              queueItem.comunicacao.email.enviadaEm = sentAt;
            }
            queueItem.comunicacao.statusGeral = "COMUNICADO_NOS_DOIS";
            const list = historyByProcess.get(procId) || [];
            list.unshift({
              id: ++nextIdCounter,
              processoId: procId,
              canal: "EMAIL",
              destinatario:
                queueItem.comunicacao.email?.destinatario ||
                "cliente@email.com",
              mensagem: `Reenvio oficial de comunicado para o processo #${procId}.`,
              observacao: `Reenvio oficial de comunicado para o processo #${procId}.`,
              usuarioNome:
                authUser.tipo === "ADMINISTRADOR"
                  ? "Administrador Geral"
                  : "Operador de Atendimento",
              data: sentAt,
              status: "SUCESSO",
              erro: null,
              criadaEm: sentAt,
              enviadaEm: sentAt,
            });
            historyByProcess.set(procId, list);
            return sendJson(queueItem.comunicacao);
          }

          const processWhatsappMatch = pathname.match(
            /^\/api\/integracoes\/processos\/(\d+)\/comunicacao\/whatsapp$/,
          );
          if (processWhatsappMatch && method === "POST") {
            const procId = Number(processWhatsappMatch[1]);
            const queueItem = queueItems.find((i) => i.processoId === procId);
            if (!queueItem) {
              return sendJson(
                { message: "Processo não encontrado para envio de WhatsApp." },
                404,
              );
            }
            const sentAt = new Date().toISOString();
            const phone = String(
              parsed.telefone ||
                queueItem.comunicacao.whatsapp?.destinatario ||
                "5511999999999",
            );
            queueItem.comunicacao.whatsapp = {
              id: queueItem.comunicacao.whatsapp?.id || ++nextIdCounter,
              destinatario: phone,
              status: "SUCESSO",
              erro: null,
              criadaEm: sentAt,
              enviadaEm: sentAt,
            };
            queueItem.comunicacao.statusGeral =
              queueItem.comunicacao.email?.status === "SUCESSO"
                ? "COMUNICADO_NOS_DOIS"
                : "COMUNICADO_PARCIAL";
            const list = historyByProcess.get(procId) || [];
            const msgText = String(
              parsed.mensagem || `Mensagem manual para o processo #${procId}.`,
            );
            list.unshift({
              id: ++nextIdCounter,
              processoId: procId,
              canal: "WHATSAPP",
              destinatario: phone,
              mensagem: msgText,
              observacao: msgText,
              usuarioNome:
                authUser.tipo === "ADMINISTRADOR"
                  ? "Administrador Geral"
                  : "Operador de Atendimento",
              data: sentAt,
              status: "SUCESSO",
              erro: null,
              criadaEm: sentAt,
              enviadaEm: sentAt,
            });
            historyByProcess.set(procId, list);
            return sendJson(queueItem.comunicacao);
          }

          const processHistoryMatch = pathname.match(
            /^\/api\/integracoes\/processos\/(\d+)\/comunicacoes\/historico$/,
          );
          if (processHistoryMatch && method === "GET") {
            const procId = Number(processHistoryMatch[1]);
            const items = historyByProcess.get(procId) || [];
            const page = Number(searchParams.get("page") ?? 0);
            const size = Number(searchParams.get("size") ?? 20);
            return sendJson({ items: items.slice(page * size, (page + 1) * size), total: items.length, page, size });
          }

          if (
            pathname === "/api/integracoes/comunicacoes/historico" &&
            method === "GET"
          ) {
            const start = searchParams.get("inicio") ?? "";
            const end = searchParams.get("fim") ?? "";
            const items = Array.from(historyByProcess.values()).flat().filter(item => {
              const date = item.criadaEm.slice(0, 10);
              return date >= start && date <= end;
            });
            const accepted = items.filter(item => ["SUCESSO", "REALIZADA"].includes(item.status)).length;
            const failed = items.filter(item => item.status === "FALHA").length;
            return sendJson({ total: items.length, accepted, failed, pending: items.length - accepted - failed });
          }

          const processClosureMatch = pathname.match(
            /^\/api\/integracoes\/processos\/(\d+)\/baixa$/,
          );
          if (processClosureMatch) {
            const procId = Number(processClosureMatch[1]);
            const proc = processes.find((p) => p.id === procId);
            if (!proc) {
              return sendJson({ message: "Processo não encontrado." }, 404);
            }
            if (method === "GET") {
              const existing = closures.get(procId);
              if (!existing) {
                return sendJson(
                  { message: "Baixa ainda não registrada para este processo." },
                  404,
                );
              }
              return sendJson(existing);
            }
            if (method === "POST") {
              const record = {
                id: ++nextIdCounter,
                processoId: procId,
                usuarioId: Number(parsed.usuarioId || authUser.uid || 1),
                data: new Date().toISOString(),
                observacao: parsed.observacao ? String(parsed.observacao) : null,
              };
              closures.set(procId, record);
              proc.status = "FINALIZADO";
              proc.atualizadoEm = record.data;
              const queueItem = queueItems.find((i) => i.processoId === procId);
              if (queueItem) queueItem.statusProcesso = "FINALIZADO";
              return sendJson(record, 201);
            }
          }

          // 4. Processes Endpoints (/api/processos-contemplacao/*)
          if (
            pathname === "/api/processos-contemplacao/pagina" &&
            method === "GET"
          ) {
            const status = (searchParams.get("status") || "").trim();
            const q = (searchParams.get("q") || "").trim().toLowerCase();
            const filtered = processes.filter((p) => {
              const matchesStatus = !status || p.status === status;
              const matchesQuery =
                !q ||
                String(p.id).includes(q) ||
                String(p.contemplacaoId).includes(q) ||
                p.status.toLowerCase().includes(q);
              return matchesStatus && matchesQuery;
            });
            return sendJson({
              items: filtered,
              total: filtered.length,
              totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
              page: Number(searchParams.get("page") || 0),
              size: 20,
            });
          }

          const processStatusMatch = pathname.match(
            /^\/api\/processos-contemplacao\/(\d+)\/status$/,
          );
          if (processStatusMatch && method === "PATCH") {
            const procId = Number(processStatusMatch[1]);
            const proc = processes.find((p) => p.id === procId);
            if (!proc) {
              return sendJson({ message: "Processo não encontrado." }, 404);
            }
            if (typeof parsed.status === "string" && parsed.status) {
              proc.status = parsed.status;
              proc.atualizadoEm = new Date().toISOString();
              const queueItem = queueItems.find((i) => i.processoId === procId);
              if (queueItem) queueItem.statusProcesso = parsed.status;
            }
            return sendJson(proc);
          }

          const processByIdMatch = pathname.match(
            /^\/api\/processos-contemplacao\/(\d+)$/,
          );
          if (processByIdMatch && method === "GET") {
            const procId = Number(processByIdMatch[1]);
            const proc = processes.find((p) => p.id === procId);
            if (!proc) {
              return sendJson({ message: "Processo não encontrado." }, 404);
            }
            return sendJson(proc);
          }

          // 5. Assistant Endpoints (/api/assistente/*)
          if (pathname === "/api/assistente/mensagens" && method === "POST") {
            const question = String(parsed.mensagem || "").trim();
            const procMatch = question.match(/(\d+)/);
            const targetProcId = procMatch ? Number(procMatch[1]) : 1;
            const proc =
              processes.find((p) => p.id === targetProcId) || processes[0];
            return sendJson({
              mensagem: `Consultei o processo #${proc.id} (contemplação #${proc.contemplacaoId}). O status atual é ${proc.status}. Se desejar, você pode confirmar o disparo rápido abaixo.`,
              acao: {
                token: `mock-action-${proc.id}`,
                processoId: proc.id,
                telefone: "5511987654321",
                mensagem: `Olá! Atualização sobre o processo contemplado #${proc.id}.`,
              },
            });
          }

          if (
            pathname === "/api/assistente/acoes/confirmar" &&
            method === "POST"
          ) {
            return sendJson({
              processoId: 1,
              statusGeral: "COMUNICADO_PARCIAL",
              email: queueItems[0].comunicacao.email,
              whatsapp: queueItems[0].comunicacao.whatsapp,
            });
          }

          // 6. Audit Endpoint (/api/auditoria/pagina)
          if (pathname === "/api/auditoria/pagina" && method === "GET") {
            const acao = (searchParams.get("acao") || "").trim();
            const q = (searchParams.get("q") || "").trim().toLowerCase();
            const filtered = auditLogs.filter((log) => {
              const matchesAcao = !acao || log.acao === acao;
              const matchesQ =
                !q ||
                log.acao.toLowerCase().includes(q) ||
                (log.usuarioEmail || "").toLowerCase().includes(q) ||
                (log.detalhes || "").toLowerCase().includes(q);
              return matchesAcao && matchesQ;
            });
            return sendJson({
              items: filtered,
              total: filtered.length,
              totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
              page: Number(searchParams.get("page") || 0),
              size: 20,
            });
          }

          // 7. Beneficiary Portal Endpoints (/api/portal/*)
          if (pathname === "/api/portal/processos" && method === "GET") {
            return sendJson({
              items: processes,
              total: processes.length,
              totalPages: 1,
              page: 0,
              size: 20,
            });
          }

          const portalDetailMatch = pathname.match(
            /^\/api\/portal\/processos\/(\d+)$/,
          );
          if (portalDetailMatch && method === "GET") {
            const procId = Number(portalDetailMatch[1]);
            const proc =
              processes.find((p) => p.id === procId) || processes[0];
            return sendJson({
              processo: proc,
              responsavel: "Equipe ConsorTech",
              cota: "Grupo 1024 · Cota 045",
              valorCredito: 150000,
              documentos: [
                {
                  id: 1,
                  tipo: "DOCUMENTO_IDENTIFICACAO",
                  status: "APROVADO",
                  nomeArquivo: "rg-frente-verso.pdf",
                  observacao: "Documento conferido pela operação.",
                  dataUpload: yesterdayIso,
                },
              ],
              historico: [
                {
                  id: 1,
                  statusAnterior: "CONTEMPLADO",
                  novoStatus: proc.status,
                  data: proc.atualizadoEm,
                  observacao: "Movimentação registrada pela operação.",
                },
              ],
            });
          }

          // 8. Clients & Registries CRUD (/api/clientes, /api/usuarios, /api/consorcios, /api/grupos, /api/cotas, /api/tipos-consorcio)
          if (pathname === "/api/clientes/pagina" && method === "GET") {
            const q = (searchParams.get("q") || "").trim().toLowerCase();
            const items = registries.usuarios.filter(
              (u) =>
                u.tipo === "CLIENTE" &&
                (!q ||
                  String(u.nome).toLowerCase().includes(q) ||
                  String(u.email).toLowerCase().includes(q)),
            );
            return sendJson({
              items,
              total: items.length,
              totalPages: Math.max(1, Math.ceil(items.length / 20)),
              page: Number(searchParams.get("page") || 0),
              size: 20,
            });
          }

          const userPasswordMatch = pathname.match(
            /^\/api\/usuarios\/(\d+)\/senha$/,
          );
          if (userPasswordMatch && method === "PATCH") {
            return sendNoContent();
          }

          const registryPageMatch = pathname.match(
            /^\/api\/(usuarios|consorcios|grupos|cotas|tipos-consorcio)\/pagina$/,
          );
          if (registryPageMatch && method === "GET") {
            const resource = registryPageMatch[1];
            const q = (searchParams.get("q") || "").trim().toLowerCase();
            const collection = registries[resource] || [];
            const filtered = collection.filter((row) =>
              !q
                ? true
                : Object.values(row).some((val) =>
                    String(val ?? "")
                      .toLowerCase()
                      .includes(q),
                  ),
            );
            return sendJson({
              items: filtered,
              total: filtered.length,
              totalPages: Math.max(1, Math.ceil(filtered.length / 20)),
              page: Number(searchParams.get("page") || 0),
              size: 20,
            });
          }

          const registryItemMatch = pathname.match(
            /^\/api\/(usuarios|consorcios|grupos|cotas|tipos-consorcio)\/(\d+)$/,
          );
          if (registryItemMatch) {
            const resource = registryItemMatch[1];
            const itemId = Number(registryItemMatch[2]);
            const collection = registries[resource] || [];
            const index = collection.findIndex((row) => row.id === itemId);
            if (index === -1) {
              return sendJson({ message: "Registro não encontrado." }, 404);
            }
            if (method === "GET") {
              return sendJson(collection[index]);
            }
            if (method === "PUT") {
              const updated = {
                ...collection[index],
                ...parsed,
                id: itemId,
              };
              collection[index] = updated;
              return sendJson(updated);
            }
            if (method === "DELETE") {
              collection.splice(index, 1);
              return sendNoContent();
            }
          }

          const registryRootMatch = pathname.match(
            /^\/api\/(usuarios|consorcios|grupos|cotas|tipos-consorcio)$/,
          );
          if (registryRootMatch && method === "POST") {
            const resource = registryRootMatch[1];
            const collection = registries[resource] || [];
            const created: Record<string, any> = {
              id: ++nextIdCounter,
              ...parsed,
            };
            if (resource === "usuarios" && created.ativo === undefined) {
              created.ativo = true;
            }
            if (resource === "consorcios" && created.tipoId) {
              const tipo = registries["tipos-consorcio"].find(
                (t) => t.id === Number(created.tipoId),
              );
              if (tipo) created.tipoNome = tipo.nome;
            }
            if (resource === "grupos" && created.consorcioId) {
              const cons = registries.consorcios.find(
                (c) => c.id === Number(created.consorcioId),
              );
              if (cons) created.consorcioNome = cons.nome;
            }
            if (resource === "cotas" && created.grupoId) {
              const grp = registries.grupos.find(
                (g) => g.id === Number(created.grupoId),
              );
              if (grp) created.grupoNúmero = grp.numero;
            }
            delete created.senha;
            collection.push(created);
            return sendJson(created, 201);
          }

          return sendJson(
            {
              message:
                "O registro ou recurso solicitado não foi encontrado no servidor mock.",
            },
            404,
          );
        });
      });
    },
  };
}
