# ConsorTech — Front-end

Interface de gestão de consórcios do SystemX, construída com React 19, TypeScript e Vite. Inclui painel operacional, consultas de contemplados e clientes, gestão de usuários, integrações Gmail/Evolution e portal do contemplado.

## Desenvolvimento

```bash
npm ci
npm run dev -- --port 5174 --strictPort
```

Abra `http://localhost:5174`. A porta 5174 é usada nesta revisão porque a 5173 estava ocupada por outro projeto. O proxy Vite encaminha `/api` para o Spring Boot em `http://localhost:8080`.

Para outro servidor, configure `VITE_API_URL` conforme `.env.example`. Essa variável faz parte do bundle público: não inclua credenciais nela. O backend requer Java 17+, Maven e MySQL; consulte o projeto irmão `Back-end/senai`.

## Rotas e funcionalidades

| Rota | Funcionalidade |
| --- | --- |
| `/login`, `/register` | Autenticação e cadastro de funcionário, com validação e feedback |
| `/admin/dashboard` | Indicadores e registros recentes da fila de comunicação |
| `/admin/contemplados` | Consulta de processo por ID, status de cada canal e reenvio com confirmação |
| `/admin/clientes` | Contas de perfil CLIENTE, com busca e paginação local |
| `/admin/usuarios` | Listagem com busca e paginação; criação de funcionário para administrador |
| `/admin/auditoria` | Estado de indisponibilidade: o servidor ainda não oferece consulta de auditoria |
| `/integracoes` | Navegação pelos canais e orientações do fluxo |
| `/integracoes/gmail` | Configuração de remetente e senha de aplicativo via API, restrita a administrador |
| `/integracoes/whatsapp` | Geração de QR e consulta da instância Evolution, restritas a administrador |
| `/integracoes/notificacoes` | Recebimento de contemplação, fila, filtros, paginação e envio individual |
| `/portal` | Área de CLIENTE; abas de processo, documentos e histórico aguardam consultas vinculadas à conta |

As áreas administrativas e de integração aceitam ADMINISTRADOR e FUNCIONARIO. CLIENTE é direcionado ao portal. As verificações do React orientam a navegação; a autorização efetiva de cada operação pertence ao servidor. Em HTTP 401, a sessão local é removida e a interface retorna ao login.

## Contratos de integração

| Recurso | Método e rota |
| --- | --- |
| Autenticação | `POST /api/auth/login`, `/api/auth/logout` |
| Usuários | `GET/POST /api/usuarios` |
| Consórcios e cotas | `GET/POST /api/consorcios`, `/api/cotas` |
| Processo | `GET /api/processos-contemplacao/{id}` |
| Atualização de status | `PATCH /api/processos-contemplacao/{id}/status` |
| Receber contemplação | `POST /api/integracoes/contemplacoes`, com `X-Integration-Key` |
| Fila | `GET /api/integracoes/comunicacoes/fila` |
| Comunicação | `GET /api/integracoes/processos/{id}/comunicacao` |
| Envio/reenvio | `POST /api/integracoes/processos/{id}/comunicacao/reenvio` |
| Envio de WhatsApp por processo | `POST /api/integracoes/processos/{id}/comunicacao/whatsapp` |
| Baixa | `GET/POST /api/integracoes/processos/{id}/baixa` |
| Configuração Gmail | `PUT /api/configuracoes/email` |
| QR Evolution | `POST /api/integracoes/whatsapp/qr`, com `{ instanceName }` |
| Estado Evolution | `GET /api/integracoes/whatsapp/status?instanceName=...` |

Os DTOs estão em `src/services/backend.ts`. `src/services/http.ts` padroniza timeout, erros de conexão e respostas HTTP. IDs são inteiros positivos; valores de crédito têm até duas casas decimais; datas de contemplação usam `YYYY-MM-DD`; telefones são exibidos com máscara e enviados apenas com dígitos.

Não há CPF/CNPJ nos DTOs disponíveis, portanto esses campos não são inventados nos formulários. A consulta de clientes filtra os usuários com perfil CLIENTE; ela não substitui um cadastro completo de pessoa física/jurídica.

Os indicadores do dashboard representam **somente processos presentes na fila de comunicação**. Um canal pode aceitar o envio e outro falhar. A interface apresenta o resultado de cada um, sem afirmar que o destinatário leu ou recebeu a mensagem.

## Design e acessibilidade

O seletor Claro/Escuro está disponível em todas as telas. A preferência fica salva apenas no navegador (`systemx-theme`); no primeiro acesso, é usada a preferência do dispositivo. A escolha é aplicada antes da montagem do React para evitar flash do tema oposto.

O cadastro inclui confirmação de senha, orientação de comprimento, validação de divergência e feedback ao concluir. A confirmação é validada no cliente e não faz parte do DTO enviado ao backend.

- `src/design-system.css`: cores, tipografia Inter empacotada localmente, superfícies, foco, interação e responsividade.
- `src/index.css`: estrutura de layout e estilos anteriores reutilizados.
- `DataUi`: paginação, skeletons, estados vazios e erros com retentativa.
- `ConfirmDialog`: diálogo nativo com foco, Escape e confirmação de reenvio.
- `ToastProvider` e `InlineFeedback`: feedback de operações e falhas.
- Preferência de redução de movimento respeitada em animações e transições.

## Verificação

```bash
npm run lint
npm run build
npm run test:ui
```

Os testes de navegador iniciam/reutilizam a porta 5174 e usam Microsoft Edge instalado. Para Chromium, instale o navegador do Playwright e defina `PLAYWRIGHT_CHANNEL=chromium`.

`tests/interface.spec.ts` usa respostas controladas para validar navegação, desktop/mobile, busca, paginação, payloads e erros sem enviar mensagens reais. `tests/live.spec.ts` consulta a API real, sem interceptação, quando `SYSTEMX_TEST_TOKEN` contém o token de uma sessão de teste autorizada. Esse teste não modifica registros e exige backend/MySQL ativos. O token não deve ser versionado.

Capturas e traces ficam em `test-results/`, fora do Git. O relatório da revisão e as dependências restantes estão em [docs/REVISAO_FRONTEND.md](docs/REVISAO_FRONTEND.md).

## Dependências ainda abertas

A API não fornece consulta de auditoria nem vínculo de processos, documentos e histórico ao cliente autenticado. Não há edição/exclusão de usuários no contrato. Gmail e Evolution precisam estar configurados no servidor para validar entrega real. Configurações de Gmail são mantidas em memória pelo backend atual.

O backend também permite cadastro público de usuário: a interface solicita apenas perfil FUNCIONARIO, mas a política de atribuição de privilégios precisa ser garantida no servidor. Os tokens de sessão são mantidos em localStorage conforme a arquitetura existente; migrar para cookies HttpOnly depende de suporte do backend.
