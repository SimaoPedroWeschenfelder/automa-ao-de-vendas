# Desenvolvimento local da Pulse

A pasta atual é o repositório canônico, na branch `dev/ambiente-vscode`. Painel na raiz e conector em `extension/`.

- **Ctrl+Shift+B**: `npm run check`, incluindo testes e correspondência ZIP/fontes.
- **F5** ou **Pulse: Iniciar painel local**: inicia `http://127.0.0.1:4180/`. Use só uma opção para evitar conflito de porta.
- **Pulse: Atualizar ZIP do conector**: `npm run package:connector`, necessário após editar `extension/`.

Não é preciso instalar dependências. Não use Live Server em outra porta: a integração local é autorizada em 4180.

## Validar o painel

A versão 1.4 opera com cadastros reais. Não injete exemplos no banco operacional para fazer uma apresentação. Testes automatizados usam fixtures isoladas. Conferir cadastro, campos obrigatórios, fotos, busca, filtros, backup e layout em telas estreitas. Não substituir fotos reais por imagens ilustrativas.

## Validar a integração

Use uma só extensão Pulse ativa e o painel no mesmo navegador onde o Facebook está conectado. Teste um cadastro autorizado pelo usuário. Confira uma aba por veículo, campos, foto, cidade, preço, aviso no painel, relatório e repetição do clique. Não clique em Publicar como parte de um teste sem autorização específica.

A preparação é automática; a publicação continua manual no Facebook. Registrar link e marcar vendido no painel não publicam nem removem anúncios da plataforma.

## Revisar e commitar

```sh
npm run check
git diff
```

Use o Source Control do VS Code ou Git local. O hook `.githooks/pre-commit` valida uma cópia exata do conteúdo preparado para commit. Se um fonte ou ZIP for esquecido, o hook impede o commit incoerente. Ao clonar, ative-o com `git config core.hooksPath .githooks`.

O Netlify acompanha `main`. Commit/push na branch de desenvolvimento não autoriza merge ou publicação. Testes de unidade não substituem o teste real do Marketplace. As cópias em `pulse-demo` e `marketplace-piloto` são arquivo, não fontes ativas.
