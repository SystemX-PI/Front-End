# Ajustes do frontend — 23/10/2026

## Sessão

O backend emite um token de acesso com validade padrão de 900 segundos (15 minutos). O frontend armazenava o refresh token, mas não o utilizava: qualquer resposta 401 nas chamadas autenticadas apagava a sessão e enviava o usuário ao login. Esse comportamento explica a desconexão na primeira ação após o vencimento.

Agora uma resposta 401 inicia a renovação em `/api/auth/refresh` e repete a requisição original uma única vez. Chamadas simultâneas compartilham a mesma renovação. Uma resposta atrasada que usou o token antigo aproveita o token já renovado. Erros de rede ou indisponibilidade durante a renovação preservam as credenciais; refresh revogado ou vencido continua exigindo novo login. Uma renovação em andamento não restaura credenciais depois de logout ou troca de sessão.

## WhatsApp

- Consulta automática ao abrir a tela para reconhecer um aparelho já conectado.
- Após gerar o QR, acompanhamento a cada cinco segundos, sem consultas sobrepostas do próprio acompanhamento.
- Ao receber estado `open`, mostra “Conectado”, remove o QR e confirma o sucesso.
- O acompanhamento para após três minutos ou três falhas consecutivas e explica como tentar novamente.
- A consulta manual continua disponível. Os temporizadores são encerrados ao sair da tela ou trocar a instância.

## Aparência e responsividade

- Campos de autenticação usam a superfície do tema: branco no modo claro e escuro no modo escuro, inclusive no preenchimento automático do navegador.
- Menu recolhível em celular/tablet, com identificação acessível e fechamento ao escolher uma página.
- Painéis, botões, foco dos campos e espaçamentos padronizados nos componentes compartilhados.
- Configuração do WhatsApp em uma coluna nas telas menores, QR adaptável e botões de altura normal no celular.
- Cabeçalho ajustado para acomodar o seletor de tema e a identificação do usuário.

## Validação

- Build de produção e TypeScript aprovados.
- Quatro testes de navegador focados aprovados: renovação e concorrência; renovação revogada e indisponibilidade; confirmação automática do QR; login claro e menu móvel.
- Teste visual repetido após corrigir os botões móveis e o cabeçalho. Capturas em 390 e 1440 pixels revisadas.
- Lint executado: três avisos preexistentes em BeneficiaryPortal e Registries; nenhum aviso nas alterações desta entrega.
- Os testes de navegador usam respostas controladas da API. Não foi necessário desconectar nem escanear novamente o WhatsApp real para validar o fluxo do frontend.

## Como usar

Se estiver usando `npm run dev`, atualize o navegador com Ctrl+F5. Se estiver servindo os arquivos de produção, use a nova pasta `dist`, gerada pelo build. O backend continua em 8080 e não exige alteração para esta entrega.
