import { randomUUID } from "node:crypto";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const password = process.env.SYSTEMX_E2E_PASSWORD!;

async function newOwner(page: Page, request: APIRequestContext, pixScenario = "") {
  const email = `lote09-${randomUUID().slice(0, 8)}${pixScenario}@example.test`;
  const registered = await request.post("/api/auth/register", {
    data: { nome: "Titular Stripe fictício", empresa: "SystemX sandbox", email, senha: password },
  });
  expect(registered.status()).toBe(201);

  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);

  return () => page.evaluate(() => ({ Authorization: "Bearer " + localStorage.getItem("token") }));
}

async function hostedCheckout(page: Page, mode: "PIX" | "CARD") {
  await page.goto("/app/upgrade");
  const label = mode === "CARD" ? /^Cartão/ : /^Pix/;
  const action = mode === "CARD" ? "Continuar para pagamento" : "Gerar QR Code no Stripe";
  await page.getByRole("button", { name: label }).click();
  const created = page.waitForResponse(r => r.url().endsWith("/subscription/stripe-checkout"));
  await page.getByRole("button", { name: action }).click();
  const response = await created;
  if (!response.ok()) return response.status();
  await page.waitForURL(url => url.origin === "https://checkout.stripe.com" && url.pathname.includes("cs_test_"));
  return response.status();
}

async function checkoutForm(page: Page) {
  const embedded = 'iframe[title="Secure embedded form frame"]';
  await page.locator(embedded).or(page.locator("#cardNumber, button[type=submit]")).first().waitFor();
  return await page.locator(embedded).count() ? page.frameLocator(embedded) : page;
}

async function fillCard(page: Page, pan: string) {
  const form = await checkoutForm(page);
  await form.locator("#cardNumber, [autocomplete=cc-number]").first().fill(pan);
  await form.locator("#cardExpiry, [autocomplete=cc-exp]").first().fill("12" + (new Date().getFullYear() + 4).toString().slice(-2));
  await form.locator("#cardCvc, [autocomplete=cc-csc]").first().fill("123");
  const name = form.locator("#billingName, [autocomplete=cc-name]").first();
  if (await name.count()) await name.fill("Cliente Teste SystemX");
  const postal = form.locator("#billingPostalCode, [autocomplete=postal-code]").first();
  if (await postal.isVisible()) await postal.fill("10001");
  return form;
}

test("retorno de sucesso sem pagamento não libera plano no sandbox", async ({ page, request }) => {
  const headers = await newOwner(page, request);
  await page.goto("/app/assinatura?stripe=success");
  await page.getByRole("button", { name: "Verificar pagamento" }).click();
  await expect(page.getByText("Pagamento ainda não confirmado pelo Stripe.")).toBeVisible();
  const context = await request.get("/api/platform/context", { headers: await headers() });
  expect(await context.json()).toMatchObject({ subscription: { tier: "TRIAL" } });
});

test("cartão de teste no Stripe confirma via webhook e mantém o plano ao recarregar", async ({ page, request }) => {
  const headers = await newOwner(page, request);
  expect(await hostedCheckout(page, "CARD")).toBe(201);
  const form = await fillCard(page, process.env.SYSTEMX_STRIPE_TEST_PAN!);
  await form.locator("button[type=submit]").first().click();
  await page.waitForURL("http://127.0.0.1:5177/app/assinatura?stripe=success", { timeout: 60000 });

  await expect.poll(async () => {
    const response = await request.get("/api/platform/context", { headers: await headers() });
    return (await response.json()).subscription?.tier;
  }, { timeout: 30000 }).toBe("PRO");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Plano ativo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Verificar pagamento" }).click();
  await expect(page.getByText("Pagamento confirmado pelo Stripe.")).toBeVisible();
});

test("cartão recusado no sandbox mantém o plano de teste", async ({ page, request }) => {
  const declinedCard = process.env.SYSTEMX_STRIPE_DECLINED_TEST_PAN;
  test.skip(!declinedCard, "Informe o número oficial Stripe para testar recusa.");
  const headers = await (await newOwner(page, request))();
  expect(await hostedCheckout(page, "CARD")).toBe(201);
  const form = await fillCard(page, declinedCard!);
  await form.locator("button[type=submit]").first().click();
  await expect(form.getByText(/your card was declined|cartão foi recusado/i).first()).toBeVisible({ timeout: 45000 });
  const context = await request.get("/api/platform/context", { headers });
  expect(await context.json()).toMatchObject({ subscription: { tier: "TRIAL" } });
});

test("Pix cria sessão real pendente e não concede acesso antes do pagamento", async ({ page, request }) => {
  const headers = await (await newOwner(page, request))();
  expect(await hostedCheckout(page, "PIX")).toBe(201);
  const context = await request.get("/api/platform/context", { headers });
  expect(await context.json()).toMatchObject({ subscription: { tier: "TRIAL" } });
});

async function submitPix(page: Page) {
  const form = await checkoutForm(page);
  await form.locator("input[name=taxId]").fill("00000000000");
  await form.locator("input[name=name]").fill("Cliente Teste SystemX");
  await form.locator("button[type=submit]").first().click();
}

test("Pix pago no sandbox libera o plano via webhook", async ({ page, request }) => {
  const headers = await (await newOwner(page, request, "succeed_immediately"))();
  expect(await hostedCheckout(page, "PIX")).toBe(201);
  await submitPix(page);

  await expect.poll(async () => {
    const response = await request.get("/api/platform/context", { headers });
    return (await response.json()).subscription?.tier;
  }, { timeout: 45000 }).toBe("PRO");
  await page.goto("/app/assinatura");
  await expect(page.getByText("Plano ativo", { exact: true })).toBeVisible();
});
