# Entre nós

Um convite de Vinícius para Jennifer, com jeito de diário de viagem: fotografias de Minas, papel claro, verde profundo, terracota e detalhes desenhados em SVG.

## Abrir

Abra `index.html` no navegador. Não precisa instalar dependências nem executar uma compilação. As fotografias e as ilustrações estão incluídas no projeto; as fontes do Google Fonts usam a internet e têm alternativas locais.

Se preferir um servidor local, execute na pasta do projeto:

```sh
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## A experiência

1. **O convite:** uma abertura breve com fotografias dos destinos.
2. **A cartinha:** envelope em SVG e uma carta com a lembrança de São João del-Rei e do Fuscas Lanches.
3. **O destino:** escolha entre Ouro Preto, São Thomé das Letras e São João del-Rei.
4. **Nosso ritmo:** escolha de programa e combinado na mesma etapa.
5. **Nossa passagem:** rota de São João del-Rei até o destino escolhido, mensagem final própria para cada cidade, selo do Fuscas Lanches, bilhete para guardar em PNG e resposta pelo WhatsApp.

As escolhas permanecem ao voltar e recarregar na mesma sessão, quando o navegador permite `sessionStorage`. O botão “Recomeçar o convite” limpa o progresso. Não há servidor de dados nem rastreamento.

O WhatsApp abre uma mensagem com o destino, o programa e o combinado. A pessoa confere e envia a mensagem no próprio aplicativo. “Copiar resposta” também oferece uma alternativa manual se o navegador bloquear a área de transferência.

“Guardar nossa passagem” gera uma imagem PNG com a fotografia, a origem, o destino, as companhias, o programa, o combinado e os créditos da foto. O arquivo é preparado no próprio navegador, sem enviar as escolhas a serviços externos. As imagens de exportação só são carregadas ao tocar no botão. O download inclui a lembrança “Do Fuscas Lanches para o mundo”.

## Pelo celular

O convite usa uma coluna em telas de até 960 px, incluindo celulares deitados. A barra compacta indica a etapa atual; os controles têm áreas de toque de pelo menos 44 px. Os textos, a carta e os campos da passagem foram ampliados. As fotos usam versões responsivas de 480 e 800 px, além dos originais para telas que precisarem de mais resolução.

As margens consideram os recortes e a barra inferior do aparelho. As ações de escolha ficam próximas da parte inferior da tela, acompanhadas de uma orientação sobre o que falta selecionar. Em paisagem com pouca altura, voltam ao fluxo normal para deixar espaço para o conteúdo. A carta usa a rolagem da própria página, sem uma janela de leitura separada. O zoom por gesto permanece habilitado.

No celular, “Guardar nossa passagem” abre uma prévia. É possível tocar e segurar a imagem, usar “Baixar imagem” ou compartilhar o PNG pelo menu nativo quando o navegador oferecer suporte. O compartilhamento só acontece após um toque nesse botão. O download direto continua disponível no computador. Caso o navegador não ofereça diálogo nativo ou compartilhamento de arquivos, a prévia tem alternativas locais para fechar e salvar.

## Personalizar

O início de `script.js` contém `CONFIG`:

- `recipientName`: quem recebe o convite.
- `senderName`: quem faz o convite.
- `whatsappNumber`: DDI + DDD + número. Já configurado com o contato fornecido e DDI 55.
- `personalNote`: a lembrança que aparece na carta. Deixe uma string vazia para omitir.

Os textos ficam em `index.html`; os rótulos das respostas e os dados dos destinos, em `script.js`; a apresentação, em `styles.css`. O número e os textos no código ficam acessíveis a visitantes de uma publicação estática.

Os textos finais de cada cidade ficam em `DATA.destination`, nos campos `finalMessage` e `finalNote`, em `script.js`. A imagem para guardar é desenhada por `ticket-export.js`, usando versões das fotografias embutidas em `assets/ticket-photos.js`. Essas imagens locais permitem preparar o PNG também ao abrir o convite por `file://`.

## Fotografias e SVGs

As três fotografias foram baixadas do Wikimedia Commons e ficam em `assets/photos/`, somando aproximadamente 560 KB. O site não depende de links externos para exibi-las.

| Destino | Autoria e fonte | Licença |
| --- | --- | --- |
| Ouro Preto | [Sandra Martins](https://commons.wikimedia.org/wiki/File:Ouro_Preto,_Minas_Gerais.jpg) | CC BY-SA 4.0 |
| São Thomé das Letras | [Moacir Guerino](https://commons.wikimedia.org/wiki/File:S%C3%A3o_Thom%C3%A9_das_Letras_uma_terra_m%C3%ADstica_Parte_2.jpg) | CC BY-SA 4.0 |
| São João del-Rei | [Nádia Muniz](https://commons.wikimedia.org/wiki/File:Centro_hist%C3%B3rico_e_vista_parcial_da_Igreja_de_Nossa_Senhora_do_Carmo_em_S%C3%A3o_Jo%C3%A3o_del-Rei_(MG).jpg) | CC BY-SA 4.0 |

A [licença CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) aplica-se às fotografias. As fotos de Ouro Preto e São Thomé foram redimensionadas e comprimidas; na apresentação, as três recebem recorte e ajuste de saturação por CSS. Fontes, dimensões e alterações constam em `assets/photos/credits.json` e no rodapé do convite. Preserve os créditos e a licença ao redistribuir as fotos ou suas adaptações.

Os ícones, o envelope, a bússola, os traços e o código de barras são SVGs locais, embutidos no HTML. As ilustrações originais das cidades continuam em `assets/` como reserva caso uma foto não carregue.

## Publicar no GitHub Pages

Envie `index.html`, `styles.css`, `script.js`, `ticket-export.js`, `.nojekyll` e a pasta `assets/` completa para a raiz de um repositório. Nas configurações do repositório, habilite Pages para a branch principal e a pasta raiz. Não é necessário build.

## Verificação

O fluxo foi verificado em DOM simulado, incluindo as 27 combinações de escolhas, bloqueio de avanço sem seleção, carta, bilhete, WhatsApp, edição, reinício, recuperação de sessão e alternativa de cópia manual. Uma rodada focada verificou os finais das três cidades, os rótulos selecionados e os estados de sucesso, falha e nova tentativa do download. Sintaxe JavaScript, referências locais e estrutura do CSS também foram verificadas.

A adaptação móvel teve testes de comportamento com larguras simuladas entre 320 e 1024 px, incluindo foco, orientações de seleção, prévia, download, compartilhamento disponível/indisponível, cancelamento, fechamento e retorno ao convite. Os pontos de quebra, as áreas de segurança, o tamanho dos alvos e o refluxo com texto ampliado foram revisados no CSS; isso não substitui uma inspeção visual em Safari/Android reais.

O exportador foi executado com Canvas nativo fora do navegador, gerando PNGs reais de 1080 × 1500 pixels para os três destinos. As imagens foram inspecionadas visualmente. A revisão da página e do download dentro de um navegador não foi possível no ambiente desta sessão.
