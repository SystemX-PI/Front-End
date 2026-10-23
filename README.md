# ConsorTech — Front-end

Aplicação web para apoiar a gestão de consórcios. O front-end separa o Portal
do Contemplado, a área administrativa e as telas existentes de integração e
comunicação.

## Objetivo

Este repositório contém somente o front-end. A aplicação apresenta as
interfaces e envia requisições à API; regras de negócio, persistência,
permissões reais e dados de operação dependem do backend. O projeto irmão
`Back-end/senai` fornece a documentação e os controladores usados para
identificar os contratos atualmente disponíveis.

## Tecnologias

- React 19 e React DOM
- TypeScript
- Vite
- React Router
- Tailwind CSS (plugin do Vite) e CSS global
- Lucide React para ícones
- Oxlint

## Pré-requisitos

- Node.js compatível com a versão de Vite definida no `package-lock.json`
- npm
- Backend Spring Boot disponível para testar funcionalidades que dependem da API

## Instalação e execução

Na pasta deste projeto:

```bash
npm install
npm run dev
```

O Vite informa no terminal o endereço local para abrir no navegador. Para
compilar e visualizar a versão de produção:

```bash
npm run build
npm run preview
```

## Variável de ambiente e backend

`VITE_API_URL` define a origem base da API e deve ser uma URL sem barra final.
O arquivo `.env.example` contém um valor ilustrativo. Para desenvolvimento
local usando o proxy do Vite, deixe `VITE_API_URL` sem definição: as chamadas
relativas a `/api` são encaminhadas para `http://localhost:8080`, conforme
`vite.config.ts`.

Se `VITE_API_URL` estiver configurada, as chamadas usam essa origem diretamente
e não passam pelo proxy local. Variáveis com prefixo `VITE_` são incorporadas ao
bundle público; não coloque senhas, tokens ou outras credenciais nelas.

Este repositório não contém instruções para instalar ou iniciar o backend. As
operações de API só podem ser verificadas com um backend compatível e
disponível.

## Estrutura atual

```text
.
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── AuthShell.tsx
│   │   ├── AdminShell.tsx
│   │   ├── BrandLogo.tsx
│   │   ├── IntegrationShell.tsx
│   │   └── IntegrationUi.tsx
│   ├── pages/
│   │   ├── Audit.tsx
│   │   ├── BeneficiaryPortal.tsx
│   │   ├── Clients.tsx
│   │   ├── Contemplated.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GmailIntegration.tsx
│   │   ├── IntegrationsOverview.tsx
│   │   ├── Login.tsx
│   │   ├── Notifications.tsx
│   │   ├── Register.tsx
│   │   ├── Users.tsx
│   │   └── WhatsAppIntegration.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── auth.ts
│   │   └── backend.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig*.json
├── vercel.json
└── vite.config.ts
```

`Dashboard.tsx` usa `AdminShell` no painel administrativo. `header.tsx` é um
componente legado que não está conectado às rotas; as áreas administrativas e
de integração utilizam seus próprios layouts compartilhados.

## Rotas

| Rota | Acesso | Comportamento |
| --- | --- | --- |
| `/` | Público | Direciona para o portal ou painel com base no tipo salvo da sessão; sem sessão, abre login |
| `/login` | Público | Formulário de autenticação |
| `/register` | Público | Cadastro público solicitando perfil FUNCIONARIO |
| `/portal` | CLIENTE | Portal do Contemplado, com abas e estados explícitos para dados ainda não disponíveis |
| `/dashboard`, `/admin` | ADMINISTRADOR ou FUNCIONARIO | Alias para o dashboard administrativo |
| `/admin/dashboard` | ADMINISTRADOR ou FUNCIONARIO | Painel administrativo; métricas aguardam API agregada |
| `/admin/contemplados` | ADMINISTRADOR ou FUNCIONARIO | Consulta individual de processo por ID e operações de comunicação existentes |
| `/admin/clientes` | ADMINISTRADOR ou FUNCIONARIO | Estado vazio: não há API de clientes |
| `/admin/usuarios` | ADMINISTRADOR ou FUNCIONARIO | Lista usuários da API; criação de funcionário disponível apenas para administrador na interface |
| `/admin/auditoria` | ADMINISTRADOR ou FUNCIONARIO | Estado vazio: não há endpoint de consulta de auditoria |
| `/integracoes` | ADMINISTRADOR ou FUNCIONARIO | Visão geral das áreas de integração |
| `/integracoes/gmail` | ADMINISTRADOR ou FUNCIONARIO | Configuração de envio de e-mail |
| `/integracoes/whatsapp` | ADMINISTRADOR ou FUNCIONARIO | Limitações e informações da integração |
| `/integracoes/notificacoes` | ADMINISTRADOR ou FUNCIONARIO | Envio de evento de contemplação para integração |

Rotas desconhecidas redirecionam para `/`. A proteção de perfil é no cliente e
não substitui autorização de cada operação no backend. Respostas HTTP 401 das
chamadas do serviço principal limpam a sessão local e retornam o usuário ao
login.

O cadastro público atual cria somente contas FUNCIONARIO pela interface. O
acesso ao Portal exige uma conta CLIENTE provisionada separadamente; não existe
fluxo de cadastro de cliente nem associação de processo à conta na API atual.

## Autenticação e serviços

`src/services/auth.ts` faz login em `POST /api/auth/login`, cadastro em
`POST /api/usuarios` e logout em `POST /api/auth/logout`. O login envia
`email` e `senha`; o cadastro envia `nome`, `email`, `senha` e `tipo`.

