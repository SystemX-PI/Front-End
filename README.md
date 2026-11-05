# ConsorTech — Frontend

Plataforma por contas de clientes, com React, TypeScript e Vite. Inclui landing page, teste gratuito, visão geral da conta, integrações WhatsApp/Gmail, equipe, identidade da marca e compra simulada.

## Docker: forma recomendada para a equipe

Clone este repositório como `Front-End` ao lado de `Back-end`. Na pasta `Back-end`, execute:

```powershell
docker compose --profile full up --build -d --wait --wait-timeout 600
```

Ou execute `./start.ps1` na pasta `Back-end`. Isso inicia site, API, MySQL, Evolution, PostgreSQL e Redis. Acesse http://localhost:5173. O backend permanece em 8080; o Nginx encaminha `/api` automaticamente. Não é necessário instalar Node ou Java. Veja o guia completo em `Back-end/LOCAL.md`.

Após receber mudanças, faça `git pull --ff-only` nos dois repositórios e repita o comando com `--build`. O cache reutiliza imagens e dependências; não use `--no-cache`. As imagens são geradas localmente a partir do código recebido, sem publicação automática em um registro Docker.

Se a API já estiver rodando em localhost:8080, também é possível iniciar **somente o frontend**, nesta pasta:

```powershell
docker compose up --build -d --wait --wait-timeout 600
```

Ou `./start.ps1`. O site usa a mesma porta 5173 e encaminha chamadas ao backend do computador. Escolha esta opção **ou** o perfil `full`, pois ambos usam a porta 5173. Para parar, use `docker compose down` na composição escolhida. O frontend tem limite de 128 MB e 0,5 CPU durante a execução; a compilação usa recursos separados.

O contexto Docker exclui `.env`, `node_modules`, resultados de testes e arquivos locais. A imagem contém apenas Nginx e o site compilado, sem credenciais nem ferramentas de desenvolvimento.

## Executar localmente

Com o backend disponível em `http://localhost:8080`:

```powershell
npm ci
npm run dev
```

Acesse o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Sem mudanças nas dependências, reutilize `node_modules`; não é necessário executar `npm ci` novamente. O proxy encaminha `/api` ao backend em 8080. Para outro servidor, configure `VITE_API_URL` sem incluir credenciais.

### Login com Google

Copie `.env.example` para `.env` e defina `VITE_GOOGLE_CLIENT_ID` com o Client ID público de um cliente OAuth **Web application** criado no Google Cloud. Para o Vite local, autorize as origens `http://localhost` e `http://localhost:5173` no Google Cloud. O back-end também precisa receber o mesmo Client ID em `GOOGLE_CLIENT_ID` para validar o token. O botão real do Google aparece na tela `/login`; sem Client ID, o front exibe uma orientação e mantém o login por e-mail/senha disponível.

Se a conta Google ainda não tiver cadastro, a tela de login encaminha diretamente ao cadastro e pede o nome da empresa. A conta só é criada após confirmar em **Concluir cadastro**. Se o e-mail já pertencer a uma conta local, entre com a senha local e vincule Google em **Meu perfil**; isso evita associação automática somente por e-mail. A configuração do Google Cloud, os comandos de execução e a política de produção estão documentados no [guia do Back-end](../Back-end/README.md#login-com-google).

Na tela `/register`, o botão **Fazer Cadastro com o Google** inicia um cadastro separado: depois de selecionar a conta Google, a pessoa informa somente o nome da empresa. Ao concluir, a aplicação cria a conta e abre uma sessão. O cadastro por e-mail e senha permanece disponível.

## Áreas do produto

| Rota | Finalidade |
| --- | --- |
| `/` | Apresentação do produto e início do teste gratuito |
| `/login`, `/register`, `/forgot-password` | Acesso, cadastro e recuperação de senha |
| `/app` | Clientes para o administrador; resumo da conta para os demais perfis |
| `/app/integracoes` | Central dos canais e suas configurações |
| `/app/whatsapp`, `/app/gmail` | Instâncias e remetentes da conta |
| `/app/equipe`, `/app/marca` | Usuários da equipe e identidade visual |
| `/app/assinatura`, `/app/upgrade` | Limites e compra simulada por Pix ou cartão |
| `/app/perfil` | Foto, nome e troca de senha com validação da senha atual |

O cadastro e a demonstração incluem um WhatsApp e um Gmail por três dias. Somente a confirmação da compra simulada libera três WhatsApps e dois Gmails por 30 dias. Os preços são ilustrativos e nenhuma cobrança real é realizada.

O menu permanece fixo à janela, com perfil e saída no rodapé. O QR e o estado do WhatsApp são atualizados durante o vínculo. O frontend renova o token de acesso antes de exigir novo login por sessão revogada ou expirada. O servidor valida os perfis, os limites e o isolamento das contas.

## Verificação e produção

```powershell
npm run build
npm run lint
npm run test:ui
```

O build gera `dist`. Os testes de interface usam respostas controladas e um navegador local; o teste real em `tests/live.spec.ts` é opcional e exige `SYSTEMX_TEST_TOKEN` de administrador e backend ativo. O servidor de testes usa 5174 para isolar a execução do desenvolvimento.

A operação de consórcios está disponível em `/admin/dashboard`, com cadastros, comunicação, contemplados, baixas e auditoria. Administradores e funcionários encontram o acesso no seu espaço; clientes acompanham processos em `/portal`. Os endpoints futuros e os estados de indisponibilidade estão descritos em [CONTRATO_OPERACAO.md](CONTRATO_OPERACAO.md). Veja [a entrega do frontend](ENTREGA_FRONTEND.md) para validações e pendências de integração.

- [Relatório da plataforma e das validações](RELATORIO_PLATAFORMA.md)
- [Checklist de evolução da interface](CHECKLIST_FRONTEND.md)

A recuperação por e-mail exige o remetente Gmail da plataforma configurado no backend. O código expira em cinco minutos. O aviso do teste permanece somente na visão geral, além de uma notificação após o login.
