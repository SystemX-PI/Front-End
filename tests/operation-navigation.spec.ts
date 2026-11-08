import { expect, test } from "@playwright/test";

test("admin navega entre clientes e processos pelo contato, sem informar IDs", async ({ page }) => {
  const date = "2026-11-05T12:00:00Z";
  const channel = (destinatario: string) => ({ id: 1, destinatario, status: "PENDENTE", erro: null, criadaEm: date, enviadaEm: null });
  const queue = [
    { processoId: 17, origem: "Parceiro Sul", idExterno: "COTA-82", statusProcesso: "EM_PROCESSO_DE_BAIXA", recebidaEm: date, comunicacao: { processoId: 17, statusGeral: "PENDENTE", email: channel("ana@example.test"), whatsapp: channel("5511991234567") } },
    { processoId: 45, origem: "Parceiro Norte", idExterno: "COTA-91", statusProcesso: "CONTEMPLADO", recebidaEm: date, comunicacao: { processoId: 45, statusGeral: "PENDENTE", email: channel("leo@example.test"), whatsapp: channel("5521987654321") } },
  ];
  await page.addInitScript(() => {
    localStorage.setItem("token", "mock-access");
    localStorage.setItem("refreshToken", "mock-refresh");
    localStorage.setItem("userType", "ADMINISTRADOR");
  });
  let sent: unknown;
  let queueLoads = 0;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/platform/context") return route.fulfill({ json: { role: "ADMINISTRADOR", name: "Admin", email: "admin@example.test", active: true, account: null, instances: [], mailboxes: [], users: [] } });
    if (path === "/api/platform/clients") return route.fulfill({ json: [{ id: 7, nome: "Empresa Aurora", email: "titular@example.test", trialEndsAt: date, suspended: false, instances: 0, gmails: 0, users: 0 }] });
    if (path === "/api/platform/operation-channels") return route.fulfill({ json: { instances: [{ id: 3, name: "Operação" }] } });
    if (path.endsWith("/comunicacoes/fila/pagina")) { queueLoads++; return route.fulfill({ json: { items: queue, total: queue.length, page: 0, size: 100 } }); }
    if (path === "/api/clientes/pagina") return route.fulfill({ json: { items: [{ nome: "Ana Júlia", email: "ana@example.test" }, { nome: "Léo Dias", email: "leo@example.test" }], total: 2, page: 0, size: 100 } });
    if (path === "/api/processos-contemplacao/45") return route.fulfill({ json: { id: 45, status: "CONTEMPLADO", atualizadoEm: date, criadoEm: date } });
    if (path.endsWith("/processos/17/comunicacao/whatsapp")) {
      sent = route.request().postDataJSON();
      return route.fulfill({ json: { ...queue[0].comunicacao, whatsapp: { ...queue[0].comunicacao.whatsapp, status: "SUCESSO" } } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/app");
  await expect(page.getByRole("navigation", { name: "Navegação administrativa" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clientes", exact: true })).toHaveCount(1);
  await expect(page.getByText("Empresa Aurora", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Disparo manual", exact: true }).click();
  await expect(page.getByRole("button", { name: /Ana Júlia/ })).toBeVisible();
  await page.getByRole("searchbox").fill("ana julia");
  await expect(page.getByRole("button", { name: /Léo Dias/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Ana Júlia/ }).click();
  await expect(page.getByLabel("WhatsApp remetente")).toHaveValue("3");
  await expect(page.getByLabel("WhatsApp do destinatário")).toHaveValue("+55 (11) 99123-4567");
  await expect(page.getByText(/Endpoint:|ID do processo|Nenhuma entrega é simulada|instância Evolution API/)).toHaveCount(0);
  await page.getByLabel("Mensagem", { exact: true }).fill("Confira os próximos passos.");
  await page.getByRole("button", { name: "Revisar envio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return Math.max(Math.abs(rect.left + rect.width / 2 - innerWidth / 2),
      Math.abs(rect.top + rect.height / 2 - innerHeight / 2));
  })).toBeLessThan(2);
  await page.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
  await expect(page.getByText("Mensagem aceita pelo WhatsApp.")).toBeVisible();
  expect(sent).toEqual({ telefone: "+5511991234567", mensagem: "Confira os próximos passos.", remetenteId: 3 });
  await page.getByRole("link", { name: "Baixas pendentes" }).click();
  await expect(page.getByRole("button", { name: /Ana Júlia/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Léo Dias/ })).toHaveCount(0);
  await page.getByRole("searchbox").fill("ana@example.test");
  await page.getByRole("button", { name: /Ana Júlia/ }).click();
  await expect(page.getByRole("button", { name: "Concluir baixa" })).toBeVisible();
  await page.getByLabel("Exibir").selectOption("open");
  await page.getByRole("searchbox").clear();
  await page.getByRole("button", { name: /Léo Dias/ }).click();
  await expect(page.getByText("Este processo não está na etapa de baixa.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Concluir baixa" })).toHaveCount(0);
  await page.getByRole("link", { name: "Contemplados" }).click();
  await page.getByRole("searchbox").fill("(21) 98765-4321");
  await page.getByRole("button", { name: /Léo Dias/ }).click();
  await expect(page.getByRole("heading", { name: "Léo Dias" })).toBeVisible();
  expect(queueLoads).toBeLessThanOrEqual(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