O token, o refresh token, o tipo de usuário e o e-mail são armazenados no
`localStorage`. Isso mantém a sessão entre recargas, mas deixa o token acessível
a JavaScript executado na origem. A troca por cookies HttpOnly exigiria suporte
compatível no backend e não foi feita neste front-end.

`src/services/backend.ts` centraliza tipos e chamadas adicionais, incluindo
configuração de Gmail, recebimento de contemplação, usuários, consórcios, cotas
e operações de processo/comunicação. Os controladores do backend disponível
fornecem consultas individuais de processo, mas não listagem geral.

## Funcionalidades e situação atual

| Funcionalidade | Situação |
| --- | --- |
| Login e cadastro ligados à API | **Implementada**, depende do backend e dos contratos de autenticação |
| Portal do Contemplado e separação de rotas por tipo de conta | **Parcialmente implementada**; o portal tem navegação, mas não há API que associe processos e documentos ao cliente autenticado |
| Painel administrativo e navegação | **Parcialmente implementada**; rotas e layout existem, mas indicadores de processos exigem uma API agregada |
| Consulta de contemplados | **Parcialmente implementada**; permite consultar processo por ID, mas não lista nem pesquisa clientes |
| Clientes e auditoria | **Pendente por dependência do backend**; não há endpoints de listagem/cadastro de clientes ou leitura de auditoria |
| Usuários | **Parcialmente implementada**; listagem e criação de funcionário usam `/api/usuarios`; ativação, edição e remoção não estão disponíveis |
| Proteção de rotas por perfil | **Implementada no cliente**, não é autorização de servidor |
| Visão geral das integrações | **Implementada** como navegação e apresentação; não consulta o estado dos canais |
| Configuração Gmail na interface | **Não implementada**; o backend envia e-mails usando configuração do servidor, mas não fornece endpoint para alterar ou consultar credenciais |
| Configuração de WhatsApp pela interface | **Não implementada**; a tela deixa explícita a ausência de criação de instância, consulta de conexão e QR Code |
| Envio de WhatsApp por processo | **Parcialmente implementado** no serviço como chamada de API; não há fluxo de configuração ou interface conectada nesta tela |
| Recebimento de evento de contemplação | **Implementado no cliente** via `POST /api/integracoes/contemplacoes`; requer chave de integração configurada pelo backend |
| Listagem da fila de comunicações | **Pendente por dependência do backend**; não há rota GET para a fila nos controladores/documentação disponíveis |
| Solicitação individual de comunicação/reenvio | **Parcialmente implementada** via operações por ID; resposta do endpoint não é considerada confirmação de entrega |
| Dashboard administrativo | **Parcialmente implementado**; apresenta estado indisponível em vez de inventar métricas |

O recebimento de contemplação usa `POST /api/integracoes/contemplacoes` e o
formulário pede os dados da integração. A API exige `X-Integration-Key`; a
chave configurada no backend não é preenchida automaticamente pelo front-end.
A resposta do recebimento fornece o ID do processo para consulta posterior.
O backend atual não possui a rota de fila anteriormente presumida pelo
front-end; por isso a interface não tenta mais consultar `/api/integracoes/comunicacoes/fila`.

A tela administrativa permite procurar processo pelo ID, consultar sua
comunicação e solicitar reenvio. A resposta do endpoint não é tratada como
confirmação de entrega. A baixa existe como operação individual no backend, mas
não é oferecida na tabela: não há listagem de processos nem identificação
confiável do usuário autenticado para preencher a requisição de baixa.

O backend executa envio pelo Gmail e lê as configurações de servidor
`MAIL_ENABLED`, `MAIL_USERNAME` e `MAIL_PASSWORD`. A interface não pede nem
envia credenciais, pois não foi encontrada rota para editar ou consultar essa
configuração. Configure segredos apenas no ambiente protegido do backend.

O backend disponível possui envio de WhatsApp para processo, mas não possui
criação de instância ou geração de QR Code. A interface não fabrica QR Code ou
estado de conexão. O portal também não tem endpoints de documentos ou histórico
de cliente. A estrutura de auditoria existe internamente no backend, mas não há
endpoint de consulta demonstrado.

### Limitações de autorização conhecidas

As rotas administrativas e de cliente são distinguidas pela interface usando o
tipo retornado no login; essa decisão local não protege operações por si só. No
backend irmão inspecionado, a configuração de segurança exige autenticação para
as operações protegidas, mas também permite `POST /api/usuarios` sem
autenticação, e não foi encontrada autorização por perfil nos controladores
consultados. O cadastro público do front-end solicita somente perfil
FUNCIONARIO e a tela de gestão não oferece criação de administradores, mas uma
garantia real contra elevação de privilégios exige correção e validação no
backend. Não trate as proteções de rota do React como controle de segurança.

## Endpoints confirmados no backend disponível

As rotas verificadas nos controladores/documentação incluem login/logout,
criação e listagem de usuários, listagem/criação de consórcios e cotas, consulta
individual e atualização de status de processo, recebimento de contemplação,
consulta/reenvio de comunicação por processo e consulta/criação de baixa por
processo. Não foram encontrados endpoints de listagem agregada de processos,
clientes, documentos, histórico do cliente, auditoria ou fila de comunicação,
nem endpoint para editar configuração Gmail ou criar/consultar instância
WhatsApp.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Executa verificação TypeScript (`tsc -b`) e build de produção |
| `npm run lint` | Executa Oxlint |
| `npm run preview` | Serve a build de produção localmente |

Não há script de testes automatizados definido em `package.json`.
