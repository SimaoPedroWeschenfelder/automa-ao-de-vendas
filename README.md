# Pulse — Impulsionando vendas

Painel público de estoque, com dois modos explícitos:

- **Facebook real (padrão):** abre o formulário do Marketplace e solicita o preenchimento à extensão Pulse 0.5.1 no mesmo navegador. Publicar é uma ação manual, feita pelo usuário no Facebook.
- **Simulação:** demonstra preparação, revisão, publicação e venda sem atuar nas plataformas externas.

O site não exige login. Para preencher no Marketplace, o usuário precisa estar conectado ao Facebook no próprio navegador e ter o conector instalado. O site não recebe senhas, cookies ou tokens da conta.

## Primeira conexão ao Facebook

1. Baixe `pulse-conector.zip` no painel e extraia o arquivo.
2. No Chrome ou Edge, abra a página de extensões, ative Modo do desenvolvedor e use **Carregar sem compactação** na pasta que contém `manifest.json`.
3. Se já usa o protótipo anterior nesta pasta, recarregue a extensão para ativar a versão 0.5. O nome passa a ser **Pulse • Conector Marketplace**.
4. Atualize `https://pulse-vendas-demo.netlify.app/` no mesmo navegador. O painel deve mostrar **Conector Pulse conectado**.
5. Entre no Facebook e clique **Preparar** no veículo. O conector abre a aba em segundo plano, preenche os campos identificados e envia as fotos.
6. Confira o relatório, os campos e as miniaturas no Facebook. O conector não clica em **Avançar**, **Publicar**, **Excluir** ou **Marcar como vendido**.

Sem o conector, clicar em Preparar abre o formulário do Facebook e mostra as instruções de conexão. Isso não é apresentado como preenchimento concluído. O indicador verde depende do relatório do conector; pendências ficam amarelas e falhas ficam vermelhas.

## Dados de apresentação

Há seis veículos fictícios, com imagens ilustrativas geradas por IA. As especificações são exemplos, não uma ficha técnica verificada nem uma oferta comercial. Os exemplos podem ser usados para testar o formulário **sem publicar**. No teste real a descrição recebe o aviso **TESTE DE DEMONSTRAÇÃO PULSE — NÃO PUBLICAR**.

A imagem de cada exemplo é extraída individualmente da folha de imagens antes de ser enviada ao formulário. Fotos adicionadas pelo usuário são preservadas. Dados e fotos ficam no IndexedDB do navegador; ao preparar no modo real são enviados ao formulário do Facebook e podem ser processados pela Meta antes da publicação.

Restauração da demo remove somente os dados deste painel neste navegador. Ela não fecha nem apaga rascunhos do Facebook. Publicação e retirada automáticas não fazem parte desta versão. Webmotors continua sendo apenas uma opção de simulação.

## Segurança do conector

O conector aceita comandos apenas da origem publicada exata e dos painéis locais de desenvolvimento. Os registros são separados por origem. O script do Facebook atua somente em abas vinculadas por uma tarefa criada pelo painel. Não há leitura de credenciais nem acesso liberado a outros sites Netlify.

O painel escolhe uma instância do conector e direciona os comandos para ela. Isso impede que duas cópias instaladas abram duas abas para o mesmo pedido. A versão 0.5.1 usa comandos novos que a 0.5.0 ignora; recarregue a extensão atualizada e o painel para ativar a correção.

## Rodar e verificar

Requer Node.js 20 ou superior, sem instalação de dependências:

```sh
npm test
npm start
```

Abra `http://127.0.0.1:4180`. O conector também aceita esse endereço para desenvolvimento. Para o teste da integração funcionar, carregue a extensão no mesmo navegador usado para abrir o painel.

Os testes do site cobrem os dados, o fluxo de simulação, estados retornados pelo conector e a preparação das fotos. O ZIP do conector inclui os testes do gerenciador de tarefas, validação e restrição por origem. Testes simulados não substituem a validação da interface atual do Facebook.

## Netlify e repositório

Publicação a partir da branch `main`, comando `npm test`, pasta `.` conforme `netlify.toml`. Não há variáveis de ambiente, banco remoto ou autenticação do painel. O controle de acesso do repositório pode ser administrado pelo proprietário independentemente da demonstração pública.

`pulse-prototipo-extensao.zip` preserva a versão anterior Pátio 0.4 para referência. O arquivo atualizado é **pulse-conector.zip**.

Prompts e origem das imagens: `ASSETS.md`. Sem licença de redistribuição definida pelo proprietário.
