import {test,expect} from "@playwright/test";
async function session(page:import("@playwright/test").Page){await page.addInitScript(()=>{localStorage.setItem("token","expired");localStorage.setItem("refreshToken","refresh-test");localStorage.setItem("userType","ADMINISTRADOR");});}
const summary={total:0,active:0,subscribed:0,pending:0,instances:0,mailboxes:0,members:0};
test("renova uma unica vez para chamadas simultaneas",async({page})=>{
 await session(page);let count=0;await page.route("**/api/**",async route=>{if(route.request().url().endsWith("/auth/refresh")){count++;await new Promise(r=>setTimeout(r,100));return route.fulfill({json:{token:"renewed",refreshToken:"new-refresh",tipo:"ADMINISTRADOR",expiresIn:900}});}if(route.request().headers().authorization!=="Bearer renewed")return route.fulfill({status:401,json:{}});return route.fulfill({json:summary});});await page.goto("/app");await expect(page.getByText("Nenhum checkout ou cobrança pendente identificado.")).toBeVisible();await page.evaluate(async()=>{const {apiRequest}=await import("/src/services/backend.ts");localStorage.setItem("token","expired-again");await Promise.all([apiRequest("/api/one"),apiRequest("/api/two"),apiRequest("/api/three")]);});expect(count).toBe(2);await expect(page).toHaveURL(/admin\/dashboard$/);
});
test("indisponibilidade preserva credenciais e refresh revogado exige login",async({page})=>{
 await session(page);let status=503;await page.route("**/api/**",route=>route.fulfill({status:route.request().url().endsWith("/auth/refresh")?status:401,json:{}}));await page.goto("/app");await expect(page.getByRole("button",{name:"Tentar novamente"})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem("refreshToken"))).toBe("refresh-test");status=401;await page.getByRole("button",{name:"Tentar novamente"}).click();await expect(page).toHaveURL(/login$/);expect(await page.evaluate(()=>localStorage.getItem("token"))).toBeNull();
});

test("login abre a area protegida sem recarregar a pagina", async ({page}) => {
 await page.route("**/api/auth/login", route => route.fulfill({json:{token:"access",refreshToken:"refresh",tipo:"ADMINISTRADOR",expiresIn:900}}));
 await page.route("**/api/platform/**", route => route.fulfill({json:summary}));
 await page.goto("/app");
 await expect(page).toHaveURL(/login$/);
 await page.getByLabel("E-mail",{exact:true}).fill("admin@example.com");
 await page.getByLabel("Senha",{exact:true}).fill("senha-local-teste");
 await page.getByRole("button",{name:"Entrar",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Visão geral"})).toBeVisible();
 await expect(page).toHaveURL(/admin\/dashboard$/);
});
