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
