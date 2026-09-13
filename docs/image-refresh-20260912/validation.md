# Verificação local — 12/09/2026

Resultado: seis fotografias integradas nas 14 posições previstas. Revisão realizada em Chromium local, usando `agent-browser`, sem publicação ou envio de formulário.

| Verificação | Evidência / resultado |
| --- | --- |
| Todas as fotos ativas carregam | As nove fontes fotográficas retornaram HTTP 200 e foram decodificadas pelo navegador |
| Referências substituídas | 14 referências novas; zero referências às seis fontes antigas em `index.html` |
| Preservação | 13 imagens originais com SHA-256 idêntico ao baseline; `script.js` idêntico; HTML equivalente após normalizar URLs das fotos e hashes de cache |
| Alterações de CSS | Somente `background-position` e comentários associados; dimensões, layout, tipografia, controles e overlays preservados |
| Responsividade | Sem overflow horizontal em 1440×900, 1920×1080, 916×900, 768×1024, 320×568, 390×844 e 430×932 |
| Hero | Três estados verificados no desktop e nos três tamanhos mobile; navegação por teclado avança 0 → 1 → 2 |
| Cards | Cinco cards finais com imagens corretas e largura visível conferida no desktop e mobile; cinco expansões por Enter confirmadas com `aria-expanded=true` |
| Capas mobile | Cinco capas em cada uma das três larguras mobile; abertura com estado ARIA correto, retirada de `inert`, bloqueio de rolagem e fechamento por Escape liberando o bloqueio |
| Floor Care e Residential | Fotografias conferidas no desktop e nas três larguras mobile, incluindo o novo recorte superior das fotos verticais |
| Antes/depois | Fontes preservadas; tecla ArrowRight altera o range de 50 para 51 |
| FAQ | Abertura confirmada com `aria-expanded=true` |
| Console | Sem erros de página ou mensagens de console nas verificações finais |
| Código e cache | `node --check script.js`, `git diff --check` e segunda execução idempotente de `node scripts/cache-bust.js` passaram |

## Método e limites da evidência

O navegador integrado não estava disponível; foi utilizado um Chromium temporário. Os tamanhos mobile foram simulados por viewport. Essa verificação não é um teste em iPhone físico ou Safari.

A automação de mouse encontrava a captura de ponteiro do carrossel ao tentar abrir cards em largura de telefone. Por isso, a abertura das capas foi exercitada pela ativação DOM dos próprios elementos, que executa os listeners existentes; o fechamento foi feito com Escape. A navegação do Hero e a expansão dos cinco cards desktop foram exercitadas por teclado. Não foi necessário modificar o JavaScript.

A primeira captura automática de alguns cards coincidiu com o avanço do carrossel. A rodada final pausou o autoplay por foco, confirmou que cada card estava visível e recapturou seus estados. Os registros iniciais continuam no JSON para rastreabilidade; os registros `final-card-*` e `final-keyboard-expand-*` documentam a verificação final.

As fotos foram inspecionadas individualmente e nas composições da página: peças coerentes com as referências, calças azul-escuras, logos claras/escuras conforme o tecido, ausência de retângulos de fundo, anatomia e equipamentos visualmente plausíveis, ambientes organizados e ausência de textos extras. Os recortes superiores de Commercial/Residential foram ajustados após essa revisão.

## Artefatos

- `browser-verification.json`: resultados individuais do navegador.
- `structural-verification.json`: integridade dos originais e escopo das alterações.
- `captures/`: 34 capturas, incluindo três estados anteriores, os slides, cards finais, capas, seções e comparador.
- `masters/`, `references/` e `prompts/`: fotografias geradas originais, referências fornecidas e instruções exatas de geração.

Os seis JPEGs usados pelo site estão em `assets/images/*-uniformes-20260912.jpg`. O peso conjunto caiu aproximadamente 38% em relação às seis fontes anteriores. Isso é uma comparação de tamanho de arquivo, não uma medição de Core Web Vitals.
