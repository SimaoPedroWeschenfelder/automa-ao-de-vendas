# Desenvolvimento da Pulse

Ao retomar o trabalho, leia `CONTINUIDADE.md` e `DESENVOLVIMENTO.md`.

- Esta pasta é o repositório de trabalho. Painel na raiz; fonte do conector em `extension/`.
- Desenvolva em uma branch `dev/`. A produção no Netlify acompanha `main`.
- Edite os arquivos locais e use o Git do repositório ou o Source Control do VS Code. Não envie arquivos pelo editor web do GitHub.
- Antes de commitar, rode `npm run check`. Ao alterar `extension/`, gere o ZIP com `npm run package:connector` e valide novamente.
- Preserve `.gitattributes`: os bytes de `extension/` não sofrem conversão automática de fim de linha pelo Git, para corresponder ao ZIP em qualquer checkout; hooks usam LF.
- `bridge-client.js`, `model.js` e `task-state.js` existem no painel e na extensão; alterações funcionais precisam ser mantidas coerentes.
- Mudanças na integração exigem também teste real: uma extensão Pulse ativa, uma aba de painel em `http://127.0.0.1:4180/`, um carro fictício e uma aba nova do Marketplace. Confira campos, foto, relatório e repetição do clique. Não publique os exemplos.
- Testes automatizados aprovados não comprovam o preenchimento real do Facebook. Informe essa diferença no resultado.
- Commit e push numa branch de desenvolvimento não autorizam merge em `main` ou publicação. Siga a autorização da conversa.
- Preserve as cópias anteriores fora deste repositório como arquivo; não as use como fontes de uma nova versão.
