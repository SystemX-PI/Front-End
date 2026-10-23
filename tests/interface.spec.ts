import { test, expect, type Page } from "@playwright/test";

test("tema escuro cobre as telas e a preferência permanece após recarregar", async ({
  page,
}) => {
  test.setTimeout(60000);
  await session(page);
  await page.goto("/register");
  await page.getByRole("button", { name: "Tema escuro", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Tema escuro", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const path of [
    "/login",
    "/register",
    "/admin/dashboard",
    "/admin/clientes",
    "/admin/usuarios",
    "/admin/contemplados",
    "/admin/auditoria",
    "/integracoes",
    "/integracoes/gmail",
    "/integracoes/whatsapp",
    "/integracoes/notificacoes",
  ]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    if (await page.locator(".panel").count())
      expect(
        await page
          .locator(".panel")
          .first()
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      ).not.toBe("rgb(255, 255, 255)");
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/register");
    await page.screenshot({
      path: `test-results/cadastro-dark-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.getByRole("button", { name: "Tema claro", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/cadastro-light.png",
    fullPage: true,
  });
});

test("cadastro valida confirmação e envia somente o DTO de funcionário", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Nome completo", { exact: true }).fill("Maria Teste");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await page.getByPlaceholder("Mínimo 6 caracteres").fill("senha-teste-123");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("outra-senha");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "As senhas não coincidem",
  );
  let body: unknown;
  await page.route("**/api/usuarios", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        id: 21,
        nome: "Maria Teste",
        email: "maria@example.com",
        tipo: "FUNCIONARIO",
        ativo: true,
      },
    });
  });
  await page
    .getByLabel("Confirmar senha", { exact: true })
    .fill("senha-teste-123");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(body).toEqual({
    nome: "Maria Teste",
    email: "maria@example.com",
    senha: "senha-teste-123",
    tipo: "FUNCIONARIO",
  });
  await expect(
    page.getByText("Conta criada. Entre com seu e-mail e senha."),
  ).toBeVisible();
});

const users = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  nome: `Pessoa ${index + 1}`,
  email: `pessoa${index + 1}@example.com`,
  ativo: index % 3 !== 0,
  tipo: index < 10 ? "CLIENTE" : "FUNCIONARIO",
}));
const communication = {
  processoId: 1,
  statusGeral: "PENDENTE",
  email: {
    id: 1,
    destinatario: "cliente@example.com",
    status: "FALHA",
    erro: "Credenciais do Gmail recusadas.",
    criadaEm: "2026-10-23T12:00:00",
    enviadaEm: null,
  },
  whatsapp: null,
};
const queue = [
  {
    processoId: 1,
    idExterno: "CONT-TESTE",
    origem: "parceiro",
    statusProcesso: "AGUARDANDO_COMUNICACAO",
    recebidaEm: "2026-10-23T12:00:00",
    comunicacao: communication,
  },
];

async function session(page: Page, tipo = "ADMINISTRADOR") {
  await page.addInitScript((role) => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("userType", role);
    localStorage.setItem("userEmail", "gestor@example.com");
  }, tipo);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data =
      path === "/api/usuarios"
        ? users
        : path.endsWith("/fila")
          ? queue
          : path.endsWith("/reenvio") || path.endsWith("/comunicacao")
            ? communication
            : path.startsWith("/api/processos-contemplacao/")
              ? {
                  id: 1,
                  contemplacaoId: 1,
                  responsavelId: 1,
                  status: "AGUARDANDO_COMUNICACAO",
                  criadoEm: "2026-10-23T12:00:00",
                  atualizadoEm: "2026-10-23T12:00:00",
                }
              : {};
    await route.fulfill({ json: data });
  });
});

test("todas as telas renderizam em desktop e mobile sem erros nem vazamento horizontal", async ({
  page,
}) => {
  await session(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const path of [
      "/admin/dashboard",
      "/admin/clientes",
      "/admin/usuarios",
      "/admin/contemplados",
      "/admin/auditoria",
      "/integracoes",
      "/integracoes/gmail",
      "/integracoes/whatsapp",
      "/integracoes/notificacoes",
      "/login",
      "/register",
    ]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.getByText("Carregando dados", { exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        path + " at " + width,
      ).toBeTruthy();
      if (
        path === "/admin/dashboard" ||
        path === "/login" ||
        path === "/integracoes/notificacoes"
      )
        await page.screenshot({
          path: `test-results/${path.split("/").pop()}-${width}.png`,
          fullPage: true,
        });
    }
  }
  expect(errors).toEqual([]);
});

test("clientes e usuários têm busca e paginação real", async ({ page }) => {
  await session(page);
  await page.goto("/admin/clientes");
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("button", { name: "Próxima página" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("textbox", { name: "Buscar clientes" })
    .fill("pessoa1@example.com");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.goto("/admin/usuarios");
  await page
    .getByRole("textbox", { name: "Buscar usuários" })
    .fill("sem-resultado");
  await expect(
    page.getByRole("heading", { name: "Nenhum usuário encontrado" }),
  ).toBeVisible();
});

test("contemplação envia números, data ISO e telefone sem máscara", async ({
  page,
}) => {
  await session(page);
  await page.goto("/integracoes/notificacoes");
  await page.getByLabel("Origem", { exact: true }).fill(" parceiro ");
  await page.getByLabel("ID externo", { exact: true }).fill("CONT-123");
  await page
    .getByLabel("Nome do contemplado", { exact: true })
    .fill("Maria da Silva");
  await page.getByLabel("E-mail do contemplado").fill("maria@example.com");
  await page.getByLabel("Telefone", { exact: true }).fill("5511999999999");
  await page.getByLabel("ID da cota").fill("1");
  await page.getByLabel("ID da assembleia").fill("2");
  await page.getByLabel("Data da contemplação").fill("2026-10-23");
  await page.getByLabel("Valor do crédito").fill("50000.15");
  await page.getByLabel("Chave de integração").fill("test-key");
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/integracoes/contemplacoes", async (route) => {
    body = route.request().postDataJSON();
    expect(route.request().headers()["x-integration-key"]).toBe("test-key");
    await route.fulfill({
      status: 201,
      json: {
        processoId: 2,
        origem: "parceiro",
        idExterno: "CONT-123",
        statusProcesso: "AGUARDANDO_COMUNICACAO",
        statusComunicacao: "PENDENTE",
        jaExistia: false,
      },
    });
  });
  await page.getByRole("button", { name: "Adicionar à fila" }).click();
  await expect(
    page.getByText("Contemplação recebida e adicionada à fila.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(body).toMatchObject({
    origem: "parceiro",
    cotaId: 1,
    assembleiaId: 2,
    valorCredito: 50000.15,
    telefone: "5511999999999",
    dataContemplacao: "2026-10-23",
    tipo: "SORTEIO",
  });
});

test("fila mostra erro real do canal e permite envio explícito", async ({
  page,
}) => {
  await session(page);
  await page.goto("/integracoes/notificacoes");
  await expect(
    page.getByText("Credenciais do Gmail recusadas.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Notificar", exact: true }).click();
  await expect(page.locator(".toast-error")).toContainText(
    "Credenciais do Gmail recusadas.",
  );
});

test("erros HTTP 400, 403, 404 e 500 têm feedback e retentativa", async ({
  page,
}) => {
  await session(page);
  for (const status of [400, 403, 404, 500]) {
    await page.route("**/api/usuarios", (route) =>
      route.fulfill({
        status,
        json: {
          message:
            status === 500
              ? "detalhe interno que não deve aparecer"
              : `Falha controlada ${status}`,
        },
      }),
    );
    await page.goto("/admin/clientes");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tentar novamente" }),
    ).toBeVisible();
    if (status === 500)
      await expect(page.getByRole("alert")).not.toContainText(
        "detalhe interno",
      );
  }
});

test("401 encerra sessão e volta para o login", async ({ page }) => {
  await session(page);
  await page.route("**/api/usuarios", (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.goto("/admin/clientes");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Sua sessão expirou. Entre novamente."),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
});

test("Gmail usa contrato correto sem persistir senha", async ({ page }) => {
  await session(page);
  await page.goto("/integracoes/gmail");
  let body: unknown;
  await page.route("**/api/configuracoes/email", async (route) => {
    expect(route.request().method()).toBe("PUT");
    body = route.request().postDataJSON();
    await route.fulfill({
      json: { configurado: true, email: "remetente@example.com" },
    });
  });
  await page.getByLabel("E-mail do remetente").fill("remetente@example.com");
  await page
    .getByLabel("Senha de aplicativo", { exact: true })
    .fill("abcd efgh ijkl mnop");
  await page.getByRole("button", { name: "Salvar configuração" }).click();
  await expect(page.getByText("Configurado nesta sessão")).toBeVisible();
  expect(body).toEqual({
    email: "remetente@example.com",
    senhaAplicativo: "abcdefghijklmnop",
  });
  await expect(
    page.getByLabel("Senha de aplicativo", { exact: true }),
  ).toHaveValue("");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "abcdefghijklmnop",
  );
});

test("WhatsApp consulta status real e não exibe QR ilustrativo", async ({
  page,
}) => {
  await session(page);
  await page.goto("/integracoes/whatsapp");
  await expect(page.getByRole("img", { name: /QR Code/ })).toHaveCount(0);
  await page.route("**/api/integracoes/whatsapp/status?*", (route) =>
    route.fulfill({
      json: {
        instanceName: "consorcio",
        state: "open",
        code: null,
        qrCode: null,
        pairingCode: null,
      },
    }),
  );
  await page.getByRole("button", { name: "Consultar status" }).click();
  await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
});

test("portal respeita o perfil Cliente e protege a administração", async ({
  page,
}) => {
  await session(page, "CLIENTE");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("tab", { name: "Meu processo" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Documentos" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Documentos" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/portal-desktop.png",
    fullPage: true,
  });
});
