import {test,expect} from "@playwright/test";
test("consulta real da plataforma ate o MySQL",async({page,request})=>{
 test.skip(!process.env.SYSTEMX_TEST_TOKEN,"Requer token de administrador autorizado no backend local.");const token=process.env.SYSTEMX_TEST_TOKEN!;
 const result=await request.get("http://127.0.0.1:8080/api/platform/clients",{headers:{Authorization:`Bearer ${token}`}});expect(result.status()).toBe(200);const clients=await result.json();expect(Array.isArray(clients)).toBe(true);
 await page.addInitScript(token=>{localStorage.setItem("token",token);localStorage.setItem("userType","ADMINISTRADOR");},token);await page.goto("/app");await expect(page.getByRole("heading",{name:"Seus clientes, em perspectiva."})).toBeVisible();await expect(page.locator(".client-card")).toHaveCount(clients.length);
});
