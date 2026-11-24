import { test, expect, type Page } from "@playwright/test";

const endpoint = "/api/processos-contemplacao";
const receipt = (id: number) => `/api/integracoes/processos/${id}/baixa`;
const fixture = {
  owner: "titular-a@example.test", other: "titular-b@example.test", member: "equipe-a@example.test",
  operator: "operador-a@example.test", admin: "admin-e2e@example.test", beneficiary: "beneficiario-a@example.test",
};

async function login(page: Page, account: keyof typeof fixture, destination: RegExp) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(fixture[account]);
  await page.getByLabel("Senha", { exact: true }).fill(process.env.SYSTEMX_E2E_PASSWORD!);
  const response = page.waitForResponse(res => res.url().endsWith("/api/auth/login"));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL(destination);
}

async function auth(page: Page) {
  return { Authorization: "Bearer " + await page.evaluate(() => localStorage.getItem("token")) };
}

test("titular, equipe, administrador e beneficiário mantêm papéis e escopos", async ({ page, request }) => {
  await login(page, "owner", /\/app$/);
  await page.goto("/app/equipe");
  await expect(page.getByRole("button", { name: "Adicionar usuário" })).toBeVisible();
  await expect(page.locator(".team-list").getByText("Equipe A", { exact: true })).toBeVisible();
  const scope = await request.get("/api/platform/context", { headers: await auth(page) });
  expect(scope.status()).toBe(200);
  expect(await scope.json()).toMatchObject({ role: "CLIENTE", account: { id: 7101 } });
  expect((await request.get("/api/platform/context?accountId=7102", { headers: await auth(page) })).status()).toBe(404);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "other", /\/app$/);
  const secondScope = await request.get("/api/platform/context", { headers: await auth(page) });
  expect(await secondScope.json()).toMatchObject({ role: "CLIENTE", account: { id: 7102 } });
  expect((await request.get("/api/platform/context?accountId=7101", { headers: await auth(page) })).status()).toBe(404);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "member", /\/app$/);
  await page.goto("/app/equipe");
  await expect(page.locator(".team-list").getByText("Equipe A", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar usuário" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sua marca", exact: true })).toHaveCount(0);
  const headers = await auth(page);
  expect(await (await request.get("/api/platform/context", { headers })).json())
    .toMatchObject({ role: "USUARIO", account: { id: 7101 } });
  expect((await request.get("/api/platform/widget", { headers })).status()).toBe(403);
  expect((await request.get(receipt(7201), { headers })).status()).toBe(403);
  await page.goto("/app/widget");
  await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
  await page.goto("/admin/baixas");
  await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
  await page.evaluate(() => localStorage.clear());

  await login(page, "admin", /\/app$/);
  await expect(page.getByRole("heading", { name: "Seus clientes, em perspectiva." })).toBeVisible();
  expect((await request.get("/api/platform/clients", { headers: await auth(page) })).status()).toBe(200);
  await page.evaluate(() => localStorage.clear());

  await login(page, "beneficiary", /\/portal$/);
  await expect(page.getByRole("heading", { name: "Meus processos" })).toBeVisible();
  const portal = await request.get("/api/portal/processos", { headers: await auth(page) });
  expect(await portal.json()).toMatchObject({ items: [{ id: 7305 }] });
});

test("sessão expirada renova no backend e logout revoga a renovação", async ({ page, request }) => {
  await login(page, "member", /\/app$/);
  const initial = await auth(page);
  const deadline = await page.evaluate(() => {
    const encoded = localStorage.getItem("token")!.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(encoded)).exp * 1000;
  });
  await expect.poll(() => Date.now(), { timeout: 30000, intervals: [300, 500, 1000] }).toBeGreaterThan(deadline);
  expect((await request.get("/api/platform/context", { headers: initial })).status()).toBe(401);
  const renewed = page.waitForResponse(res => res.url().endsWith("/api/auth/refresh"));
  const workspace = page.waitForResponse(res => res.url().endsWith("/api/platform/context") && res.ok());
  await page.reload({ waitUntil: "domcontentloaded" });
  expect((await renewed).status()).toBe(200);
  expect(await (await workspace).json()).toMatchObject({ role: "USUARIO", account: { id: 7101 } });
  await expect(page.getByRole("link", { name: "Equipe", exact: true })).toBeVisible({ timeout: 12000 });
  expect((await auth(page)).Authorization === initial.Authorization).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("userType"))).toBe("USUARIO");
  const refreshToken = await page.evaluate(() => localStorage.getItem("refreshToken"));
  const logout = page.waitForResponse(res => res.url().endsWith("/api/auth/logout"));
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  expect((await logout).ok()).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.post("/api/auth/refresh", { data: { refreshToken } })).status()).toBe(401);
});

