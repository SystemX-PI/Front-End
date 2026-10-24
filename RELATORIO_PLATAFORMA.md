# Plataforma por contas de clientes

## Modelo entregue

| Perfil | Responsabilidade |
| --- | --- |
| Administrador | Gerencia as contas dos clientes, com totais de instâncias, Gmails e usuários. Pode abrir uma conta com identificação explícita e voltar à lista de clientes. |
| Cliente | Titular de uma conta da plataforma. Gerencia sua marca, aplicações, equipe e assinatura. |
| Usuário | Integrante da equipe de um cliente. Consulta os recursos da própria conta, sem alterar configurações ou administrar outras contas. |

O cadastro público cria uma conta de cliente e seu titular, com três dias de teste contados no servidor. Os usuários da equipe são cadastrados pelo titular, não pelo formulário público. E-mails de login continuam únicos na plataforma.

## Navegação e experiência

- `/`: landing page do produto, com proposta de valor, recursos, passos para começar e convite para três dias grátis.
- `/register` e `/login`: cadastro da empresa e acesso, com retorno ao site.
- `/app`: lista de clientes para o administrador; visão geral das aplicações para clientes e suas equipes.
- `/app/integracoes`, `/app/whatsapp`, `/app/gmail`, `/app/equipe`, `/app/marca` e `/app/assinatura`: áreas da conta com navegação consistente.
- O menu não troca de estrutura ao entrar em Integrações. Os indicadores mostram recursos realmente cadastrados, em vez de dados técnicos como JWT.
- Marca, logo e cores são persistidos por conta e compartilhados com a equipe na área autenticada. Login e landing page mantêm a marca da plataforma. Domínios próprios e páginas públicas com marca individual ainda não fazem parte desta entrega.
- Layout revisado em 360, 390, 768 e 1440 pixels, com menu recolhível e suporte ao tema escuro.

## Integrações

Cada instância de WhatsApp pertence a uma conta. O nome visível é escolhido pelo cliente; o identificador externo inclui a conta e um identificador único. Isso permite nomes como `vendas` em clientes diferentes sem misturar conexões.

O titular pode adicionar várias instâncias, selecionar uma delas, gerar seu QR, desconectar o aparelho e gerar outro QR para reconectar. A remoção da instância exige confirmação. O acompanhamento automático busca o estado e o QR atual da Evolution a cada cinco segundos, substituindo a imagem quando o provedor renova o código. Termina ao conectar, após três minutos ou depois de três falhas seguidas; ao terminar sem conexão, o QR antigo é removido. A conexão atual `consorcio` foi preservada na conta “Operação existente”.

Vários Gmails podem ser cadastrados por conta. Cada senha de aplicativo é verificada no SMTP antes de salvar, criptografada com AES-GCM no servidor e nunca retornada ao frontend. Esta entrega organiza as configurações; não cria campanhas ou novos fluxos de disparo de mensagens. Nenhuma credencial real de Gmail foi utilizada nos testes desta entrega.

