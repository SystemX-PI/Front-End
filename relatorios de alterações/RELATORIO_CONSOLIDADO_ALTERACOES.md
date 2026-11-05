# Relatório consolidado de alterações — Front-End

Este documento substitui os relatórios históricos dispersos do Front-End. Ele reúne as entregas, decisões técnicas, validações e limitações registradas nas revisões de 23 e 24 de outubro de 2026. O `README.md` permanece como guia de entrada do repositório; este arquivo concentra o histórico técnico.

## 1. Sessão, autenticação e recuperação de acesso

O Front-End passou a renovar o token de acesso ao receber uma resposta `401`. A renovação usa `/api/auth/refresh` e a requisição original é repetida uma única vez. Requisições concorrentes compartilham a mesma renovação, e uma resposta atrasada não restaura uma sessão que já tenha sido encerrada. Falhas de rede durante a renovação preservam as credenciais; refresh revogado ou expirado exige novo login.

Login e cadastro receberam feedback de submissão, validação de senha e tratamento de erros HTTP. O fluxo de recuperação usa código de uso único, com validade curta, limite de tentativas e armazenamento apenas do HMAC no servidor. O formulário nunca envia a confirmação de senha para a API.

O perfil permite alterar nome, foto e senha. A alteração de senha invalida as sessões anteriores e mantém a sessão que acabou de concluir a operação. Em ambiente local, a recuperação por e-mail depende de `MAIL_USERNAME` e `MAIL_PASSWORD`; quando essas variáveis não existem, a API informa corretamente que o remetente precisa ser configurado em vez de simular êxito.

## 2. Plataforma por contas e permissões

O produto passou a separar as responsabilidades entre administrador, cliente titular e usuário da equipe. O administrador administra contas; o titular gerencia marca, integrações, equipe e assinatura; o usuário da equipe consulta os recursos permitidos da própria conta. O backend permanece como fonte de autorização: parâmetros de conta alterados no navegador não concedem acesso a recursos de outro cliente.

O cadastro público cria a conta do cliente com período de teste controlado pelo servidor. As rotas da plataforma incluem contexto, clientes, instâncias, caixas de e-mail, usuários, marca e assinatura. Marca, cores e logo são compartilhados com a equipe da conta; login e landing page mantêm a identidade global da plataforma.

As áreas principais são `/`, `/register`, `/login`, `/app`, `/app/integracoes`, `/app/whatsapp`, `/app/gmail`, `/app/equipe`, `/app/marca` e `/app/assinatura`. A interface foi revisada para desktop e dispositivos móveis, incluindo navegação recolhível, tema escuro e identificação acessível.

## 3. WhatsApp, Gmail e comunicações

Cada instância de WhatsApp pertence a uma conta. O identificador externo inclui conta e identificador único, permitindo nomes visíveis iguais em contas distintas sem mistura de conexões. O titular pode adicionar, selecionar, gerar QR, desconectar e remover instâncias mediante confirmação.

Após gerar o QR, a interface consulta o estado periodicamente, sem sobreposição de chamadas. O acompanhamento é encerrado quando o estado fica `open`, após três minutos ou depois de três falhas seguidas. Ao encerrar sem conexão, o QR antigo é removido. Temporizadores são limpos ao sair da tela ou trocar a instância.

As configurações Gmail são validadas antes de serem salvas. Senhas de aplicativo são criptografadas no servidor e nunca retornam ao Front-End. Não foram utilizados dados reais de Gmail nas validações registradas.

As telas operacionais passaram a exibir fila, busca, filtros, paginação, estado vazio, erro e carregamento. O envio individual apresenta o retorno do canal; a interface não interpreta uma falha do provedor como envio concluído.

## 4. Teste gratuito, assinatura e Stripe

O teste gratuito dura 72 horas a partir do cadastro. Depois do término, o backend bloqueia operações de configuração com HTTP `402`, mantendo consultas e remoções/desconexões disponíveis. O teste inclui uma instância de WhatsApp e uma conta Gmail.

O checkout inicialmente foi implementado como demonstração: Pix e cartão usam dados ilustrativos, o pedido começa pendente e apenas uma confirmação explícita libera o plano Profissional por 30 dias, com limite de três WhatsApps e dois Gmails. A confirmação é idempotente e não prolonga o plano quando repetida.

O preço demonstrativo registrado foi R$ 99,90 por 30 dias, configurável no backend. Cobrança comercial, meios de pagamento reais e webhook dependem de definição comercial. A interface identifica a demonstração explicitamente e não solicita dados reais de cartão.

## 5. Interface, acessibilidade e responsividade

Os componentes compartilhados foram padronizados para painéis, botões, campos, foco e espaçamento. Os inputs respeitam claro/escuro e o preenchimento automático do navegador. O menu ocupa a altura da janela, possui navegação interna rolável e, no celular, abre como painel lateral fixo.

O cabeçalho foi simplificado; dados do titular e saída permanecem no menu. A visão geral exibe indicadores, ocupação de plano e próximos passos, enquanto Integrações concentra os canais e ações de configuração. O QR se adapta a telas menores e os botões mantêm tamanho de toque adequado no celular.

Arquivos com codificação incorreta foram normalizados para UTF-8. Símbolos textuais na autenticação foram substituídos por ícones vetoriais quando apropriado.

## 6. Revisão de contratos e integração com backend

Foram conferidos controladores, DTOs e migrations de usuários, autenticação, consórcio, cota, processo, comunicação, contemplação, baixa, Gmail e Evolution. Os contratos tratam IDs positivos seguros, valor de crédito compatível com `DECIMAL(15,2)`, data civil ISO, telefone apenas com dígitos no HTTP e textos normalizados dentro dos limites definidos.

Uma rota duplicada de configuração de e-mail foi removida do fluxo de integração porque dois controladores registravam o mesmo endpoint. A rota preservada é a que configura o serviço efetivamente usado para envio.

Pendências que exigem evolução coordenada do backend: leitura de auditoria completa, vínculo de processo/documentos/histórico ao cliente autenticado, cadastro de pessoa com CPF/CNPJ e endereço, edição/ativação/exclusão de usuários, indicadores globais e identidade autenticada com ID em ações operacionais.

## 7. Evidências de validação registradas

- Builds de produção e TypeScript aprovados nas entregas registradas.
- Lint aprovado nas revisões; avisos antigos foram mantidos explicitamente separados das mudanças novas.
- Testes de navegador cobriram renovação de sessão, concorrência, QR, autenticação, menu móvel, compra simulada, rolagem e fluxos de perfil/recuperação.
- Testes de backend cobriram comunicação, permissões, isolamento entre contas, teste gratuito, checkout, confirmação idempotente, limites de canais, perfil e recuperação de senha.
- Consultas reais locais foram executadas contra Spring Boot e MySQL quando indicado; testes de navegador para integrações externas usaram respostas controladas e não desconectaram aparelhos reais.
- Docker foi validado com imagens de build, Nginx para SPA, proxy `/api`, cache de dependências e volumes persistentes. O perfil `full` do Compose permite subir Front-End e Back-End em conjunto.

## 8. Uso local e observações operacionais

Para desenvolvimento do Front-End, use `npm run dev`; para gerar produção, use `npm run build`. O Back-End é servido em `8080`. Quando usar a composição completa, mantenha os repositórios `Front-End` e `Back-end` lado a lado e execute o Compose a partir do Back-End conforme o `README`.

Atualize o navegador com `Ctrl+F5` depois de trocar arquivos estáticos. Credenciais locais, sessões de bancos, senhas de aplicativo, chaves de Evolution e demais segredos não pertencem ao Git e não são incluídos neste relatório.
