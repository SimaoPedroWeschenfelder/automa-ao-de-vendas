# Continuidade da Pulse

## Publicação concluída — 05/11/2026

- Site: https://pulse-vendas-demo.netlify.app/
- Painel publicado: 1.4.0. Conector preservado em 0.5.2.
- Commit de produção: ae7e3c02f29923e033eda075134a53dbb52150f1.
- Netlify deploy: 6aecd9488c00cb809e1fa43d, confirmado como **Published deploy**.
- Detalhes: https://app.netlify.com/projects/pulse-vendas-demo/deploys/6aecd9488c00cb809e1fa43d
- release.json público verificado: b270d8780d1cd28d1ddee5a9957fc883507da66d49bd1ec4d9fffd687f774bab, igual ao build local.
- 55 testes aprovados, conector/ZIP conferidos e hook de commit aprovado. Interface pública carregou sem erros de console.
- Captura: ../pulse-publicado-netlify.png. A aba pública foi deixada aberta; abas auxiliares foram fechadas.

O usuário autorizou expressamente o envio do commit para main e a publicação. Foi feito push normal, sem force, pelo Git local. Netlify publicou automaticamente em 11 segundos. Nenhum repositório foi desvinculado nem foram criadas credenciais adicionais.

## Retomar o desenvolvimento

Pasta canônica: outputs/Pulse. Repositório: https://github.com/SimaoPedroWeschenfelder/automa-ao-de-vendas.git. Trabalhar na branch dev/ambiente-vscode; main acompanha a versão publicada. A branch de desenvolvimento também guarda este registro após o commit de produção.

- npm start: painel em http://127.0.0.1:4180/
- npm run check: testes, compatibilidade e correspondência entre extension/ e pulse-conector.zip.
- npm run build: valida e gera dist/ com 14 arquivos públicos e ../pulse-publicacao.zip.
- npm run package:connector: reconstruir o ZIP somente após alterar extension/.
- VS Code: Ctrl+Shift+B valida; F5 inicia um servidor. Não iniciar várias instâncias simultaneamente.

O build normaliza HTML/CSS/JS/SVG para produzir os mesmos bytes em Windows e Linux. A pasta dist/ fica ignorada no Git; Netlify usa npm run build e publica dist/. Arquivos locais, configuração do editor, credenciais e fontes de desenvolvimento não entram no pacote público.

A integração GitHub do plugin está na conta Tiago e tem apenas leitura deste repositório. O Git Credential Manager local tem acesso autenticado do proprietário. Usar Git local para commits/push; não enviar fontes pelo editor web do GitHub.

## Produto e limites atuais

Estoque, busca, filtro, cadastro em duas etapas e aviso persistente de preparação. Sem simulação, métricas repetidas, roteiro ou Webmotors. Dados e fotos ficam no IndexedDB deste navegador/origem, sem login ou sincronização remota. Backup JSON no rodapé.

Banco operacional: pulse-workspace-v1. O banco pulse-public-demo-v1 foi preservado: exemplos padrão ficam separados e cadastros próprios migram como rascunhos com revisão obrigatória. Fotos reais são exigidas para preparar; não entram imagens ilustrativas ou texto de teste na descrição.

Preparar abre uma aba por carro, preenche e aguarda revisão humana. Publicação é manual no Facebook. O painel registra o link do anúncio publicado; marcar vendido atualiza apenas o estoque local. Não prometer retirada automática.

O usuário relatou que alguns carros preencheram no Facebook. Esta publicação validou o site e o pacote, sem novo envio de veículo à plataforma. Antes de modificar o preenchimento, testar campos, foto, cidade, preço, relatório, aviso e repetição do clique com uma extensão ativa e um cadastro autorizado. Não publicar um anúncio como parte do teste sem autorização específica.

As pastas ../pulse-demo e ../marketplace-piloto são arquivos históricos, não fontes ativas.
