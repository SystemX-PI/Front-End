import { expect, test } from "@playwright/test";

test("login with Google sends the returned ID token to the backend", async ({ page }) => {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.google={accounts:{id:{initialize(options){window.__googleCredentialCallback=options.callback;},renderButton(element){const button=document.createElement("button");button.type="button";button.textContent="Entrar com Google";button.onclick=()=>window.__googleCredentialCallback({credential:"mock-google-id-token"});element.appendChild(button);}}}};`,
    }),
  );
  await page.route("**/api/auth/google", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ credential: "mock-google-id-token" });
    await route.fulfill({
      status: 200,
      json: { token: "mock-application-jwt", refreshToken: "mock-refresh-token", tipo: "CLIENTE", expiresIn: 900 },
    });
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar com Google" }).click();

  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBe("mock-application-jwt");
  await expect(page.evaluate(() => localStorage.getItem("userType"))).resolves.toBe("CLIENTE");
});

test("Google cancellation leaves the login page available", async ({ page }) => {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.google={accounts:{id:{initialize(){},renderButton(element){const button=document.createElement("button");button.type="button";button.textContent="Entrar com Google";element.appendChild(button);}}}};`,
    }),
  );

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("Google registration asks only for company name and sends the token after confirmation", async ({ page }) => {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.google={accounts:{id:{initialize(options){window.__googleCredentialCallback=options.callback;},renderButton(element,options){const button=document.createElement("button");button.type="button";button.textContent=options.text==="signup_with"?"Fazer Cadastro com o Google":"Google";button.onclick=()=>window.__googleCredentialCallback({credential:"mock-google-id-token"});element.appendChild(button);}}}};`,
    }),
  );
  await page.route("**/api/auth/google/register", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      credential: "mock-google-id-token",
      companyName: "Empresa Aurora",
    });
    await route.fulfill({
      status: 200,
      json: { token: "mock-google-register-jwt", refreshToken: "mock-refresh-token", tipo: "CLIENTE", expiresIn: 900 },
    });
  });

  await page.goto("/register");
  await page.getByRole("button", { name: "Fazer Cadastro com o Google" }).click();
  await expect(page.getByLabel("Nome da sua empresa")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveCount(0);
  await expect(page.getByLabel("Senha", { exact: true })).toHaveCount(0);
  await page.getByLabel("Nome da sua empresa").fill("Empresa Aurora");
  await page.getByRole("button", { name: "Concluir cadastro" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBe("mock-google-register-jwt");
});


test("unknown Google account goes straight to registration and waits for confirmation", async ({ page }) => {
  await page.route("https://accounts.google.com/gsi/client", route => route.fulfill({
    contentType: "application/javascript",
    body: `window.google={accounts:{id:{initialize(options){window.__googleCredentialCallback=options.callback;},renderButton(element){const button=document.createElement("button");button.type="button";button.textContent="Entrar com Google";button.onclick=()=>window.__googleCredentialCallback({credential:"new-google-id-token"});element.appendChild(button);}}}};`,
  }));
  await page.route("**/api/auth/google", route => route.fulfill({status:403,json:{message:"Esta conta Google ainda não possui cadastro."}}));
  let registrations = 0;
  await page.route("**/api/auth/google/register", async route => {
    registrations++;
    expect(route.request().postDataJSON()).toEqual({credential:"new-google-id-token",companyName:"Empresa Nova"});
    await route.fulfill({status:201,json:{token:"new-session",refreshToken:"new-refresh",tipo:"CLIENTE",expiresIn:900}});
  });
  await page.goto("/login");
  await page.getByRole("button", {name:"Entrar com Google"}).click();
  await expect(page).toHaveURL(/register$/);
  await expect(page.getByLabel("Nome da sua empresa")).toBeVisible();
  await expect(page.getByLabel("Senha", {exact:true})).toHaveCount(0);
  expect(registrations).toBe(0);
  await page.getByLabel("Nome da sua empresa").fill("Empresa Nova");
  await page.getByRole("button", {name:"Concluir cadastro"}).click();
  await expect(page).toHaveURL(/app$/);
  expect(registrations).toBe(1);
});
