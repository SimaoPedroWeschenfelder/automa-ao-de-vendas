# Pulse — Impulsionando vendas

Demo pública de gestão de estoque e preparação de anúncios de veículos, sem login.

## O que está demonstrado

- Seis veículos fictícios com imagens ilustrativas geradas por IA.
- Busca, filtros, ordenação e seleção de veículos.
- Cadastro em três etapas com fotos e descrição a partir dos dados informados.
- Preparação simulada em segundo plano, com progresso e indicadores de situação.
- Revisão, publicação e venda **simuladas**.
- Histórico de atividade e restauração dos exemplos para uma nova apresentação.
- Layout responsivo e dados persistidos em IndexedDB no navegador de cada visitante.

Esta versão não envia anúncios ao Facebook ou à Webmotors, não lê contas externas e não contém credenciais. As imagens e as informações dos exemplos não representam ofertas comerciais. As especificações são dados de demonstração, não uma ficha técnica verificada.

## Rodar localmente

Requer Node.js 20 ou superior. Sem instalação de dependências:

```sh
npm test
npm start
```

Abra `http://127.0.0.1:4180`. Não abra o HTML com `file://`, pois o projeto usa módulos JavaScript.

## Publicar no Netlify

Conecte este repositório e use as configurações de `netlify.toml`: comando `npm test`, diretório de publicação `.`. Também é possível enviar os arquivos prontos em um ZIP por Netlify Drop. Não há variáveis de ambiente, banco remoto ou configuração de login.

Os dados são individuais por navegador. Compartilhar o endereço não compartilha os cadastros locais dos visitantes. Use somente dados fictícios em apresentações públicas e mantenha os arquivos originais das fotos; limpar o navegador remove as alterações locais.

## Roteiro para apresentar

1. Abra **Conhecer a demo** e explique que se trata de uma simulação.
2. Prepare o **Volkswagen T-Cross**. O painel continua disponível durante a preparação.
3. Acompanhe o indicador verde e abra **Revisar anúncio**.
4. Confira a descrição e clique **Simular publicação**.
5. Clique **Marcar vendido** e confirme a venda simulada.
6. Explore a atividade, o filtro de vendidos e o cadastro de um novo veículo.
7. Use **Restaurar demonstração** antes da próxima apresentação.

## Protótipo de extensão

`pulse-prototipo-extensao.zip` preserva o código e os testes do protótipo experimental anterior, ainda identificado como Pátio 0.4. Ele é independente desta demo e não está conectado ao site público. Validar a automação no Facebook real, permissões da plataforma, autenticação, publicação e retirada automática são etapas de um produto futuro, não resultados demonstrados aqui.

## Verificação

`npm test` verifica os exemplos, as condições para concluir a preparação, a sequência de aprovação/venda, busca, ordenação, recuperação de interrupções e validação dos dados. O fluxo visual também deve ser verificado em navegador antes de publicar.

Sem licença de redistribuição de software definida pelo proprietário do repositório.