test("baixas reais paginam, preservam busca e retornam o comprovante original", async ({ page, request }) => {
  await login(page, "operator", /\/admin\/dashboard$/);
  await page.goto("/admin/baixas");
  const search = page.getByLabel("Buscar processos");
  await search.fill("LOTE07-BAIXA");
  await expect(page.getByText("1–20 de 21 registros")).toBeVisible();
  const firstPage = await request.get(endpoint + "/pagina?page=0&size=20&q=LOTE07-BAIXA&status=EM_PROCESSO_DE_BAIXA", { headers: await auth(page) });
  const initial = await firstPage.json();
  expect(initial.total).toBe(21);
  expect(initial.items.map((item: { id: number }) => item.id))
    .toEqual(Array.from({ length: 20 }, (_, i) => 7221 - i));

  await page.getByRole("button", { name: "Próxima página" }).click();
  await expect(page.getByText("21–21 de 21 registros")).toBeVisible();
  await page.getByRole("button", { name: "Conferir processo #7201" }).click();
  await page.getByLabel("Observação da baixa").fill("Conferido na operação de teste");
  await page.getByRole("button", { name: "Concluir baixa", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar baixa" }).click();
  await expect(page.getByText(/Baixa registrada #/)).toBeVisible();
  await expect(page.getByText("1–20 de 20 registros")).toBeVisible();
  await expect(search).toHaveValue("LOTE07-BAIXA");
  await page.getByLabel("Situação da baixa").selectOption("FINALIZADO");
  await expect(page.getByRole("button", { name: "Conferir processo #7201" })).toBeVisible();
  await page.getByRole("button", { name: "Conferir processo #7201" }).click();
  await expect(page.getByText("Conferido na operação de teste")).toBeVisible();

  const headers = await auth(page);
  const original = await request.get(receipt(7201), { headers });
  expect(original.status()).toBe(200);
  const repeated = await request.post(receipt(7201), { headers, data: { observacao: "Não substituir" } });
  expect(repeated.ok()).toBe(true);
  expect(await repeated.json()).toEqual(await original.json());
  const ownerLogin = await request.post("/api/auth/login", {
    data: { email: fixture.owner, senha: process.env.SYSTEMX_E2E_PASSWORD },
  });
  const ownerToken = (await ownerLogin.json()).token;
  const detail = await request.get("/api/portal/processos/7201", { headers: { Authorization: "Bearer " + ownerToken } });
  expect(detail.status()).toBe(200);
  const history = (await detail.json()).historico;
  expect(history.filter((entry: { novoStatus: string }) => entry.novoStatus === "FINALIZADO"))
    .toMatchObject([{ statusAnterior: "EM_PROCESSO_DE_BAIXA", observacao: "Conferido na operação de teste" }]);
  expect((await request.get(receipt(7201))).status()).toBe(401);
  expect((await request.get(receipt(7303), { headers })).status()).toBe(404);
  expect((await request.post(receipt(7301), { headers, data: { observacao: "Inelegível" } })).status()).toBe(409);

  await page.goto("/admin/baixas?processo=7302");
  await expect(page.getByRole("heading", { name: "Processo #7302" })).toBeVisible();
  await expect(page.getByText("O comprovante da baixa não está disponível para este processo.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Concluir baixa", exact: true })).toHaveCount(0);
  await page.goto("/admin/baixas?processo=7303");
  await expect(page.getByText("O processo solicitado não foi encontrado.")).toBeVisible();
});

test("andamento respeita as transições e registra histórico no MySQL", async ({ page, request }) => {
  await login(page, "operator", /\/admin\/dashboard$/);
  await page.goto("/admin/contemplados?processo=7301");
  await expect(page.getByLabel("Novo status")).toBeVisible();
  await expect(page.getByLabel("Novo status").getByRole("option", { name: "Finalizado", exact: true })).toHaveCount(0);
  await page.getByLabel("Novo status").selectOption("EM_PROCESSO_DE_BAIXA");
  await page.getByLabel("Observação do andamento").fill("Andamento de teste");
  await page.getByRole("button", { name: "Atualizar andamento" }).click();
  await page.getByRole("button", { name: "Confirmar alteração" }).click();
  await expect.poll(async () => {
    const current = await request.get(endpoint + "/7301", { headers: await auth(page) });
    return (await current.json()).status;
  }).toBe("EM_PROCESSO_DE_BAIXA");
  expect((await request.patch(endpoint + "/7301/status", { headers: await auth(page), data: { status: "FINALIZADO" } })).status()).toBe(409);

  const ownerLogin = await request.post("/api/auth/login", {
    data: { email: fixture.owner, senha: process.env.SYSTEMX_E2E_PASSWORD },
  });
  const detail = await request.get("/api/portal/processos/7301", {
    headers: { Authorization: "Bearer " + (await ownerLogin.json()).token },
  });
  expect((await detail.json()).historico).toMatchObject([
    { statusAnterior: "EM_ANALISE", novoStatus: "EM_PROCESSO_DE_BAIXA", observacao: "Andamento de teste" },
  ]);
});

test("comunicação preserva fila e histórico quando provedores estão desativados", async ({ page, request }) => {
  await login(page, "admin", /\/app$/);
  const path = "/api/integracoes/processos/7304";
  const headers = await auth(page);
  const before = await request.get("/api/integracoes/comunicacoes/fila/resumo", { headers });
  expect(before.status()).toBe(200);
  expect((await before.json()).pendentes).toBeGreaterThan(0);
  const queued = await request.post(path + "/comunicacao/reenvio", { headers });
  expect(queued.status()).toBe(200);
  expect(await queued.json()).toMatchObject({
    email: { status: "PENDENTE", estadoDespacho: "NA_FILA" },
    whatsapp: { status: "PENDENTE", estadoDespacho: "NA_FILA" },
  });
  await page.goto("/admin/contemplados?processo=7304");
  await expect(page.getByRole("heading", { name: "Histórico de comunicações" })).toBeVisible();
  await expect(page.getByText("Email · Na fila")).toBeVisible();
  await expect(page.getByText("WhatsApp · Na fila")).toBeVisible();
  const duplicate = await request.post(path + "/comunicacao/reenvio", { headers });
  expect(duplicate.status()).toBe(409);
  const persisted = await request.get(path + "/comunicacoes/historico", { headers });
  expect((await persisted.json()).total).toBe(4);
  const fresh = await request.get(endpoint + "/7304", { headers });
  expect(await fresh.json()).toMatchObject({ status: "AGUARDANDO_COMUNICACAO" });
});
