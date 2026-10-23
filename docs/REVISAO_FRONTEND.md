# Revisão de frontend e integração — 23/10/2026

## Plano aplicado

1. Sincronizar os repositórios, preservando alterações locais.
2. Comparar as rotas React e serviços HTTP com os controladores, DTOs e migrations.
3. Unificar o visual de autenticação, administração, integrações e portal.
4. Conectar os recursos existentes, com estados de carregamento, erro e vazio.
5. Validar desktop/mobile, payloads e consultas reais ao banco.

## Sincronização

- Frontend atualizado de `f734836` para `ee13432` por fast-forward.
- Backend irmão atualizado de `0bff62a` para `9e51188` por fast-forward para conferir o contrato mais recente.
- Nenhum conflito ou alteração local anterior foi sobrescrito.
- A publicação desta revisão foi solicitada posteriormente pelo usuário; consulte o histórico dos dois repositórios para os commits correspondentes.

## Telas revisadas

| Área | Resultado |
| --- | --- |
| Login e cadastro | Visual claro com painel de marca, feedback de cadastro, bloqueio de submissão repetida, foco e validação |
| Dashboard | Indicadores reais da fila, registros recentes, atalhos e estados de erro/vazio |
| Clientes | Listagem de usuários CLIENTE com busca e paginação |
| Usuários | Busca por nome/e-mail/perfil, badges, paginação, skeleton e criação de funcionário |
| Contemplados | Consulta por identificador, filtro, skeleton, modal de confirmação e erro de cada canal |
| Auditoria | Estado explícito de indisponibilidade; não há endpoint de leitura |
| Integrações | Layout e cores compartilhados, descrições atualizadas e navegação para administração |
| Gmail | Formulário restrito a administrador; payload conforme DTO; senha removida após salvar e não persistida |
| WhatsApp | QR real via API, consulta de estado e mensagens de falha; QR ilustrativo removido |
| Notificações | Fila restaurada, busca/filtros/paginação, recebimento de evento e envio individual com diagnóstico |
| Portal | Abas e aparência revisadas; dados pessoais/processos não são inferidos sem vínculo fornecido pelo backend |

## Correção necessária no backend

`ConfiguracaoController` e `IntegrationController` registravam simultaneamente `PUT /api/configuracoes/email`, impedindo a inicialização consistente do Spring. A rota foi mantida apenas no controlador original, que configura o `EmailService` realmente usado no envio. A rota duplicada usava um serviço separado, desconectado desse fluxo. A dependência duplicada `spring-boot-starter-mail` também foi removida do POM.

Essa configuração confirma o armazenamento das credenciais em memória, não uma autenticação SMTP ou entrega. O frontend informa “Configurado nesta sessão”, e os erros efetivos de envio são exibidos na comunicação.

## Contratos e banco

Conferidos os DTOs de usuário, autenticação, consórcio, cota, processo, comunicação, contemplação, baixa, Gmail e Evolution. Conferidos os campos e limites das migrations V1–V6.

- IDs: inteiros positivos seguros para JavaScript.
- Crédito: número finito positivo, até 13 dígitos inteiros e duas casas decimais, compatível com DECIMAL(15,2).
- Datas de contemplação: string ISO de data civil, sem converter para timestamp.
- Telefones: máscara na entrada, somente dígitos no HTTP.
- Textos de contemplação: remoção de espaços nas extremidades e limite de 255 caracteres.
- CPF/CNPJ: ausentes do contrato; adicionar exige definir persistência e DTOs correspondentes.
- HTTP: mensagens claras para 400/401/403/404/409/422/429/500/502/503, falha de rede e timeout. Erros internos de HTTP 500 não são exibidos diretamente.

## Evidências de verificação

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- 12 testes de navegador, incluindo cadastro e persistência de tema, com 11 rotas verificadas em desktop/mobile.
- Inclui teste real frontend → Spring Boot → MySQL usando consulta somente leitura da fila e dos clientes.
- Backend Maven: 6 testes aprovados, incluindo o recebimento → fila → solicitação de comunicação.
- Inicialização real do Spring Boot: porta 8080; MySQL 8.0.46 conectado; 6 migrations validadas, schema em V6.
- Consultas reais de usuários, fila, consórcios e cotas: HTTP 200; nomes dos campos conferidos.
- OpenAPI ativo conferido: rotas de Gmail, fila e Evolution presentes.
- Gmail/Evolution: testes da interface usam respostas controladas; não foi feito disparo externo nem pareamento de aparelho nesta revisão.

## Cards do GitHub Projects

Quadro solicitado: https://github.com/orgs/SystemX-PI/projects/1

A API retornou `INSUFFICIENT_SCOPES`: a credencial do Git não tem `read:project`. O conector GitHub também não teve acesso ao repositório; a tentativa de leitura por navegador não pôde ser usada porque o serviço de automação está indisponível. O repositório Front-End retornou zero issues pela API autenticada.

Portanto, os títulos, responsáveis, critérios de aceite e status dos cards do quadro **não foram lidos ou marcados como concluídos**. Para finalizar a conferência card a card, é necessário disponibilizar leitura do Projects ou fornecer uma exportação dos cards. A matriz acima descreve apenas o que foi verificado diretamente no código.

## Pendências que exigem contrato de backend

- Consulta de auditoria.
- Processo/documentos/histórico vinculados ao cliente autenticado.
- Cadastro completo de pessoa com CPF/CNPJ, telefone e endereço.
- Edição, ativação/desativação e exclusão de usuários.
- Indicadores globais de todos os processos, além da fila de comunicação.
- Identidade de usuário autenticado com ID para baixa/atualização de status sem inferir um usuário a partir do e-mail.

## Acesso local

### Complemento: cadastro, temas e acesso administrativo

- Cadastro redesenhado com identificação do perfil, confirmação de senha, feedback e informações de acesso.
- Tema claro/escuro em toda a aplicação, preferência persistida no navegador e respeito à configuração inicial do dispositivo.
- Criada uma conta administrativa local dedicada, com login real verificado. A senha é entregue ao solicitante e não é incluída nos arquivos do projeto.
- Senhas de contas existentes não foram alteradas. Contas do MySQL local não são enviadas pelo Git.
- A confirmação de senha não é enviada à API: o cadastro continua usando somente `nome`, `email`, `senha` e `tipo`.
- A consulta real de status da Evolution retornou HTTP 503: a chave de autenticação da Evolution API ainda não está configurada no backend. Isso é uma dependência de configuração, não uma falha do seletor de tema ou da interface de QR Code.

ConsorTech em `http://localhost:5174`; API em `http://localhost:8080`. A porta 5173 pertencia ao projeto Educa+ e foi preservada.
