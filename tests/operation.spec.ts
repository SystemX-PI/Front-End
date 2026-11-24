import {test,expect,type Page} from '@playwright/test';
const process={id:7,contemplacaoId:4,responsavelId:9,status:'EM_PROCESSO_DE_BAIXA',criadoEm:'2026-10-29T10:00:00',atualizadoEm:'2026-10-29T10:00:00'};
async function session(page:Page,role='ADMINISTRADOR'){await page.addInitScript(role=>{localStorage.setItem('token','header.'+btoa(JSON.stringify({uid:9}))+'.signature');localStorage.setItem('refreshToken','refresh');localStorage.setItem('userType',role);},role);}
test('rotas operacionais respeitam perfis',async({page})=>{await session(page,'CLIENTE');await page.goto('/admin/baixas');await expect(page.getByRole('heading',{name:'Acesso restrito',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Concluir baixa'})).toHaveCount(0);});
test('baixa consulta, confirma uma vez e mostra comprovante',async({page})=>{await session(page);let count=0;await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('/pagina'))return route.fulfill({json:{items:[process],page:0,total:1,size:20}});if(url.endsWith('/baixa')){count++;expect(route.request().postDataJSON()).toEqual({observacao:'Conferido'});return route.fulfill({json:{id:3,processoId:7,usuarioId:9,data:'2026-10-29T11:00:00',observacao:'Conferido'}});}return route.fulfill({json:process});});await page.goto('/admin/baixas');await page.getByRole('button',{name:'Conferir processo #7'}).click();await page.getByLabel('Observação da baixa').fill('Conferido');await page.getByRole('button',{name:'Concluir baixa',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancelar',exact:true}).click();expect(count).toBe(0);await page.getByRole('button',{name:'Concluir baixa',exact:true}).click();await page.getByRole('button',{name:'Confirmar baixa',exact:true}).click();await expect(page.getByText('Baixa registrada #3')).toBeVisible();expect(count).toBe(1);await expect(page.getByRole('button',{name:'Concluir baixa',exact:true})).toHaveCount(0);});
test('serviço ausente e processo cancelado não permitem baixa',async({page})=>{await session(page);await page.route('**/api/**',route=>route.request().url().includes('/pagina')?route.fulfill({status:404,json:{}}):route.fulfill({json:{...process,status:'CANCELADO'}}));await page.goto('/admin/baixas');await expect(page.getByText(/aguardando a integração/)).toBeVisible();await page.getByLabel('ID do processo',{exact:true}).fill('7');await page.getByRole('button',{name:'Consultar processo',exact:true}).click();await expect(page.getByText(/não está na etapa de baixa/)).toBeVisible();await expect(page.getByRole('button',{name:'Concluir baixa'})).toHaveCount(0);});
test('auditoria mantém os registros legíveis em cartões no celular',async({page})=>{await session(page);await page.setViewportSize({width:320,height:740});await page.route('**/api/auditoria/**',route=>route.fulfill({json:{items:[{id:1,data:'2026-10-29T11:00:00',acao:'Baixa concluída',usuarioNome:'Julio',entidade:'Processo',registroId:7}],total:1,page:0,size:20}}));await page.goto('/admin/auditoria');await expect(page.getByRole('cell',{name:'Baixa concluída'})).toBeVisible();await expect(page.getByRole('table').locator('tbody')).toHaveCSS('display','grid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('comunicação pede confirmação e exibe histórico do processo',async({page})=>{await session(page);await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('historico'))return route.fulfill({json:{items:[{id:1,data:'2026-10-29T11:00:00',canal:'EMAIL',status:'SUCESSO',usuarioNome:'Julio'}],total:1,page:0,size:100}});if(url.includes('/pagina'))return route.fulfill({json:{items:[{processoId:7,statusProcesso:process.status,comunicacao:{statusGeral:'PENDENTE',email:null,whatsapp:null}}],total:1,page:0,size:20}});return route.fulfill({json:process});});await page.goto('/admin/comunicacao');await page.getByRole('button',{name:'Notificar',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByRole('link',{name:'Processo #7',exact:true}).click();await page.getByLabel('ID do processo',{exact:true}).fill('7');await page.getByRole('button',{name:'Consultar',exact:true}).click();await expect(page.getByRole('heading',{name:'Histórico de comunicações'})).toBeVisible();await expect(page.getByText('Email · Aceito pelo provedor')).toBeVisible();});
test('tela inicial e operação funcionam no celular',async({page})=>{await session(page);await page.setViewportSize({width:390,height:844});await page.route('**/api/**',route=>route.fulfill({status:501,json:{}}));for(const url of ['/','/admin/baixas','/admin/auditoria','/admin/comunicacao','/admin/disparo-manual']){await page.goto(url);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBe(true);}await page.goto('/');await expect(page.getByRole('heading',{name:'Seu espaço, sem complicação.'})).toBeVisible();await page.screenshot({path:'../../outputs/tela-inicial-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'../../outputs/tela-inicial-desktop.png',fullPage:true});});

test('cadastros de consórcio consultam e salvam alterações',async({page})=>{await session(page);let name='Consórcio inicial';let updates=0;await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('/consorcios/1')){if(route.request().method()==='PUT'){updates++;name=route.request().postDataJSON().nome;}return route.fulfill({json:{id:1,nome:name,tipoId:2,tipoNome:'Veículos'}});}if(url.includes('/tipos-consorcio'))return route.fulfill({json:{items:[{id:2,nome:'Veículos'}],total:1,page:0,size:20}});return route.fulfill({json:{items:[{id:1,nome:name,tipoId:2,tipoNome:'Veículos'}],total:1,page:0,size:20}});});await page.goto('/admin/cadastros');await expect(page.getByRole('cell',{name:'Consórcio inicial',exact:true})).toBeVisible();await page.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Consórcio atualizado');await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByText('Cadastro salvo.')).toBeVisible();await expect(page.getByRole('cell',{name:'Consórcio atualizado',exact:true})).toBeVisible();expect(updates).toBe(1);});

test('disparo manual seleciona processo, envia WhatsApp personalizado e exibe histórico',async({page})=>{
  await session(page,'FUNCIONARIO');
  let whatsappPayload:unknown=null;
  const requestKeys: string[] = [];
  await page.route('**/api/**',route=>{
    const url=route.request().url();
    if(url.includes('/remetentes-whatsapp/status')) return route.fulfill({json:{connected:true}});
    if(url.includes('/comunicacoes/fila/pagina')){
      return route.fulfill({json:{items:[{processoId:7,origem:'SISTEMA_PARCEIRO',idExterno:'CONT-77',statusProcesso:process.status,recebidaEm:'2026-10-29T10:00:00',comunicacao:{processoId:7,statusGeral:'PENDENTE',email:{id:1,destinatario:'cliente@exemplo.com',status:'PENDENTE',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:null},whatsapp:{id:2,destinatario:'5511999998888',status:'PENDENTE',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:null}}}],total:1,page:0,size:20}});
    }
    if(url.includes('/clientes/pagina')){
      return route.fulfill({json:{items:[{id:12,nome:'Maria Contemplada',email:'cliente@exemplo.com',tipo:'CLIENTE',ativo:true}],total:1,page:0,size:10}});
    }
    if(url.endsWith('/comunicacao/whatsapp')&&route.request().method()==='POST'){
      whatsappPayload=route.request().postDataJSON();
      requestKeys.push(route.request().headers()["idempotency-key"]);
      if (requestKeys.length === 1) return route.abort("failed");
      return route.fulfill({json:{processoId:7,statusGeral:'COMUNICADO_PARCIAL',email:{id:1,destinatario:'cliente@exemplo.com',status:'PENDENTE',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:null},whatsapp:{id:2,destinatario:'5511999998888',status:'SUCESSO',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:'2026-10-29T11:05:00'}}});
    }
    if(url.endsWith('/comunicacao')){
      return route.fulfill({json:{processoId:7,statusGeral:'PENDENTE',email:{id:1,destinatario:'cliente@exemplo.com',status:'PENDENTE',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:null},whatsapp:{id:2,destinatario:'5511999998888',status:'PENDENTE',erro:null,criadaEm:'2026-10-29T10:00:00',enviadaEm:null}}});
    }
    if(url.includes('/comunicacoes/historico')){
      return route.fulfill({json:{items:[{id:9,data:'2026-10-29T11:05:00',canal:'WHATSAPP',status:'SUCESSO',usuarioNome:'Julio',observacao:'Disparo manual'}],total:1,page:0,size:100}});
    }
    return route.fulfill({json:process});
  });

  await page.goto('/admin/disparo-manual');
  await expect(page.getByText('Número conectado para enviar mensagens.')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Disparo manual de mensagens'})).toBeVisible();
  await page.getByRole('option',{name:/CONT-77/}).click();
  await expect(page.getByRole('heading',{name:/Processo #7 · CONT-77/})).toBeVisible();
  await page.getByLabel('Mensagem para envio').fill('Olá! Seu consórcio CONT-77 foi contemplado.');
  await page.getByRole('button',{name:'Disparar WhatsApp',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Confirmar disparo',exact:true}).click();
  await expect(page.getByText(/Não foi possível conectar ao servidor/).first()).toBeVisible();
  await page.getByRole('button',{name:'Disparar WhatsApp',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar disparo',exact:true}).click();
  await expect.poll(() => requestKeys.length).toBe(2);
  expect(requestKeys[0]).toMatch(/^[0-9a-f-]{36}$/i);
  expect(requestKeys[1]).toBe(requestKeys[0]);
  expect(whatsappPayload).toEqual({telefone:'5511999998888',mensagem:'Olá! Seu consórcio CONT-77 foi contemplado.'});
  await expect(page.getByText(/Envio de WhatsApp aceito pelo provedor para o processo #7/).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Histórico de comunicações'})).toBeVisible();
});

test('trocar de processo limpa o destinatário e a mensagem anteriores', async ({ page }) => {
  await session(page, 'FUNCIONARIO');
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/pagina') || path.endsWith('/historico')) {
      return route.fulfill({ json: { items: [], page: 0, total: 0, size: 20 } });
    }
    if (path.endsWith('/comunicacao')) {
      const id = Number(path.split('/').at(-2));
      return route.fulfill({ json: { processoId: id, statusGeral: 'PENDENTE', email: null, whatsapp: null } });
    }
    return route.fulfill({ json: { ...process, id: Number(path.split('/').at(-1)) } });
  });

  await page.goto('/admin/disparo-manual?processo=7');
  const phone = page.getByLabel('Telefone / WhatsApp do destinatário');
  const message = page.getByLabel('Mensagem para envio');
  await phone.fill('11999998888');
  await message.fill('Mensagem exclusiva do processo anterior.');
  await page.getByLabel('ID do processo contemplado').fill('8');
  await page.getByRole('button', { name: 'Carregar ID', exact: true }).click();

  await expect(page).toHaveURL(/processo=8$/);
  await expect(phone).toHaveValue('');
  await expect(message).not.toHaveValue('Mensagem exclusiva do processo anterior.');
});

test("assistente oferece atalhos quando o serviço de IA está indisponível", async ({ page }) => {
  await session(page, "FUNCIONARIO");
  await page.route("**/api/assistente/mensagens", route =>
    route.fulfill({ status: 503, json: { message: "Assistente indisponível" } }));
  await page.goto("/admin/comunicacao");
  await page.getByRole("button", { name: "Abrir assistente IA" }).click();
  const assistant = page.getByRole("region", { name: "Assistente Inteligente ConsorTech" });
  await assistant.getByRole("textbox").fill("Consultar contemplações");
  await assistant.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(assistant.getByRole("link", { name: "Disparo manual" })).toBeVisible();
});

test("assistente aparece depois do login sem recarregar a página", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Abrir assistente IA" })).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem("token", "sessao-autenticada");
    localStorage.setItem("userType", "ADMINISTRADOR");
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("button", { name: "Abrir assistente IA" })).toBeVisible();
});

test("beneficiário autenticado entra pelo portal ao abrir a área SaaS", async ({ page }) => {
  await page.addInitScript(() => {
    const claims = btoa(JSON.stringify({ tipo: "CLIENTE", beneficiario: true }));
    localStorage.setItem("token", `test.${claims}.test`);
  });
  await page.route("**/api/portal/**", route => {
    const path = new URL(route.request().url()).pathname;
    const current = { ...process, status: "EM_ANALISE" };
    return route.fulfill({ json: path.endsWith("/processos") ?
      { items: [current], total: 1, size: 20, page: 0 } : {
        processo: current,
        responsavel: "Operador",
        cota: "007",
        valorCredito: 15000,
        documentos: [],
        historico: [{ id: 1, novoStatus: "EM_ANALISE", data: process.atualizadoEm }],
      } });
  });
  await page.goto("/app");
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "Meus processos" })).toBeVisible();
  await expect(page.getByText("Aguarde o resultado da análise da equipe.")).toBeVisible();
  await page.getByRole("button", { name: "Historico" }).click();
  await expect(page.locator(".operation-history").getByRole("listitem")).toContainText("Em analise");
});

test("andamento usa as opções da API e explica conflito", async ({ page }) => {
  await session(page, "FUNCIONARIO");
  await page.route("**/api/**", route => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({ status: "EM_PROCESSO_DE_BAIXA", observacao: "" });
      return route.fulfill({ status: 409, json: { message: "Conflito" } });
    }
    if (route.request().url().endsWith("/processos-contemplacao/7")) {
      return route.fulfill({ json: { ...process, status: "EM_ANALISE", transicoesPermitidas: ["EM_PROCESSO_DE_BAIXA", "CANCELADO"] } });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin/contemplados?processo=7");
  const status = page.getByLabel("Novo status");
  await expect(status.locator("option")).toHaveCount(3);
  await expect(status.locator('option[value="FINALIZADO"]')).toHaveCount(0);
  await status.selectOption("EM_PROCESSO_DE_BAIXA");
  await page.getByRole("button", { name: "Atualizar andamento" }).click();
  await page.getByRole("button", { name: "Confirmar alteração" }).click();
  await expect(page.getByText(/Consulte o processo novamente antes de tentar/)).toBeVisible();
});

test("baixa informa conflito e mantém o processo sem comprovante", async ({ page }) => {
  await session(page, "FUNCIONARIO");
  await page.route("**/api/**", route => {
    if (route.request().method() === "POST" && route.request().url().endsWith("/baixa")) {
      return route.fulfill({ status: 409, json: { message: "Conflito" } });
    }
    if (route.request().url().endsWith("/processos-contemplacao/7")) return route.fulfill({ json: process });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin/baixas?processo=7");
  await page.getByRole("button", { name: "Concluir baixa", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar baixa", exact: true }).click();
  await expect(page.getByText(/A baixa só pode ser concluída na etapa/)).toBeVisible();
  await expect(page.getByText(/Baixa registrada #/)).toHaveCount(0);
});

test("consulta mostra o comprovante original e informa falha de permissão ao atualizar", async ({ page }) => {
  await session(page, "FUNCIONARIO");
  let autorizado = true;
  await page.route("**/api/**", route => {
    const url = route.request().url();
    if (url.endsWith("/processos-contemplacao/7")) {
      return route.fulfill({ json: { ...process, status: "FINALIZADO" } });
    }
    if (url.endsWith("/processos/7/baixa")) {
      if (!autorizado) return route.fulfill({ status: 403, json: {} });
      return route.fulfill({ json: {
        id: 3, processoId: 7, usuarioId: 9, data: "2026-10-29T11:00:00", observacao: "Observação original",
      } });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin/baixas?processo=7");
  await expect(page.getByText("Baixa registrada #3")).toBeVisible();
  await expect(page.getByText("Observação original")).toBeVisible();
  await expect(page.getByText(/Responsável #9/)).toBeVisible();

  autorizado = false;
  await page.getByRole("button", { name: "Consultar processo", exact: true }).click();
  await expect(page.getByText(/Seu perfil não tem permissão/)).toBeVisible();
  await expect(page.getByText("Observação original")).toHaveCount(0);
});

test('histórico exige evidência para reconciliar um despacho incerto', async ({ page }) => {
  await session(page);
  let reconciled = false;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/comunicacoes/19/reconciliacao')) {
      expect(route.request().postDataJSON()).toEqual({
        resultado: 'ACEITO_PROVEDOR',
        evidencia: 'Aceite conferido no registro do provedor.',
      });
      reconciled = true;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/comunicacoes/historico')) {
      return route.fulfill({ json: { items: [{
        id: 19, canal: 'WHATSAPP',
        status: reconciled ? 'SUCESSO' : 'SEM_RESPOSTA',
        estadoDespacho: reconciled ? 'CONCLUIDO' : 'INCERTO',
        reconciliavel: !reconciled,
      }, {
        id: 20, canal: 'EMAIL', status: 'SEM_RESPOSTA',
        estadoDespacho: 'INCERTO_EXECUCAO', reconciliavel: false,
      }], page: 0, total: 2, size: 20 } });
    }
    if (path.endsWith('/pagina')) {
      return route.fulfill({ json: { items: [{
        processoId: 7, statusProcesso: process.status,
        comunicacao: { statusGeral: 'PENDENTE', email: null, whatsapp: null },
      }], page: 0, total: 1, size: 20 } });
    }
    return route.fulfill({ json: process });
  });
  await page.goto('/admin/comunicacao');
  await page.getByRole('link', { name: 'Processo #7', exact: true }).click();
  await page.getByLabel('ID do processo', { exact: true }).fill('7');
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(page.getByText('Email · Aguardando encerramento do envio')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reconciliar tentativa #20' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reconciliar tentativa #19' }).click();
  const submit = page.getByRole('button', { name: 'Registrar reconciliação' });
  await expect(submit).toBeDisabled();
  await page.getByLabel('Evidência verificada').fill('Aceite conferido no registro do provedor.');
  await submit.click();
  await expect(page.getByText('WhatsApp · Aceito pelo provedor')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reconciliar tentativa #19' })).toHaveCount(0);
});

for (const [code, message] of [
  [402, "Esta consulta exige uma conta com plano ou teste ativo."],
  [404, "O comprovante da baixa não está disponível para este processo."],
  [409, "O estado do processo mudou. Consulte novamente."],
  [500, "O servidor encontrou um problema ao consultar a baixa."],
  [502, "O serviço de baixas está temporariamente indisponível."],
  [503, "O serviço de baixas está temporariamente indisponível."],
] as const) {
  test(`comprovante distingue HTTP ${code} sem expor detalhe interno`, async ({ page }) => {
    await session(page);
    await page.route("**/api/**", route => {
      const url = route.request().url();
      if (url.endsWith("/processos/7/baixa")) return route.fulfill({ status: code, json: { message: "Detalhe interno fictício" } });
      if (url.endsWith("/processos-contemplacao/7")) return route.fulfill({ json: { ...process, status: "FINALIZADO" } });
      return route.fulfill({ json: { items: [], total: 0, page: 0, size: 20 } });
    });
    await page.goto("/admin/baixas?processo=7");
    await expect(page.getByRole(code === 404 ? "status" : "alert").filter({ hasText: message })).toBeVisible();
    await expect(page.getByText("Detalhe interno fictício")).toHaveCount(0);
    if (code !== 404) await expect(page.getByText("O comprovante da baixa não está disponível para este processo.")).toHaveCount(0);
  });
}

test("falha de rede na consulta preserva comprovante anterior e permite releitura", async ({ page }) => {
  await session(page);
  let offline = false;
  await page.route("**/api/**", route => {
    const url = route.request().url();
    if (url.endsWith("/processos/7/baixa")) {
      return offline ? route.abort("failed") : route.fulfill({ json: { id: 11, processoId: 7, usuarioId: 9, observacao: "Comprovante anterior" } });
    }
    if (url.endsWith("/processos-contemplacao/7")) return route.fulfill({ json: { ...process, status: "FINALIZADO" } });
    return route.fulfill({ json: { items: [], page: 0, total: 0, size: 20 } });
  });
  await page.goto("/admin/baixas?processo=7");
  await expect(page.getByText("Comprovante anterior")).toBeVisible();
  offline = true;
  await page.getByRole("button", { name: "Consultar processo", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível conectar ao servidor para consultar a baixa." })).toBeVisible();
  await expect(page.getByText("Comprovante anterior")).toBeVisible();
  offline = false;
  await page.getByRole("button", { name: "Consultar novamente" }).click();
  await expect(page.getByText("Comprovante anterior")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível conectar" })).toHaveCount(0);
});

test("timeout de leitura usa mensagem própria e cancelamento ao sair é silencioso", async ({ page }) => {
  await session(page);
  await page.addInitScript(() => {
    const original = AbortSignal.timeout;
    AbortSignal.timeout = () => original.call(AbortSignal, 500);
  });
  await page.route("**/api/**", async route => {
    const url = route.request().url();
    if (url.endsWith("/processos/7/baixa")) {
      await new Promise(resolve => setTimeout(resolve, 850));
      await route.fulfill({ json: { id: 11 } }).catch(() => {});
      return;
    }
    if (url.endsWith("/processos-contemplacao/7")) return route.fulfill({ json: { ...process, status: "FINALIZADO" } });
    return route.fulfill({ json: { items: [], page: 0, total: 0, size: 20 } });
  });
  await page.goto("/admin/baixas?processo=7");
  await expect(page.getByRole("alert").filter({ hasText: "A consulta demorou mais que o esperado." })).toBeVisible();
  await page.getByRole("button", { name: "Consultar novamente" }).click();
  await page.getByRole("link", { name: "Ver comunicação e histórico" }).click();
  await expect(page.getByRole("heading", { name: "Contemplados", exact: true })).toBeVisible();
  await expect(page.getByText("A consulta demorou mais que o esperado.")).toHaveCount(0);
});

test("sessão vencida durante a leitura encaminha para login ao falhar a renovação", async ({ page }) => {
  await session(page);
  await page.route("**/api/**", route => {
    const url = route.request().url();
    if (url.endsWith("/processos/7/baixa") || url.endsWith("/auth/refresh")) {
      return route.fulfill({ status: 401, json: {} });
    }
    if (url.endsWith("/processos-contemplacao/7")) return route.fulfill({ json: { ...process, status: "FINALIZADO" } });
    return route.fulfill({ json: { items: [], page: 0, total: 0, size: 20 } });
  });
  await page.goto("/admin/baixas?processo=7");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("O comprovante da baixa não está disponível para este processo.")).toHaveCount(0);
});

test("resultado incerto de escrita exige conferir o processo sem repetir a baixa", async ({ page }) => {
  await session(page);
  let posts = 0;
  let reads = 0;
  await page.route("**/api/**", route => {
    const url = route.request().url();
    if (url.endsWith("/processos/7/baixa")) {
      posts++;
      return route.abort("failed");
    }
    if (url.endsWith("/processos-contemplacao/7")) {
      reads++;
      return route.fulfill({ json: process });
    }
    return route.fulfill({ json: { items: [process], total: 1, page: 0, size: 20 } });
  });
  await page.goto("/admin/baixas?processo=7");
  const close = page.getByRole("button", { name: "Concluir baixa", exact: true });
  await close.click();
  await page.getByRole("button", { name: "Confirmar baixa" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível confirmar se a baixa foi concluída." })).toBeVisible();
  await expect(close).toBeDisabled();
  await page.getByRole("button", { name: "Consultar novamente" }).click();
  await expect(close).toBeEnabled();
  expect(posts).toBe(1);
  expect(reads).toBe(2);
});