O ciclo externo de WhatsApp segue as rotas da [Evolution API 2.3.7](https://github.com/EvolutionAPI/evolution-api/blob/2.3.7/src/api/routes/instance.router.ts).

## Teste gratuito e assinatura

O teste dura 72 horas desde o cadastro. Quando termina, o backend bloqueia operações de configuração com HTTP 402. Consulta da conta e remoção/desconexão de canais continuam disponíveis; os aparelhos existentes não são desconectados automaticamente.

O teste e a demonstração incluem somente uma instância de WhatsApp e uma conta Gmail. O modo de demonstração, uma data antiga de ativação ou a abertura de um pedido não representam compra.

A pedido do usuário, o pagamento é somente simulado. O novo checkout apresenta benefícios e valor ilustrativo, permite escolher Pix ou cartão fictício, cria um pedido pendente e exige confirmação explícita. Apenas o pedido confirmado ativa o plano Profissional por 30 dias, com **três WhatsApps e dois Gmails**. Repetir a confirmação não prolonga a assinatura nem concede vagas adicionais. O ambiente local usa `BILLING_SIMULATION_ENABLED=true`; o padrão da aplicação fora dessa configuração é `false`.

Preço, meio de pagamento, webhook de confirmação e cobrança real ficam para a próxima definição comercial. A tela identifica a simulação explicitamente.

## Persistência e isolamento

A migração V8 adiciona contas, instâncias e caixas de e-mail e vincula usuários às contas. Os logins CLIENTE antigos recebem contas próprias. Dados anteriores de consórcios não são apagados; os módulos antigos permanecem no código e saem da navegação principal da nova plataforma.

Cada endpoint resolve a conta pelo usuário autenticado. Somente o administrador pode escolher outra conta pelo identificador. Usuários comuns não conseguem acessar instâncias, equipe ou marca de outro cliente alterando parâmetros da requisição.

Rotas novas ficam sob `/api/platform`: `context`, `clients`, `instances`, `mailboxes`, `users`, `brand`, `subscription/checkout` e `subscription/checkout/{id}/confirm`. Os contratos de entrada são validados e aparecem na documentação OpenAPI do backend. Totais administrativos são obtidos com uma consulta agregada. A listagem administrativa atual retorna até 200 contas; paginação dessa lista é uma evolução futura.

## Correções de caracteres e inputs

Arquivos que haviam sido regravados com codificação incorreta foram corrigidos e salvos em UTF-8. Também foram substituídos os símbolos textuais da tela de autenticação por ícones vetoriais. A verificação final não encontrou padrões de texto corrompido nos fontes Java e TypeScript/TSX.

Nos inputs de autenticação, somente o elemento externo desenha a borda e o estado de foco. O input interno fica sem borda, sombra ou contorno próprios. O preenchimento automático respeita a superfície do tema.

## Evidências

- Backend: 10 testes aprovados, incluindo os seis existentes e quatro novos cenários de isolamento, permissões, teste gratuito e ciclo de conexão.
- O teste do ciclo externo executa o cliente HTTP real contra um servidor local de simulação; não desconecta o telefone do usuário. O CLI Postman não estava disponível no ambiente.
- Frontend: sete cenários focados aprovados. O primeiro teste foi repetido após corrigir um seletor de botão no próprio teste.
- Build de produção e TypeScript aprovados; lint mantém apenas três avisos preexistentes em módulos antigos.
- Migração V8 aplicada ao MySQL local com sucesso. Login e consulta das contas retornaram HTTP 200.
- A consulta da instância existente retornou HTTP 200 e estado `open`, confirmando que o aparelho continuou conectado após a migração.
- Nenhuma nova dependência foi adicionada ao projeto. O cache de build e os limites locais de recursos foram mantidos.

## Uso local

Atualize o navegador com Ctrl+F5. Entre com o administrador existente para ver Clientes. Abra “Operação existente” para acessar o WhatsApp já conectado. Uma conta criada pelo formulário público entra como cliente e recebe seu próprio espaço de trabalho.

O backend continua em 8080. Para reconstruir e iniciar posteriormente, execute `docker compose up -d --build` na pasta Back-end. No frontend, execute `npm run dev` na pasta Front-End. A nova versão de produção também está na pasta `Front-End/dist`.

## Ajustes de navegação e compra — 24/10/2026

- Menu preso à janela com altura de toda a tela e navegação interna rolável. Perfil e saída permanecem no rodapé esquerdo, sem subir junto com a página. No celular, a navegação abre como um painel lateral fixo.
- Cabeçalho direito mantém apenas o seletor de aparência. Os dados do titular e a saída saíram dessa região.
- Visão geral agora apresenta indicadores, ocupação do plano e próximos passos. Integrações apresenta exclusivamente os canais, recursos cadastrados e ações de configuração.
- Ao ocupar a vaga gratuita de um canal, o formulário dá lugar à opção de conhecer o plano e comprar. Os mesmos limites são impostos no servidor, inclusive em requisições concorrentes.
- Preço demonstrativo: R$ 99,90 por 30 dias, configurável em `app.billing.demo-price-cents`. O preço comercial continua pendente de definição. Nenhuma cobrança real foi implementada.
- Pix usa representação e código de teste não pagáveis. Cartão usa dados fictícios fixos, sem solicitar dados reais.
- Pedido persistido com método, valor definido pelo servidor, expiração e estado. Abrir um pedido mantém 1+1; confirmar libera 3+2. Um pedido de outra conta não pode ser confirmado pelo usuário.
- Migração V9 registra os pedidos; V10 diferencia compra confirmada de demonstração e de datas de ativação antigas. Recursos já cadastrados não são apagados por essa alteração.
- Referências técnicas para a renovação do QR: [estado e QR atual da instância](https://github.com/EvolutionAPI/evolution-api/blob/2.3.7/src/api/controllers/instance.controller.ts) e [ciclo do QR no provedor](https://github.com/EvolutionAPI/evolution-api/blob/2.3.7/src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts).

### Verificação das regras finais

- 11 testes de backend aprovados, incluindo Pix e cartão, pedido pendente sem upgrade, confirmação idempotente, isolamento da compra, limites do teste e teto de três WhatsApps.
- Datas de ativação antigas sem compra confirmada continuam com plano TRIAL e limite 1+1.
- Seis cenários de navegador aprovados para as alterações, além de um teste específico de rolagem no computador e no celular. O QR foi substituído automaticamente pela resposta atualizada da API e a compra só liberou 3+2 após confirmar.
- Build de produção aprovado. Nenhuma dependência nova foi instalada.
- Backend atualizado em 8080: login e lista de clientes com HTTP 200. A conta existente permaneceu em TRIAL com limites 1+1 e seu WhatsApp permaneceu `open`.

## Perfil e recuperação de senha — 24/10/2026

- Card esquerdo do cadastro alinhado mais acima, sem alterar os campos ou a adaptação ao celular.
- Perfil centralizado, com edição do nome e da foto, prévia da imagem, redimensionamento e gravação no backend. O avatar também aparece no rodapé do menu.
- Troca de senha no perfil exige a senha atual e confirma a nova senha. Ao concluir, invalida os acessos anteriores e emite uma sessão nova para manter o usuário atual conectado.
- Login e perfil oferecem recuperação por e-mail. O código tem oito dígitos, é de uso único e expira em cinco minutos. O servidor guarda somente um HMAC do código, limita tentativas e solicitações e não confirma publicamente se o e-mail está cadastrado.
- O e-mail é enviado pelo remetente Gmail da plataforma após a transação, sem segurar a resposta da API. As contas Gmail dos clientes permanecem separadas desse remetente.
- O ambiente local ainda não tem `MAIL_USERNAME` e `MAIL_PASSWORD`. Nesse estado, a API informa que o remetente precisa ser configurado; não simula um envio bem-sucedido. O envio real não foi validado com uma caixa Gmail nesta entrega.
- O aviso do teste deixou de aparecer em todas as páginas: há uma notificação única após login e o aviso permanente fica somente na visão geral. A navegação foi compactada e sua barra de rolagem visual foi ocultada, preservando acesso às opções em janelas curtas.
- Migração V11: foto do usuário e registro de códigos de recuperação. Rotas novas: `PUT /api/platform/profile`, `PUT /api/platform/profile/password`, `POST /api/auth/forgot-password` e `POST /api/auth/reset-password`.
- Validação: quatro testes novos de backend (foto/senha, uso único, prazo/tentativas e remetente ausente), totalizando 15 testes aprovados; quatro testes de navegador focados aprovados. As entregas de e-mail dos testes foram capturadas por um remetente simulado, sem enviar mensagens reais.
