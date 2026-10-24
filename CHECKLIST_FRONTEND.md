# Checklist para um frontend consistente, responsivo e profissional

Revisão de código: 23/10/2026. Esta lista separa o que já existe do trabalho recomendado. Não representa uma aprovação visual de todas as telas nem uma auditoria completa de acessibilidade. As melhorias de interface abaixo não foram implementadas nesta etapa; a alteração funcional desta etapa é a inicialização da Evolution pelo Docker.

## Base que deve ser preservada

- [x] Cliente HTTP centralizado, autenticação e tratamento de respostas de erro.
- [x] Componentes para carregamento, estado vazio, erro, paginação e notificações.
- [x] Temas claro/escuro e preferência persistida.
- [x] Regras responsivas e suporte a preferência de movimento reduzido.
- [x] Busca e paginação no servidor para cadastros e fila.
- [x] Confirmação de exclusão e bloqueio de ações administrativas conforme o perfil.
- [x] Testes de interface existentes com cenários desktop e celular.

## P0 — confiabilidade e clareza dos fluxos

- [ ] **Conexão do WhatsApp:** diferenciar serviço inicializando, pronto, QR em geração, aguardando leitura, conectado e falha. O usuário deve entender o próximo passo sem conhecer Docker ou chaves de API. Evidência: `src/pages/WhatsAppIntegration.tsx` já distingue alguns estados, mas consulta o status somente por ação manual.
- [ ] **Confirmação automática da conexão:** após exibir o QR, consultar o status com intervalo controlado, parar ao conectar, ao sair da tela ou ao atingir o prazo e permitir retomar. Não fazer polling permanente em todas as páginas.
- [ ] **Mesma instância para conectar e enviar:** alinhar a instância escolhida na tela com a usada pelo backend nos envios. Evidência: a tela permite editar o nome, enquanto o envio utiliza `EVOLUTION_INSTANCE`; o padrão configurado nesta etapa é `consorcio`. Critério: não permitir que uma conexão bem-sucedida em outro nome deixe os envios usando a instância anterior.
- [ ] **Recuperação do QR:** oferecer regeneração explícita quando expirar e não manter um QR antigo como se ainda fosse válido. Preservar a sessão já conectada.
- [ ] **Erros de login claros:** separar credenciais inválidas, indisponibilidade da API e tempo limite. Manter a mensagem útil, sem expor dados internos.
- [ ] **Auditoria com estado honesto:** integrar registros reais ou identificar a função como indisponível na navegação. Evidência: `src/pages/Audit.tsx` ainda contém apenas um estado vazio aguardando serviço.
- [ ] **Dados legados no portal:** explicar quando a conta não possui processo associado e oferecer um canal de atendimento definido pelo produto, sem inventar contatos.
- [ ] **Sessão expirada previsível:** definir a política de renovação com o refresh token já recebido no login; evitar várias renovações simultâneas e impedir repetição automática de gravações. Exibir uma única orientação para entrar novamente quando a renovação falhar.

## P1 — uma única linguagem visual

- [ ] **Consolidar estilos:** organizar cores, tipografia, espaçamentos, bordas e sombras em uma fonte de referência. Evidência: `src/main.tsx` importa `index.css` e depois `design-system.css`; juntos somam 4.307 linhas, com regras e cores literais espalhadas. A presença de sobrescritas não prova defeito, mas aumenta a dificuldade de manter consistência.
- [ ] **Unificar a estrutura das telas:** compartilhar cabeçalho, navegação, identificação do usuário e comportamento móvel. Evidência: `AdminShell.tsx` e `IntegrationShell.tsx` mantêm estruturas semelhantes separadamente; o portal tem uma terceira estrutura por atender um público diferente.
- [ ] **Padronizar títulos e textos:** revisar português, acentuação e nomes das funções. Evidência: `Registries.tsx` contém rótulos como “Usuarios”, “Numero” e “Valor do credito”; outras telas usam acentos.
- [ ] **Definir hierarquia tipográfica:** estabelecer tamanhos e pesos para título de página, título de seção, texto, legenda e erro. Critério: a mesma função visual deve usar o mesmo estilo em todas as telas.
- [ ] **Padronizar botões:** manter uma ação principal por área, com variantes secundária e destrutiva consistentes. Critério: tamanho, ícone, carregamento e estado desabilitado iguais para ações equivalentes.
- [ ] **Padronizar formulários:** extrair campos, seleção pesquisável, mensagens por campo e barra de ações reutilizáveis. Evidência: `Registries.tsx` concentra tabelas, formulários, detalhes, exclusão e senha em um único componente.
- [ ] **Mostrar nomes nos vínculos:** apresentar nome do tipo, consórcio e número do grupo nas tabelas, deixando o ID como informação auxiliar. Evidência: a tabela genérica de cadastros renderiza diretamente o valor dos campos de vínculo.
- [ ] **Formatar valores:** usar moeda em reais, números, datas e status com rótulos explícitos em português. Evidência: os cadastros usam `String(...)` para valores da tabela; `format.ts` já centraliza parte da formatação em outras telas.
- [ ] **Temas completos:** conferir contraste, estados de foco, tabelas, campos, alertas, diálogos e botões em ambos os temas. Critério: nenhuma área deve depender de uma cor fixa incompatível com o tema.

