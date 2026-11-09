# ConsorTech — Front-end

Interface web da plataforma **ConsorTech**, desenvolvida com **React 19**, **TypeScript** e **Vite** para apoiar a comunicação ativa, o acompanhamento operacional e a baixa de clientes contemplados em consórcios, além da gestão multitenant de contas parceiras, canais de atendimento (WhatsApp e Gmail), identidade visual e widget incorporável.

> **Contexto do Projeto:** Solução desenvolvida no âmbito do Projeto Integrador do **SENAI**, em parceria com a empresa **F M C CENTER CAR LTDA**, priorizando rastreabilidade das comunicações, clareza operacional e integração real com o Back-end Spring Boot.

---

## Sumário

1. [Visão Geral e Objetivos](#1-visão-geral-e-objetivos)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura e Estrutura de Diretórios](#3-arquitetura-e-estrutura-de-diretórios)
4. [Módulos e Mapa de Rotas](#4-módulos-e-mapa-de-rotas)
5. [Pré-requisitos e Variáveis de Ambiente](#5-pré-requisitos-e-variáveis-de-ambiente)
6. [Como Executar o Projeto](#6-como-executar-o-projeto)
7. [Autenticação, Sessão e Login com Google](#7-autenticação-sessão-e-login-com-google)
8. [Qualidade, Build e Testes Automatizados (E2E)](#8-qualidade-build-e-testes-automatizados-e2e)
9. [Padrões de Contribuição e Versionamento](#9-padrões-de-contribuição-e-versionamento)
10. [Documentação Complementar](#10-documentação-complementar)

---

## 1. Visão Geral e Objetivos

O **ConsorTech Front-end** reúne três frentes integradas em uma única aplicação SPA (*Single Page Application*) responsiva, com suporte nativo a **tema claro e escuro**:

- **Operação de Consórcios (`/admin/*`):** painel operacional para administradores e funcionários acompanharem a fila de contemplações recebidas, executarem **disparo manual personalizado por WhatsApp** ou reenvio multicanal, consultarem histórico de comunicações, gerenciarem cadastros (consórcios, grupos, cotas e usuários), conferirem baixas pendentes e auditarem eventos.
- **Workspace SaaS por Conta (`/app/*`):** ambiente dedicado às empresas parceiras para conexão de instâncias WhatsApp (via QR Code), configuração de remetentes Gmail verificados, gestão de membros da equipe, personalização de marca (cores e logotipo), geração de snippet do **Widget Parceiro** e gerenciamento de assinatura (Pix ou Cartão via Stripe / simulação controlada).
- **Portal do Consorciado (`/portal`):** área exclusiva para clientes contemplados acompanharem o andamento do processo, etapas concluídas, documentos necessários e histórico de atualizações.

---

## 2. Stack Tecnológica

| Categoria | Tecnologia | Versão / Detalhes |
| :--- | :--- | :--- |
| **Biblioteca de UI** | React + React DOM | `^19.2.4` |
| **Linguagem** | TypeScript | `~5.9.3` (Tipagem estrita) |
| **Bundler e Dev Server** | Vite | `^8.0.0` (Proxy `/api` integrado) |
| **Roteamento** | React Router DOM | `^7.14.0` (Rotas protegidas por perfil) |
| **Ícones e Tipografia** | Lucide React + `@fontsource/inter` | `^1.16.0` / `^5.2.8` |
| **Análise Estática (Lint)** | Oxlint | `^1.56.0` (`react`, `typescript`, `import`) |
| **Testes End-to-End (E2E)** | Playwright Test | `^1.59.1` (Desktop, Tablet e Mobile) |
| **Servidor de Produção** | Nginx (Container Docker) | Proxy reverso e entrega estática otimizada |

---

## 3. Arquitetura e Estrutura de Diretórios

```text
front-end/
├── public/                     # Ativos públicos estáticos e script do widget (widget-parceiro.js)
├── src/
│   ├── components/             # Componentes reutilizáveis de layout, dados e operação
│   │   ├── AdminShell.tsx      # Layout estrutural da operação administrativa
│   │   ├── AssistantWidget.tsx # Assistente operacional integrado com confirmação de ações
│   │   ├── AuthShell.tsx       # Layout unificado das telas de autenticação
│   │   ├── CommunicationQueue.tsx # Fila paginada de comunicações e status por canal
│   │   ├── ConfirmDialog.tsx   # Modal acessível de confirmação para ações críticas
│   │   ├── DataUi.tsx          # Estados de carregamento (Skeleton), vazio, erro e paginação
│   │   ├── OperationHistory.tsx# Histórico cronológico de comunicações por processo
│   │   └── ProcessPicker.tsx   # Seletor e diretório compartilhado de processos contemplados
│   ├── hooks/                  # Hooks customizados (useResource, useDebouncedValue)
│   ├── pages/                  # Páginas da aplicação organizadas por domínio
│   │   ├── Landing.tsx         # Página institucional e início do teste gratuito
│   │   ├── Login.tsx           # Autenticação por credenciais locais ou Google OAuth
│   │   ├── Register.tsx        # Cadastro de conta em duas etapas e vínculo Google
│   │   ├── ForgotPassword.tsx  # Recuperação de senha com código temporário (5 min)
│   │   ├── PlatformApp.tsx     # Workspace SaaS (/app/*: visão geral, canais, marca, equipe)
│   │   ├── ManualDispatch.tsx  # Disparo manual de WhatsApp, prévia em tempo real e testes
│   │   ├── Contemplated.tsx    # Detalhes da contemplação, status e histórico do processo
│   │   ├── Closures.tsx        # Conferência e conclusão de baixas pendentes
│   │   ├── Communication.tsx   # Acompanhamento da fila de comunicações
│   │   ├── AdminChannels.tsx   # Configuração de canais internos da operação
│   │   ├── Registries.tsx      # CRUD de consórcios, tipos, grupos, cotas e usuários
│   │   ├── Audit.tsx           # Consulta paginada de trilha de auditoria
│   │   ├── BeneficiaryPortal.tsx # Portal de acompanhamento do cliente contemplado
│   │   └── WidgetChat.tsx      # Interface compacta do widget incorporável para parceiros
│   ├── routes/                 # Definição central de rotas e guardas de permissão (RoleRoute)
│   ├── services/               # Camada de comunicação HTTP, autenticação JWT e formatação
│   │   ├── auth.ts             # Login, registro, OAuth Google e renovação única de sessão
│   │   ├── backend.ts          # Cliente tipado dos endpoints operacionais (/api/*)
│   │   ├── platform.ts         # Cliente tipado dos endpoints SaaS (/api/platform/*)
│   │   ├── http.ts             # Tratamento padronizado de respostas HTTP e erros (ApiError)
│   │   └── format.ts           # Normalização e formatação de telefones, datas e status
│   ├── design-system.css       # Tokens visuais, componentes operacionais e responsividade
│   ├── platform.css            # Estilos da landing page e workspace SaaS
│   └── auth-entry.css          # Estilos das telas de login, cadastro e recuperação
├── tests/                      # Suíte de testes E2E do Playwright
├── Dockerfile                  # Build multi-stage com Node.js e Nginx
├── docker-compose.yml          # Orquestração containerizada do Front-end
├── playwright.config.ts        # Configuração de execução dos testes de interface
└── vite.config.ts              # Configuração do Vite e proxy de desenvolvimento (/api -> :8080)
```

---

## 4. Módulos e Mapa de Rotas

| Rota | Perfis Permitidos | Finalidade |
| :--- | :--- | :--- |
| `/` | Público | Apresentação institucional do ConsorTech e início do teste gratuito |
| `/login` | Público | Entrada com e-mail/senha ou conta Google |
| `/register` | Público | Criação de espaço da empresa por e-mail ou Google OAuth |
| `/forgot-password` | Público | Solicitação de código de recuperação (5 min) e redefinição de senha |
| `/widget` | Público (Token parceiro) | Widget incorporável para consulta e atendimento em sistemas parceiros |
| `/app` | Autenticado | Diretório de clientes (Administrador) ou visão geral da conta (Cliente/Equipe) |
| `/app/integracoes` | Autenticado | Central de canais conectados da conta (`WhatsApp`, `Gmail`, `Widget`) |
| `/app/whatsapp` | Autenticado | Gestão de instâncias WhatsApp, leitura de QR Code e reconexão |
| `/app/gmail` | Autenticado | Cadastro e verificação de remetentes Gmail da empresa |
| `/app/widget` | `ADMINISTRADOR`, `CLIENTE` | Configuração de origem permitida, chave e código de incorporação do widget |
| `/app/equipe` | Autenticado | Gerenciamento de membros da equipe, busca e paginação |
| `/app/marca` | `ADMINISTRADOR`, `CLIENTE` | Personalização de nome da marca, logotipo e paleta de cores |
| `/app/assinatura`, `/app/upgrade` | `ADMINISTRADOR`, `CLIENTE` | Acompanhamento do plano atual e ampliação via Pix ou Cartão |
| `/app/perfil` | Autenticado | Atualização de foto e nome do usuário logado |
| `/admin/dashboard` | `ADMINISTRADOR`, `FUNCIONARIO` | Indicadores operacionais de contemplações, fila e baixas |
| `/admin/contemplados` | `ADMINISTRADOR`, `FUNCIONARIO` | Busca de processos pelo cliente/contato, atualização de etapa e histórico |
| `/admin/disparo-manual` | `ADMINISTRADOR`, `FUNCIONARIO` | Disparo manual personalizado via WhatsApp com modelos, prévia e envio de teste |
| `/admin/baixas` | `ADMINISTRADOR`, `FUNCIONARIO` | Conferência e encerramento confirmado de processos em etapa de baixa |
| `/admin/comunicacao` | `ADMINISTRADOR`, `FUNCIONARIO` | Fila paginada de comunicações com filtros por status e reenvio |
| `/admin/cadastros` | `ADMINISTRADOR`, `FUNCIONARIO` | Gestão de Consórcios, Tipos de Consórcio, Grupos, Cotas e Clientes |
| `/admin/canais` | `ADMINISTRADOR` | Canais internos de WhatsApp e Gmail utilizados pela operação |
| `/admin/usuarios` | `ADMINISTRADOR` | Administração de contas de usuários e redefinição de senhas |
| `/admin/auditoria` | `ADMINISTRADOR`, `FUNCIONARIO` | Registro cronológico de eventos e ações operacionais |
| `/portal` | `CLIENTE` | Acompanhamento de processos contemplados, documentos e histórico pelo consorciado |

---

## 5. Pré-requisitos e Variáveis de Ambiente

### Pré-requisitos para execução local (sem Docker)
- **Node.js** `20.x` ou superior (recomendado LTS) e **npm**.
- **Back-end ConsorTech** em execução em `http://localhost:8080` conectado ao **MySQL 8.0** (`127.0.0.1:3306/senai`).

### Configuração de ambiente (`.env`)
Copie o arquivo `.env.example` para `.env` na raiz do repositório `front-end`:

```powershell
Copy-Item .env.example .env
```

Variáveis suportadas:

| Variável | Obrigatória | Valor Padrão (Dev) | Descrição |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Não | `""` (usa proxy `/api` -> `http://localhost:8080`) | URL base da API quando hospedada em endereço distinto |
| `VITE_GOOGLE_CLIENT_ID` | Opcional | — | Client ID OAuth 2.0 (*Web application*) do Google Cloud para login/cadastro social |

> **Segurança:** Nunca insira chaves privadas, senhas de banco ou segredos de servidor em variáveis `VITE_*`, pois variáveis de ambiente do Vite são expostas no pacote compilado do navegador.

---

## 6. Como Executar o Projeto

### Opção A — Docker Compose Completo (Recomendado para Equipe)

Com os repositórios `Front-End` e `Back-end` clonados lado a lado, execute na pasta `Back-end`:

```powershell
docker compose --profile full up --build -d --wait --wait-timeout 600
```

Ou utilize o script `./start.ps1` no `Back-end`. Este comando inicializa Front-end (`:5173`), API Spring Boot (`:8080`), MySQL, Evolution API, PostgreSQL e Redis.

Caso o Back-end já esteja ativo localmente na porta `8080`, você pode subir apenas o container do Front-end nesta pasta:

```powershell
docker compose up --build -d --wait --wait-timeout 600
```

### Opção B — Ambiente de Desenvolvimento Local (Vite)

Com o Back-end rodando em `http://localhost:8080`:

```powershell
npm ci
npm run dev
```

Acesse `http://localhost:5173`. O servidor do Vite encaminha automaticamente todas as chamadas `/api/*` para `http://localhost:8080`.

---

## 7. Autenticação, Sessão e Login com Google

- **Renovação Concorrente de Token:** O cliente HTTP (`src/services/backend.ts` e `src/services/auth.ts`) intercepta respostas `401 Unauthorized` e executa uma única chamada de renovação (`POST /api/auth/refresh`) compartilhada entre requisições simultâneas, evitando desconexões prematuras.
- **Fluxo OAuth Google:**
  - Em `/login`, contas Google já vinculadas entram diretamente na plataforma; contas novas são direcionadas para confirmação do nome da empresa antes de criar o espaço.
  - Em `/register`, o botão **Fazer Cadastro com o Google** autentica a identidade Google e solicita apenas o nome da empresa na etapa **Quase lá** para concluir o provisionamento da conta com 3 dias de avaliação gratuita.

---

## 8. Qualidade, Build e Testes Automatizados (E2E)

Execute os comandos abaixo na raiz do projeto para validar código, tipagem, compilação e fluxos de interface:

```powershell
# 1. Análise estática (Oxlint — 0 erros permitidos)
npm run lint

# 2. Verificação de tipos TypeScript e build de produção (gera a pasta dist/)
npm run build

# 3. Suíte completa de testes End-to-End com Playwright (porta isolada 5174)
npm run test:ui
```

### Teste Integrado com Back-end e MySQL (`tests/live.spec.ts`)
Para executar também o teste de integração real ponta a ponta até o banco de dados MySQL, informe um token JWT de administrador válido na variável `SYSTEMX_TEST_TOKEN`:

```powershell
$login = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@consortech.com","senha":"SUA_SENHA_LOCAL"}'
$env:SYSTEMX_TEST_TOKEN = $login.token
npx playwright test
```

---

## 9. Padrões de Contribuição e Versionamento

1. **Sincronização antes de iniciar:** sempre execute `git fetch --all --prune` e atualize `main` e `develop` antes de criar uma nova branch.
2. **Branches:** crie branches temáticas a partir de `develop` (`feat/...`, `fix/...`, `docs/...`, `refactor/...`).
3. **Commits semânticos e atômicos:** utilize mensagens claras em português (`feat:`, `fix:`, `docs:`, `style:`, `test:`, `refactor:`).
4. **Validação obrigatória antes de Pull Request:** confirme que `npm run lint`, `npm run build` e `npm run test:ui` passam integralmente.

---

## 10. Documentação Complementar

- [Contrato de Operação e Endpoints (`CONTRATO_OPERACAO.md`)](CONTRATO_OPERACAO.md)
- [Entrega e Validações do Front-end (`ENTREGA_FRONTEND.md`)](ENTREGA_FRONTEND.md)
- [Relatório da Plataforma e Validações (`RELATORIO_PLATAFORMA.md`)](RELATORIO_PLATAFORMA.md)
- [Checklist de Evolução da Interface (`CHECKLIST_FRONTEND.md`)](CHECKLIST_FRONTEND.md)
