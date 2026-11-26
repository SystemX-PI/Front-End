import { expect, test } from "@playwright/test";

const process = {
  id: 7, contemplacaoId: 9, status: "EM_PROCESSO_DE_BAIXA",
  atualizadoEm: "2026-10-29T11:00:00",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "fixture-local");
    localStorage.setItem("userType", "FUNCIONARIO");
  });
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/processos-contemplacao/7")) return route.fulfill({ json: process });
    return route.fulfill({ json: { items: [process], total: 1, page: 0, size: 20 } });
  });
});

test.use({ timezoneId: "America/Sao_Paulo" });

test("horário de baixa sem offset é tratado como UTC e apresentado no fuso do navegador", async ({ page }) => {
  await page.goto("/admin/baixas");
  await expect(page.getByRole("row").filter({ hasText: "#7" })).toContainText("08:00");
});

test("diálogo de baixa começa no cancelamento, recolhe com Escape e devolve o foco", async ({ page }) => {
  await page.goto("/admin/baixas?processo=7");
  const trigger = page.getByRole("button", { name: "Concluir baixa", exact: true });
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Concluir baixa do processo #7?" });
  const cancel = dialog.getByRole("button", { name: "Cancelar" });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  const confirm = dialog.getByRole("button", { name: "Confirmar baixa" });
  await expect(confirm).toBeFocused();
  expect(await confirm.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Próxima página" })).toBeDisabled();
});

test("baixas funcionam em 320 CSS px e com ampliação de 200%", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/admin/baixas");
  await expect(page.getByLabel("Buscar processos")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByLabel("ID do processo")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const action = page.getByRole("button", { name: "Consultar processo" });
  await action.focus();
  expect(await action.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

test("aviso de falha de baixa tem nome acessível e contraste de texto", async ({ page }) => {
  await page.route("**/api/processos-contemplacao/7", route =>
    route.fulfill({ json: { ...process, status: "FINALIZADO" } }),
  );
  await page.route("**/api/integracoes/processos/7/baixa", route =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/admin/baixas?processo=7");
  const alert = page.getByRole("alert").filter({ hasText: "O serviço de baixas está temporariamente indisponível." });
  await expect(alert).toBeVisible();
  const ratio = await alert.locator("span").evaluate(node => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const layers = [];
    for (let current: Element | null = node; current; current = current.parentElement) {
      layers.unshift(getComputedStyle(current).backgroundColor);
    }
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    for (const layer of layers) {
      ctx.fillStyle = layer;
      ctx.fillRect(0, 0, 1, 1);
    }
    const background = ctx.getImageData(0, 0, 1, 1).data;
    ctx.fillStyle = getComputedStyle(node).color;
    ctx.fillRect(0, 0, 1, 1);
    const foreground = ctx.getImageData(0, 0, 1, 1).data;
    const luminance = (color: Uint8ClampedArray) => [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => {
      const channel = color[index] / 255;
      return sum + weight * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    }, 0);
    const [a, b] = [luminance(background), luminance(foreground)].sort((x, y) => x - y);
    return (b + 0.05) / (a + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("edição de registro preserva o perfil USUARIO retornado pelo backend", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("userType", "ADMINISTRADOR"));
  let saved: unknown = null;
  await page.route("**/api/usuarios/**", route => {
    const path = new URL(route.request().url()).pathname;
    const member = { id: 17, nome: "Equipe fictícia", email: "equipe@example.test", tipo: "USUARIO", ativo: true };
    if (path.endsWith("/pagina")) return route.fulfill({ json: { items: [member], total: 1, page: 0, size: 20 } });
    if (route.request().method() === "PUT") saved = route.request().postDataJSON();
    return route.fulfill({ json: member });
  });
  await page.goto("/admin/usuarios");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(page.getByRole("main").getByLabel("Perfil")).toHaveValue("USUARIO");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Cadastro salvo.")).toBeVisible();
  expect(saved).toMatchObject({ tipo: "USUARIO" });
});
