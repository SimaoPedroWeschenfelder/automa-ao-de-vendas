# Continuidade da Pulse

## Estado atual — 04/11/2026

O usuário pediu uma interface menor e a saída da demonstração para uso real. Painel 1.4.0, conector preservado em 0.5.2.

- Pasta canônica: `outputs/Pulse`. Branch `dev/ambiente-vscode`, base `origin/main` 6522ffe.
- Mudanças ainda sem commit/push. Produção no Netlify não foi atualizada.
- Sem sidebar, métricas, roteiro, simulação ou Webmotors. Estoque, busca, filtro, cadastro em duas etapas e aviso persistente de preparação.
- Dados operacionais no novo IndexedDB `pulse-workspace-v1`; banco da demo preservado. Copia cadastros próprios como rascunhos com revisão obrigatória; exemplos padrão não entram no estoque real.
- Envio real exige campos essenciais e foto própria. Não injeta texto de demonstração nem usa imagem ilustrativa.
- Publicação é manual no Facebook. O painel registra o link do anúncio; venda atualiza apenas o estoque local. Não prometer exclusão automática.
- Backup JSON pelo rodapé; armazenamento continua local, sem login ou sincronização entre dispositivos.
- Conector e ZIP não foram alterados nesta revisão. Módulos compartilhados continuam sincronizados.

## Validação

Validação final: 52 testes passaram em npm run check, ZIP e fontes do conector 0.5.2 conferidos.

Foi recuperado o navegador por `browser-client.mjs` do plugin Browser, via Node REPL. `setupBrowserRuntime()` retorna o agente (não injeta global). IAB id 2, aba 1 em 127.0.0.1:4180. A interface carregou sem erros de console. Cadastro passou da etapa 1 para a 2, preservou dados ao voltar e foi cancelado sem salvar. Revisão em 320 px não apresentou transbordamento horizontal do formulário. Captura final em ../pulse-uso-real.png. Viewport temporária restaurada ao encerrar.

O usuário relatou que alguns carros preencheram no Facebook. Não foi feito novo envio real nesta revisão. Aviso de conclusão foi validado nas regras automatizadas de transição; validar com o conector antes de publicar. Não usar o controle Windows para contornar o bloqueio anterior de identificação de URL.

## Fluxo de trabalho

Continuar a conversa aqui, editar arquivos locais vistos no VS Code. Ctrl+Shift+B valida; F5 ou npm start inicia somente um servidor 4180. Git pelo repositório local, sem upload pelo editor web do GitHub. Não mexer na outra janela/projeto do usuário. Não alterar as cópias arquivadas em pulse-demo/marketplace-piloto.

## Reativação — 05/11/2026

Usuário autorizou explicitamente publicar a Pulse no Netlify para continuar o trabalho em breve. Site existente https://pulse-vendas-demo.netlify.app/ está acessível, mas ainda na versão antiga. Publicação da 1.4.0 está aguardando login no painel Netlify.

- npm run build passou com 54 testes e conferência do conector 0.5.2.
- Novo scripts/build-site.mjs gera dist/ com 14 arquivos e ../pulse-publicacao.zip. Lista explícita impede publicação de fontes de desenvolvimento, credenciais ou arquivos locais.
- netlify.toml agora usa npm run build e pasta dist/. O ZIP inclui _headers equivalente aos cabeçalhos configurados e release.json com versão/hash.
- Pacote 1.4.0: SHA-256 de conteúdo 5ac537d7d05899902bad4a84b3a45ae07f5803f128a1bae345dca2f1d03e96d3.
- CLI Netlify e gh não estão instaladas, sem configuração de autenticação Netlify local. Navegador IAB disponível por cua_repl; nenhum Chrome/Edge conectado à API de navegador nesta retomada.
- Login do Netlify encaminhou a GitHub/Google e ainda está na tela de identificação. Usuário respondeu que entrou; foi solicitado esclarecer se concluiu a autenticação ou usou outro navegador. Não preencher credenciais por suposição.

### Publicação pelo Git local

Login Netlify concluído na conta proprietária. A integração GitHub do plugin continua sem push, porém o Git Credential Manager local tem acesso ao repositório. Dry-run autenticado passou sem envio de alterações; origin/main continua na base 6522ffe. Publicar pelo Git local, mantendo o vínculo GitHub/Netlify existente. Não desvincular o repositório nem criar credenciais adicionais.

O build normaliza finais de linha de HTML/CSS/JS/SVG para que Windows e Linux gerem os mesmos bytes. Conferir o hash final em dist/release.json e no site após o deploy.

Build final conferido: 55 testes aprovados; versão 1.4.0; hash b270d8780d1cd28d1ddee5a9957fc883507da66d49bd1ec4d9fffd687f774bab. Próxima ação: commit local e envio sem force para main, autorizado pelo pedido de publicação de 05/11. Depois validar o deploy e release.json no endereço público.
