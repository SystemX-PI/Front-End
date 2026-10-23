import { test, expect } from "@playwright/test";

test("consulta real: frontend → Spring Boot → MySQL → dashboard", async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.SYSTEMX_TEST_TOKEN,
    "Requer backend ativo e SYSTEMX_TEST_TOKEN de uma sessão de teste autorizada.",
  );
  const token = process.env.SYSTEMX_TEST_TOKEN!;
  const response = await request.get(
    "http://127.0.0.1:8080/api/integracoes/comunicacoes/fila",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(response.status()).toBe(200);
  const queue = await response.json();
  expect(Array.isArray(queue)).toBeTruthy();
  for (const item of queue) {
    expect(typeof item.processoId).toBe("number");
    expect(item.comunicacao).toHaveProperty("statusGeral");
    expect(item.comunicacao).toHaveProperty("email");
    expect(item.comunicacao).toHaveProperty("whatsapp");
  }
  await page.addInitScript((token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userType", "ADMINISTRADOR");
    localStorage.setItem("userEmail", "validacao-local@systemx.test");
  }, token);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/admin/dashboard");
  await expect(
    page.locator(".admin-metrics .metric-card").first().locator("strong"),
  ).toHaveText(String(queue.length));
  await expect(page.locator(".error-state")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/dashboard-live.png",
    fullPage: true,
  });
  await page.goto("/admin/clientes");
  await expect(
    page.getByRole("heading", { name: "Clientes cadastrados" }),
  ).toBeVisible();
  await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  await expect(page.locator(".error-state")).toHaveCount(0);
  expect(errors).toEqual([]);
});
