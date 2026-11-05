# Pulse — estoque e anúncios

Painel de uso real para cadastrar veículos e preparar o formulário do Facebook Marketplace com o conector Pulse 0.5.2. A revisão e a publicação são feitas pelo responsável no Facebook.

## Fluxo

1. Cadastre os dados e as fotos reais do veículo.
2. Clique em **Preparar**. O conector abre uma aba em segundo plano e preenche o formulário.
3. Aguarde o aviso verde **Para revisar**. Pendências e falhas têm estados próprios.
4. Revise e publique pelo Facebook. Na Pulse, use **Já publiquei · registrar link** para registrar o anúncio existente.
5. Após a venda, **Marcar vendido** atualiza o estoque local. A remoção ou atualização do anúncio é feita no Facebook; não há retirada automática nesta versão.

Não há modo de simulação nem veículos fictícios no estoque operacional. Webmotors não está disponível nesta versão.

## Dados locais

O painel não exige login e não tem servidor de cadastros. Os dados e as fotos ficam no IndexedDB deste navegador e desta origem; não são compartilhados entre computadores. Ao preparar um anúncio, os dados e as fotos são enviados ao formulário do Facebook pela extensão. Senhas, cookies e tokens da conta não são lidos pelo painel.

Use **Baixar backup** no rodapé para exportar um JSON com os cadastros e fotos. Não limpe os dados do navegador sem guardar uma cópia.

A versão operacional usa o banco `pulse-workspace-v1`. O banco antigo `pulse-public-demo-v1` é preservado. Os seis exemplos padrão ficam no banco antigo; cadastros próprios são copiados para o novo estoque como rascunhos que exigem revisão. Não há promoção de publicação simulada para anúncio real. Fotos do usuário são preservadas. Registros anteriores editados sobre um dos seis IDs de exemplo continuam preservados no banco antigo.

## Conector

Baixe o ZIP pelo botão de conexão, extraia e carregue a pasta com `manifest.json` nas extensões do Chrome ou Edge em **Carregar sem compactação**. Se já está instalado, recarregue a mesma cópia. Use o painel no navegador onde o Facebook está conectado.

O conector aceita somente a origem publicada exata e os painéis locais autorizados. Os comandos são direcionados a uma única instância, evitando duas abas quando há cópias instaladas. O conector não clica em Publicar, Excluir ou Marcar vendido.

## Desenvolvimento

Requer Node.js 20 ou superior, sem dependências:

```sh
npm start
npm run check
```

Painel local: `http://127.0.0.1:4180/`. Fluxo do editor: [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md). Fonte da extensão: `extension/`. Reconstrua o ZIP com `npm run package:connector` somente quando alterar esses fontes.

`npm run check` confere o ZIP, os módulos compartilhados, a migração de dados, as regras de preparação, os retornos do conector e o registro de publicação/venda. Testes automatizados não comprovam a interface atual do Facebook.

A branch de desenvolvimento não publica automaticamente. O Netlify acompanha `main`, com comando `npm run build` e pasta `dist`. Esta revisão ainda precisa de validação real antes de publicar.

## Publicação preparada em 05/11/2026

`npm run build` valida o projeto e gera `dist/` somente com os arquivos públicos. Também cria `../pulse-publicacao.zip` para atualização manual do site existente no Netlify. O arquivo `release.json` identifica a versão e o hash da publicação. Credenciais, configuração do editor, arquivos de trabalho e dados do navegador ficam fora do pacote.
