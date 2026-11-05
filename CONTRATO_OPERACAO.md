# Contrato das telas de operação

O frontend está preparado para os endpoints abaixo. Não há dados simulados em produção: 404/405/501 mostram indisponibilidade e permitem tentar novamente. Outros erros mantêm a mensagem retornada pela API.

Todos exigem JWT. Backend deve autorizar ADMINISTRADOR/FUNCIONARIO, limitar acesso ao escopo autorizado e nunca confiar no perfil, ator ou elegibilidade calculados no navegador.

## Fila de baixas

GET /api/processos-contemplacao/pagina?page=0&size=20&q=&status=EM_PROCESSO_DE_BAIXA

Resposta: `{items: ProcessResponse[], total: number, page: number, size: number}`. ProcessResponse segue o GET individual já existente: id, contemplacaoId, responsavelId, status, criadoEm, atualizadoEm. Total deve considerar o filtro completo, não apenas a página. Ordenação estável por data e id. Validar page >= 0, size 1–100 e status.

A conferência individual usa GET /api/processos-contemplacao/{id}. A conclusão usa POST /api/integracoes/processos/{id}/baixa e consulta GET da mesma URL. Body atual: `{usuarioId, observacao}`; usuarioId é derivado do JWT no frontend por compatibilidade, mas o servidor deve derivar o ator do contexto autenticado. Observação limitada a 255 caracteres. O frontend só oferece conclusão em EM_PROCESSO_DE_BAIXA e só apresenta sucesso após resposta da API. A API deve garantir elegibilidade, idempotência e integridade, incluindo chamadas concorrentes. Status inválido: 409; entrada inválida: 400; sem acesso: 403.

## Histórico de comunicações

GET /api/integracoes/processos/{id}/comunicacoes/historico?page=0&size=100

Resposta: `{items: OperationEvent[],total,page,size}`. OperationEvent: `{id,data,canal,status,usuarioNome,observacao}`. Datas ISO 8601. Canal/status seguem os enums existentes. Cada tentativa deve ser persistida inclusive em falha, com remetente/ator quando conhecido. A UI exibe até 100 eventos nesta primeira versão; o serviço deve retornar os 100 mais recentes, com ordenação estável. Não retornar senhas, tokens ou dados de cartões. Estados atuais dos canais não substituem a lista histórica.

## Auditoria

GET /api/auditoria/pagina?page=0&size=20&q=

Resposta: `{items: OperationEvent[],total,page,size}`. Evento: `{id,data,acao,usuarioNome,entidade,registroId,observacao}`. Busca por ação, responsável ou entidade, ordenação estável mais recente primeiro. Controlar escopo por autorização; dados sensíveis devem ser removidos antes de retornar.

## Responsabilidades restantes

Backend: regras de transição de status, autor autenticado, histórico de baixa, captura de tentativas, endpoints de filas/históricos, respostas de erro e testes em MySQL/Flyway. Frontend: contratos centralizados em services/backend.ts e telas prontas para ligar aos endpoints. Conexão real de Google/Gmail/WhatsApp/Stripe depende das credenciais e autorizações do ambiente; testes automatizados de UI não comprovam serviços externos.
