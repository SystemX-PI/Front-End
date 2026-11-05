# Entrega do frontend — 29/10/2026

## Implementado

- Rotas protegidas por perfil para dashboard de operação, contemplados, clientes, cadastros, usuários, comunicação, baixas e auditoria; portal de processos exclusivo para CLIENTE.
- Entrada para a operação de consórcios no espaço de administrador/funcionário e Meus processos no espaço de cliente.
- Tela de baixas com busca/paginação preparada para API, consulta individual existente, conferência de status, observação, confirmação, bloqueio de duplo envio e comprovante retornado pela API. Nenhum sucesso é exibido sem resposta do serviço.
- Atualização de andamento com confirmação; finalização usa a tela de baixa. Processos encerrados não oferecem edição nesta UI.
- Histórico de comunicações e auditoria preparados para contratos documentados, com carregamento, vazio, erro e recurso indisponível.
- Fila de comunicação com confirmação antes de notificar/reenviar; ligação ao processo e histórico.
- Cadastros novamente acessíveis, confirmação de exclusão com diálogo nativo, moeda em reais, nomes de vínculos quando retornados e revisão de rótulos.
- Correção local do login incluída nesta entrega e teste de regressão preservado.
- Integrada a branch origin/feat/google-auth, com login/cadastro/vínculo Google e testes existentes. Credenciais Google continuam dependentes do ambiente.
- Tela inicial com FAQ, ajustes de composição, foco visível, link para pular conteúdo e menu móvel com estado acessível. Inspecionada em 390 px e 1440 px.

## Integração a concluir pelo backend

O frontend está preparado, mas o fluxo completo só será aceito depois da entrega das APIs e das regras. Veja CONTRATO_OPERACAO.md. Não há mocks nem dados de demonstração alimentando as telas de produção.

- Julio (jwlioo): https://github.com/SystemX-PI/Back-end/issues/65 — regras/transições, ator autenticado, histórico da baixa e erros.
- Juca (joaosouza73): https://github.com/SystemX-PI/Back-end/issues/66 — fila paginada de baixas e histórico persistido das tentativas de comunicação.
- Swell (swellng): https://github.com/SystemX-PI/Back-end/issues/67 — auditoria, testes MySQL/Flyway e documentação.

As três issues foram criadas e suas atribuições foram verificadas. O histórico de comunicações desta primeira versão mostra até 100 eventos mais recentes por processo, conforme contrato. Não é uma aprovação de acessibilidade completa nem de envio real nos serviços externos.

## Kanban

A autenticação atual do GitHub CLI não tem o escopo `project` de escrita. As tentativas de adicionar as três issues ao projeto 5 foram recusadas antes de alterar o quadro. Leitura dos quadros e criação/atribuição de issues funcionam. Nenhuma coluna foi declarada atualizada sem confirmação.

Status recomendados depois de liberar a permissão:

| Projeto | Card | Status proposto | Critério |
|---|---|---|---|
| Front-End | #42 componentes | Concluído | Componentes e confirmações implementados |
| Front-End | #72 cadastros | Em testes | CRUD acessível e cenário automatizado; validar com API real |
| Front-End | #37 telas principais | Em testes | Rotas e telas entregues; integração da baixa pendente |
| Front-End | #65 comunicação | Em testes | UI pronta; histórico depende da issue backend #66 |
| Front-End | #67 baixas | Em testes | UI pronta; fila/regras dependem de #65 e #66 do backend |
| Front-End | #38 integração | Em desenvolvimento | Três endpoints futuros aguardam backend |
| Front-End | #39 revisão/testes | Em testes | Suíte automatizada; aceite humano/integrado pendente |
| Back-End | novas #65/#66/#67 | A Fazer | Escopo e responsáveis definidos nas issues |

Não marcar todos os cards como Concluído enquanto o backend e o aceite integrado estiverem pendentes. Cards de aprovação de protótipos continuam dependendo da equipe.

## Validação executada

- `npm run build`: aprovado.
- `npm run lint`: sem erros; permanecem avisos de lint já existentes nas telas de portal/cadastros e no componente Google importado.
- `PLAYWRIGHT_CHANNEL=chromium npm run test:ui`: 26 aprovados, 1 ignorado por ausência de SYSTEMX_TEST_TOKEN; respostas controladas nos cenários de UI.
- `git diff --check`: aprovado.
- Capturas da página inicial em celular e desktop inspecionadas visualmente.
