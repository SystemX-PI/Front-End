# ConsorTech · direção de UX e UI

O titular conecta os canais da empresa e organiza a equipe. O operador recebe uma contemplação, confere a pessoa e a cota e acompanha o envio. O administrador gerencia empresas e usa canais internos em testes.

## Identidade visual

- Fundo `#F4F6F9`, superfície `#FFFFFF`, texto `#172338`, borda `#CBD5E1`, ação padrão `#315FE8`, sucesso `#176344`. A cor principal da empresa substitui a cor de ação no seu painel. Verificar contraste nos temas claro e escuro.
- Inter para interface e formulários. Usar peso 650–700 para títulos curtos e números tabulares em referências, valores e datas.
- A assinatura da operação é a linha **Pessoa / Cota / WhatsApp / Gmail**. No celular, pessoa e cota vêm primeiro, seguidas pelos dois canais identificados em texto. O envio avulso tem rota própria.
- Usar rótulos de ação consistentes. **Revisar envio** abre a confirmação, **Enviar mensagem** inicia o envio e **Envio aceito** indica a resposta do provedor.

## Revisão por jornada

| Jornada | Evidência no código | Mudança e critério de aceite |
| --- | --- | --- |
| Site público | Landing ainda usa título promocional e elementos decorativos. | Mostrar um exemplo de pessoa, cota e acompanhamento por canal ao lado da proposta do produto. Uma ação principal no primeiro quadro. |
| Login, cadastro e recuperação | AuthShell compartilha a estrutura. | Aplicar a mesma hierarquia aos três fluxos. Testar erro, teclado e foco no primeiro campo inválido. |
| Painel e clientes | PlatformApp usa chamadas promocionais na visão geral e no diretório. | Exibir títulos diretos, atalhos operacionais e conta ativa visível a 200% de zoom. |
| Contemplados e disparo | ClientContemplados reúne fila, confirmação e histórico. | Validar fila vazia, seleção no celular, envio aceito e falha. Exibir canal em texto e manter a mensagem para nova tentativa. |
| Usuários e equipe | Team e TeamGroups separam usuário e grupo. | Alinhar editar, excluir e estados vazios. Testar formulário, cancelamento e retorno do foco. |
| Integrações, marca, perfil e assinatura | PlatformApp ainda usa confirmação nativa do navegador para remover Gmail. | Reusar diálogo compartilhado, mostrar impacto da remoção e manter ações de conta fáceis de identificar. |
| Widget e instalação | PartnerWidget exibe dois blocos técnicos. | Mostrar copiar e testar primeiro. A instalação simplificada depende do fluxo de autenticação do widget. |
| Operação administrativa e portal | Há rotas próprias para cadastros, processos, comunicação, baixas, canais e auditoria. | Revisar ações por frequência, filtros, cancelamento, paginação e estado vazio em cada rota. Validar o portal com perfil de beneficiário. |

## Vinte critérios de interação

Fitts e área de toque estão na mesma linha. Movimento em arco e ação secundária têm critérios separados.

| # | Princípio | Aplicação e verificação |
| --- | --- | --- |
| 1 | Squash & stretch | A pressão do botão já usa escala no CSS compartilhado. Validar que o texto continua legível e que o efeito some com movimento reduzido. |
| 2 | Antecipação | A confirmação de envio já existe. Mostrar canal, remetente e destino antes do envio. |
| 3 | Staging e foco | Dar destaque a uma ação principal por etapa. Conferir foco visível e ordem de tabulação. |
| 4 | Pose to pose | Definir repouso, seleção, envio, sucesso e erro. Testar cada estado isoladamente. |
| 5 | Follow-through | Ao fechar uma confirmação, devolver o foco ao acionador. Após excluir, mover para o próximo item ou para o título da lista. |
| 6 | Slow in / slow out | Aplicar aceleração curta em diálogos e painéis. Conferir movimento reduzido. |
| 7 | Movimento em arco | Usar apenas em elemento indicativo, como seta de abertura do detalhe. O conteúdo permanece estável. |
| 8 | Ação secundária | Atualizar o status do canal enquanto o registro continua selecionado. |
| 9 | Timing rápido | Responder ao toque imediatamente. Medir a transição entre clique e feedback. |
| 10 | Feedback enfatizado | Combinar texto, ícone e cor para sucesso e falha. Conferir contraste e anúncio pelo leitor de tela. |
| 11 | Solid drawing / profundidade | Reservar sobreposição e sombra para a camada de diálogo. Conferir distinção em ambos os temas. |
| 12 | Appeal | Usar pessoa, cota e canal como elementos reconhecíveis; remover selos e slogans que competem com a operação. |
| 13 | Fitts e áreas de toque | O CSS compartilhado define 44 px para controles principais. Medir ícones, ações da fila e rodapé no celular. |
| 14 | Hick | Agrupar ações secundárias e mostrar escolhas por etapa de envio. |
| 15 | Miller | Separar contexto, destinatário, mensagem e histórico em blocos curtos. |
| 16 | Limiar de Doherty | Mostrar retorno imediatamente durante a espera. Medir o tempo com rede lenta sem prometer tempo de resposta da API. |
| 17 | Lei de Postel | Aceitar formatos comuns de telefone; normalizar DDI e pontuação antes do envio. Testar formatos aceitos. |
| 18 | Lei de Jakob | Preservar controles familiares, comportamento de Voltar, Escape, confirmação e navegação por teclado. |
| 19 | Frequência de uso | Deixar Contemplados e Disparo manual acessíveis no menu do cliente. Mover configurações raras para Integrações. |
| 20 | Skeleton | Já existe no carregamento do painel e da fila. Conferir se reserva a geometria real e se dá lugar a conteúdo ou erro. |

## Validação

Executar Playwright para os perfis visitante, titular, membro e administrador, em desktop e celular. Conferir teclado, zoom, contraste, movimento reduzido, carregamento, estado vazio, sucesso e erro. A checagem anterior em 390 px cobriu ausência de rolagem horizontal em sete rotas; a revisão acima é de código e os demais critérios exigem validação no navegador.
