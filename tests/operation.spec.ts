import {test,expect,type Page} from '@playwright/test';
const process={id:7,contemplacaoId:4,responsavelId:9,status:'EM_PROCESSO_DE_BAIXA',criadoEm:'2026-10-29T10:00:00',atualizadoEm:'2026-10-29T10:00:00'};
async function session(page:Page,role='ADMINISTRADOR'){await page.addInitScript(role=>{localStorage.setItem('token','header.'+btoa(JSON.stringify({uid:9}))+'.signature');localStorage.setItem('refreshToken','refresh');localStorage.setItem('userType',role);},role);}
test('rotas operacionais respeitam perfis',async({page})=>{await session(page,'CLIENTE');await page.goto('/admin/baixas');await expect(page.getByRole('heading',{name:'Acesso restrito',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Concluir baixa'})).toHaveCount(0);});
test('funcionário não acessa faturamento ou configuração global de canais', async ({ page }) => {
  await session(page, 'FUNCIONARIO');
  await page.route('**/api/**', route => route.fulfill({ json: { items: [], total: 0, page: 0, size: 20 } }));
  await page.goto('/app/upgrade');
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole('link', { name: 'Assinatura' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Canais internos' })).toHaveCount(0);

  await page.goto('/admin/canais');
  await expect(page.getByRole('heading', { name: 'Acesso restrito', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Canais internos' })).toHaveCount(0);
});
test('baixa consulta, confirma uma vez e mostra comprovante',async({page})=>{await session(page);let count=0;await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('/pagina'))return route.fulfill({json:{items:[process],page:0,total:1,size:20}});if(url.endsWith('/baixa')){count++;expect(route.request().postDataJSON()).toEqual({usuarioId:9,observacao:'Conferido'});return route.fulfill({json:{id:3,processoId:7,usuarioId:9,data:'2026-10-29T11:00:00',observacao:'Conferido'}});}return route.fulfill({json:process});});await page.goto('/admin/baixas');await page.getByRole('button',{name:'Conferir processo #7'}).click();await page.getByLabel('Observação da baixa').fill('Conferido');await page.getByRole('button',{name:'Concluir baixa',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancelar',exact:true}).click();expect(count).toBe(0);await page.getByRole('button',{name:'Concluir baixa',exact:true}).click();await page.getByRole('button',{name:'Confirmar baixa',exact:true}).click();await expect(page.getByText('Baixa registrada #3')).toBeVisible();expect(count).toBe(1);await expect(page.getByRole('button',{name:'Concluir baixa',exact:true})).toHaveCount(0);});
test('serviço ausente e processo cancelado não permitem baixa',async({page})=>{await session(page);await page.route('**/api/**',route=>route.request().url().includes('/pagina')?route.fulfill({status:404,json:{}}):route.fulfill({json:{...process,status:'CANCELADO'}}));await page.goto('/admin/baixas');await expect(page.getByText(/aguardando a integração/)).toBeVisible();await page.getByLabel('ID do processo',{exact:true}).fill('7');await page.getByRole('button',{name:'Consultar processo',exact:true}).click();await expect(page.getByText(/não está na etapa de baixa/)).toBeVisible();await expect(page.getByRole('button',{name:'Concluir baixa'})).toHaveCount(0);});
test('auditoria mantém os registros legíveis em cartões no celular',async({page})=>{await session(page);await page.setViewportSize({width:320,height:740});await page.route('**/api/auditoria/**',route=>route.fulfill({json:{items:[{id:1,data:'2026-10-29T11:00:00',acao:'Baixa concluída',usuarioNome:'Julio',entidade:'Processo',registroId:7}],total:1,page:0,size:20}}));await page.goto('/admin/auditoria');await expect(page.getByRole('cell',{name:'Baixa concluída'})).toBeVisible();await expect(page.getByRole('table').locator('tbody')).toHaveCSS('display','grid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('comunicação pede confirmação e exibe histórico do processo',async({page})=>{await session(page);await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('historico'))return route.fulfill({json:{items:[{id:1,data:'2026-10-29T11:00:00',canal:'EMAIL',status:'SUCESSO',usuarioNome:'Julio'}],total:1,page:0,size:100}});if(url.includes('/pagina'))return route.fulfill({json:{items:[{processoId:7,statusProcesso:process.status,comunicacao:{statusGeral:'PENDENTE',email:null,whatsapp:null}}],total:1,page:0,size:20}});return route.fulfill({json:process});});await page.goto('/admin/comunicacao');await page.getByRole('button',{name:'Notificar',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByRole('link',{name:'Processo #7',exact:true}).click();await page.getByLabel('ID do processo',{exact:true}).fill('7');await page.getByRole('button',{name:'Consultar',exact:true}).click();await expect(page.getByRole('heading',{name:'Histórico de comunicações'})).toBeVisible();await expect(page.getByText('Email · Sucesso')).toBeVisible();});
test('tela inicial e operação funcionam no celular',async({page})=>{await session(page);await page.setViewportSize({width:390,height:844});await page.route('**/api/**',route=>route.fulfill({status:501,json:{}}));for(const url of ['/','/admin/baixas','/admin/auditoria','/admin/comunicacao','/admin/disparo-manual']){await page.goto(url);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBe(true);}await page.goto('/');await expect(page.getByRole('heading',{name:'Seu espaço, sem complicação.'})).toBeVisible();await page.screenshot({path:'../../outputs/tela-inicial-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'../../outputs/tela-inicial-desktop.png',fullPage:true});});

test('cadastros de consórcio consultam e salvam alterações',async({page})=>{await session(page);let name='Consórcio inicial';let updates=0;await page.route('**/api/**',route=>{const url=route.request().url();if(url.includes('/consorcios/1')){if(route.request().method()==='PUT'){updates++;name=route.request().postDataJSON().nome;}return route.fulfill({json:{id:1,nome:name,tipoId:2,tipoNome:'Veículos'}});}if(url.includes('/tipos-consorcio'))return route.fulfill({json:{items:[{id:2,nome:'Veículos'}],total:1,page:0,size:20}});return route.fulfill({json:{items:[{id:1,nome:name,tipoId:2,tipoNome:'Veículos'}],total:1,page:0,size:20}});});await page.goto('/admin/cadastros');await expect(page.getByRole('cell',{name:'Consórcio inicial',exact:true})).toBeVisible();await page.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Consórcio atualizado');await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByText('Cadastro salvo.')).toBeVisible();await expect(page.getByRole('cell',{name:'Consórcio atualizado',exact:true})).toBeVisible();expect(updates).toBe(1);});

test('disparo manual seleciona processo, envia WhatsApp personalizado e exibe histórico',async({page})=>{
  await session(page,'FUNCIONARIO');
  let whatsappPayload:unknown=null;
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
  expect(whatsappPayload).toEqual({telefone:'5511999998888',mensagem:'Olá! Seu consórcio CONT-77 foi contemplado.'});
  await expect(page.getByText(/Disparo manual de WhatsApp confirmado para o processo #7/).first()).toBeVisible();
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