## P1 — responsividade e acessibilidade

- [ ] **Matriz de larguras:** verificar 360, 390, 768, 1024 e 1440 px e zoom de 200%. Critério: sem perda de conteúdo ou rolagem horizontal da página; tabelas podem ter rolagem localizada e identificada.
- [ ] **Navegação móvel:** definir um padrão único de menu compacto ou gaveta, com indicação da seção atual e fechamento acessível. Evidência: abaixo de 900 px, a navegação atual passa a uma faixa horizontal com rolagem.
- [ ] **Tabelas no celular:** priorizar as colunas essenciais e agrupar ações secundárias. Critério: consultar ou editar um registro não pode exigir atravessar uma linha larga com vários botões.
- [ ] **Formulários no celular:** manter campos em coluna única quando necessário, teclado adequado para e-mail/números e ações visíveis sem encobrir os campos.
- [ ] **QR legível:** conferir tamanho, margem branca, contraste e proporção do código em telas pequenas. Critério: escaneável em um telefone real; quando o sistema for aberto no mesmo telefone, orientar sobre o fluxo de pareamento disponível, sem prometer suporte que o provedor não ofereça.
- [ ] **Diálogos de confirmação:** implementar foco inicial, navegação contida, Escape, retorno do foco e associação do título/descrição. Evidência: a confirmação em `Registries.tsx` usa uma seção com `role="alertdialog"`, sem gerenciamento de foco no componente.
- [ ] **Uso por teclado:** garantir foco visível e ordem coerente em menus, seleções, formulários, tabela e paginação. Não depender somente do mouse ou de cor para comunicar estado.
- [ ] **Rótulos e anúncios:** relacionar erros aos campos e anunciar carregamento, sucesso e falha sem duplicar notificações. Validar com teclado e leitor de tela.
- [ ] **Contraste e áreas de toque:** validar contra os critérios aplicáveis da WCAG 2.2 e adotar áreas de interação confortáveis. Usar como referência a [lista oficial de critérios](https://www.w3.org/WAI/WCAG22/quickref/); não declarar conformidade sem avaliação.

## P2 — manutenção, desempenho e acabamento

- [ ] **Preservar filtros na navegação:** refletir busca, página e filtros na URL para voltar à lista sem perder o contexto e permitir compartilhar consultas.
- [ ] **Carregamentos consistentes:** preservar o conteúdo anterior quando apropriado e evitar mudanças bruscas de altura. Distinguir lista vazia de ausência de resultado e de falha na consulta.
- [ ] **Uma notificação por ação:** escolher quando usar feedback ao lado do formulário e quando usar toast. Evitar exibir duas mensagens equivalentes para a mesma operação.
- [ ] **Reduzir dados técnicos na interface:** esconder URL de infraestrutura, chaves, IDs desnecessários e detalhes de exceção. Deixar orientações de implantação no guia técnico.
- [ ] **Identidade verdadeira:** não mostrar um usuário de exemplo se faltarem os dados de sessão. Evidência: `IntegrationShell.tsx` possui um e-mail fictício de fallback.
- [ ] **Estados de disponibilidade por perfil:** alinhar menus, páginas e permissões reais. Funções indisponíveis devem ter justificativa curta; não apresentar ações que sempre resultarão em 403.
- [ ] **Medir antes de otimizar:** avaliar peso do JavaScript, fontes e tempo de carregamento por rota. Aplicar carregamento sob demanda quando a medição justificar, sem acrescentar bibliotecas apenas para reescrever o que já funciona.
- [ ] **Validação de publicação curta:** manter verificações de tipos, construção e poucos cenários essenciais: login, CRUD, portal restrito e conexão WhatsApp. Testes visuais mais amplos devem ser executados ao alterar estilos, sem fazer parte da simples inicialização do sistema.

## Ordem sugerida para executar

1. Concluir os estados e a recuperação da conexão do WhatsApp; revisar login, sessão e erros.
2. Consolidar os estilos e a estrutura de navegação sem mudar contratos da API.
3. Padronizar cadastros: campos, moeda, nomes dos vínculos, ações e diálogos.
4. Validar celular, teclado, temas e QR real com a matriz de larguras.
5. Integrar auditoria e refinar filtros, desempenho e detalhes de apresentação.

## Critério para considerar uma tela pronta

- [ ] Tem propósito e ação principal claros.
- [ ] Usa os componentes e estilos comuns.
- [ ] Mostra dados reais e respeita o perfil da conta.
- [ ] Trata carregamento, vazio, erro, sucesso e indisponibilidade.
- [ ] Funciona com teclado, zoom e celular.
- [ ] Mantém legibilidade nos dois temas.
- [ ] Não mostra dados fictícios como se fossem reais.
- [ ] Foi verificada no fluxo completo, incluindo retorno e recuperação de erro.
