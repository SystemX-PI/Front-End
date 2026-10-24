# ConsorTech — Frontend

Plataforma por contas de clientes, com React, TypeScript e Vite. Inclui landing page, teste gratuito, visão geral da conta, integrações WhatsApp/Gmail, equipe, identidade da marca e compra simulada.

## Executar localmente

Com o backend disponível em `http://localhost:8080`:

```powershell
npm ci
npm run dev
```

Acesse o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Sem mudanças nas dependências, reutilize `node_modules`; não é necessário executar `npm ci` novamente. O proxy encaminha `/api` ao backend em 8080. Para outro servidor, configure `VITE_API_URL` sem incluir credenciais.

## Áreas do produto

| Rota | Finalidade |
| --- | --- |
| `/` | Apresentação do produto e início do teste gratuito |
| `/login`, `/register` | Acesso e cadastro de uma empresa |
| `/app` | Clientes para o administrador; resumo da conta para os demais perfis |
| `/app/integracoes` | Central dos canais e suas configurações |
| `/app/whatsapp`, `/app/gmail` | Instâncias e remetentes da conta |
| `/app/equipe`, `/app/marca` | Usuários da equipe e identidade visual |
| `/app/assinatura`, `/app/upgrade` | Limites e compra simulada por Pix ou cartão |
| `/app/perfil` | Dados do acesso e da conta |

O cadastro e a demonstração incluem um WhatsApp e um Gmail por três dias. Somente a confirmação da compra simulada libera três WhatsApps e dois Gmails por 30 dias. Os preços são ilustrativos e nenhuma cobrança real é realizada.

O menu permanece fixo à janela, com perfil e saída no rodapé. O QR e o estado do WhatsApp são atualizados durante o vínculo. O frontend renova o token de acesso antes de exigir novo login por sessão revogada ou expirada. O servidor valida os perfis, os limites e o isolamento das contas.

## Verificação e produção

```powershell
npm run build
npm run lint
npm run test:ui
```

O build gera `dist`. Os testes de interface usam respostas controladas e um navegador local; o teste real em `tests/live.spec.ts` é opcional e exige `SYSTEMX_TEST_TOKEN` de administrador e backend ativo. O servidor de testes usa 5174 para isolar a execução do desenvolvimento.

Os módulos antigos de consórcios permanecem no código e não integram a navegação principal atual.

- [Relatório da plataforma e das validações](RELATORIO_PLATAFORMA.md)
- [Checklist de evolução da interface](CHECKLIST_FRONTEND.md)
