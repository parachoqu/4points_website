# Fotografias dos novos uniformes — 4Points

Atualização local de 12/09/2026. Seis fotografias geradas com a ferramenta nativa `image_gen`, usando os dois mockups de uniforme e a prancha oficial de logos fornecidos pelo usuário. As imagens representam uma equipe em atividade; não identificam funcionários reais nem documentam serviços executados.

## Inventário e substituição

O site utiliza nove fotografias distintas em 17 posições, além de uma logo em duas posições e do favicon. As seis fotografias com pessoas foram substituídas nas suas 14 posições.

| Fonte anterior em `assets/images/` | Uso e função visual | Resultado |
| --- | --- | --- |
| `hero-commercial.jpg` | Primeiro slide: apresentação da operação comercial; equipe com roupas vermelhas ao lado da van | `hero-commercial-uniformes-20260912.jpg`: dupla preparando equipamentos, polo azul-marinho e polo off-white |
| `hero-floor-care.jpg` | Segundo slide: corredor com piso polido, demonstra acabamento; sem pessoas | Preservada |
| `hero-residential.jpg` | Terceiro slide, card Move-In/Move-Out e sua capa mobile: serviço residencial; pessoa descalça em roupa doméstica | `hero-residential-uniformes-20260912.jpg`: profissional aspirando residência, polo off-white |
| `commercial-cleaning.jpg` | Card Commercial e capa mobile: execução do serviço; uniforme de outra marca em depósito | `commercial-cleaning-uniformes-20260912.jpg`: profissional com camiseta azul-marinho limpando escritório |
| `floor-care.jpg` | Card Floor Care, fundo da seção e capa mobile: trabalho no piso; fotografia monocromática com pessoas parcialmente enquadradas | `floor-care-uniformes-20260912.jpg`: profissional de polo azul-marinho operando enceradeira |
| `residential-cleaning.jpg` | Card Residential, seção residencial e capa mobile: cuidado doméstico; roupa casual e meias | `residential-cleaning-uniformes-20260912.jpg`: profissional com camiseta off-white de gola V limpando uma sala |
| `after-floor.jpg` | Card Post-Construction e capa mobile: resultado de acabamento; pessoa pequena ao fundo na recepção | `post-construction-uniformes-20260912.jpg`: limpeza final de recepção, polo azul-marinho e piso em destaque |
| `vinyl-floor-before.png` | Comparador: estado desgastado do piso; sem pessoas | Preservada |
| `vinyl-floor-after.png` | Comparador: acabamento renovado; sem pessoas | Preservada |
| `LOGO TIPOGRAFICA.png` | Cabeçalho e rodapé: identificação institucional | Preservada |
| `favicon.png` | Identificação da aba do navegador | Preservado |

Depoimentos utilizam iniciais, sem retratos. O dossiê da seção Floor Care é HTML/CSS. Ícones SVG, ruído e grafismos CSS continuam como estavam. `before-floor.jpg`, `4points-floorcare-dossier-behance.png` e capturas históricas não eram referenciados pela página e não foram alterados.

## Uniformes e marca

- Calças de trabalho azul-escuras em todas as cenas, com tecido visivelmente azul e calçado fechado.
- Polos e camisetas seguem gola, mangas, cor e posição da marca dos mockups. Não foram acrescentadas estampas nas costas ou nas mangas.
- Logo branca sobre azul-marinho e logo azul-marinho sobre off-white, com os acentos teal/dourado da prancha oficial. O gerador recebeu a arte fornecida como referência; não foram usados os antigos estudos de logo da pasta `exports`.
- Aplicação visual no peito esquerdo, sem fundo retangular, com perspectiva, textura e dobras do tecido. Nenhum telefone, endereço, slogan ou legenda foi incluído nas fotos.
- Ambientes claros e organizados; pessoas concentradas em tarefas, com uma dupla visualmente consistente entre as cenas.

As referências recebidas foram preservadas em [references/](references/). Os seis arquivos gerados originais estão em [masters/](masters/) e os prompts integrais em [prompts/](prompts/). [generation.json](generation.json) relaciona cada geração, prompt, arquivo mestre e JPEG usado pelo site. Nenhuma API por CLI foi utilizada.

## Integração e recortes

As referências CSS inline de `index.html` foram atualizadas para nomes versionados. Os arquivos antigos permanecem disponíveis para reversão, mas não são mais carregados nas 14 posições substituídas. O restante do HTML é idêntico, descontadas as versões de cache de CSS/JS.

O JavaScript não foi editado. O CSS recebeu somente ajustes de posição da fotografia: fundo Floor Care, cards Commercial/Residential, imagem residencial no mobile e capas Commercial/Residential. Dimensões dos componentes, estrutura, controles, cores, tipografia e camadas de contraste foram preservados.

Floor Care passou a utilizar uma fonte horizontal, com profissional e equipamento concentrados no centro. Essa escolha evita ampliar uma faixa estreita de uma foto vertical no fundo largo; os cards mantêm o mesmo formato e fazem o recorte com `background-size: cover`. As demais fontes mantêm a orientação anterior. As exportações JPEG usam RGB, qualidade 92, compressão otimizada e carregamento progressivo, sem ampliação artificial de resolução.

As seis fotos servidas somam **1.597.189 bytes** (aproximadamente 1,6 MB); as seis anteriores somavam 2.565.402 bytes. Os nomes novos resolvem o cache de imagens. O script existente de cache de CSS/JS foi executado e sua segunda execução não alterou referências.

## Evidências e reversão

- [baseline.json](baseline.json): dimensões, tamanhos e SHA-256 dos arquivos originais antes da edição.
- [structural-verification.json](structural-verification.json): preservação dos 13 arquivos de imagem originais, JavaScript idêntico, contagem das 14 referências e equivalência do HTML fora das URLs/cache.
- [browser-verification.json](browser-verification.json): resultados individuais dos testes locais; observações finais de revisão em `validation.md`.
- [captures/](captures/): capturas por estado da página, incluindo comparativos anteriores quando disponíveis.

Para reverter somente esta atualização, restaurar as 14 URLs originais usando a tabela, retirar os ajustes de posição da fotografia em `style.css` e executar `node scripts/cache-bust.js`. Os arquivos antigos continuam byte a byte iguais ao baseline. Não usar reset global em uma árvore que tenha recebido outros trabalhos.

Esta entrega não inclui commit, push ou publicação em produção.
