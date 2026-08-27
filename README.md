# 4Points Cleaning Services | Documentação Design & Architecture

> **Website:** [index.html](file:///home/https/%C3%81rea%20de%20trabalho/workspace/4pointscleaning/4points_website/index.html)  
> **Empresa:** 4Points Cleaning Services  
> **Foco:** Limpeza Comercial, Serviços de Zeladoria (Janitorial), Cuidados Especializados de Pisos e Limpeza Residencial de Alto Padrão em Greater Boston & Massachusetts.

---

## 📋 Visão Geral do Projeto

O website da **4Points Cleaning Services** foi projetado com uma arquitetura moderna, responsiva e focada em conversão B2B/B2C. Ele transmite autoridade, confiança e sofisticação corporativa através de um sistema visual refinado, tipografia refinada e micro-interações fluidas.

### Principais Pilares do Projeto
1. **Design System Consistente:** Design tokens centralizados via CSS Variables para cores, tipografia, espaçamento e elevação.
2. **Motion System Performático:** Animações baseadas em `IntersectionObserver` com suporte completo a `prefers-reduced-motion`.
3. **Componentes Interativos Avançados:**
   - Hero Slider com Autoplay, navegação por teclado e gestos de toque (*swipe*).
   - Tabela interativa de planos de manutenção recorrente para Facility Managers.
   - Comparador interativo Antes/Depois (*Before/After*) para restauração de pisos.
   - Formulário de orçamento multi-etapas (*Multi-Step Quote Calculator*).
   - Carrossel de depoimentos com suporte a acessibilidade e touch.

---

## 🎨 Sistema de Design & Paleta de Cores

O esquema de cores foi selecionado para transmitir elegância corporativa, higiene e responsabilidade ecológica.

### 🖌️ Paleta de Cores (CSS Tokens)

> ⚠️ **Os tokens abaixo são obrigatórios.** Em uma passagem anterior, quando o `<style>` inline foi
> extraído para `style.css`, o bloco `:root` perdeu sete deles (`--font-serif`, `--font-ui`,
> `--paper`, `--ivory`, `--graphite`, `--champagne-deep`, `--petrol-deep`). Como uma `var()` sem
> definição invalida a declaração inteira, o site passou a renderizar em Times New Roman, todos os
> fundos claros viraram branco, o scrim da Floor Care desapareceu e a Final CTA ficou com texto
> branco sobre branco. Ao editar `:root`, não remova nenhum destes.

| Token | Valor Hex | Amostra | Utilização Principal |
| :--- | :--- | :--- | :--- |
| `--font-serif` | `Fraunces` | ✒️ Display | Títulos, números, citações — o eixo `opsz` é acionado nos tamanhos grandes |
| `--font-ui` | `Manrope` | 🔤 Utilitária | Corpo, labels, microinformação técnica |
| `--navy` | `#102A43` | 🔵 Escuro | Cor institucional principal, fundos nobres, cabeçalhos |
| `--navy-dark` | `#071B2E` | ⬛ Azul Noturno | Fundo ultra-escuro de contraste em seções chave |
| `--navy-2` | `#173B5A` | 🔷 Navy Médio | Superfícies de cards e elementos secundários |
| `--petrol-deep` | `#12556B` | 🌊 Petrol Profundo | Tom profundo da composição de fechamento |
| `--petrol` | `#1F6F8B` | 🔹 Azul Petrol | Destaques de badges, subtítulos e links |
| `--petrol-light` | `#2A8EAA` | 💧 Petrol Claro | Estados de `:hover` e anéis de foco de acessibilidade |
| `--sage` | `#8BAE8B` | 🌿 Verde Sálvia | Elementos ecológicos, indicador de presença mobile e impacto social |
| `--sage-soft` | `#DDE8D8` | 🍃 Sálvia Suave | Tags de contraste sobre superfícies escuras |
| `--champagne` | `#C8A96A` | 🟡 Dourado/Champagne | Botões de Ação Principal (CTA) "Request a Quote" |
| `--champagne-deep` | `#A9894C` | 🟤 Champagne Escuro | Tinta adaptativa da `.standard`; réguas e preenchimentos gráficos |
| `--champagne-text` | `#876E3D` | 🟫 Champagne Texto | Champagne legível como texto pequeno sobre chão claro |
| `--ivory` | `#F7F4EF` | 📜 Marfim | Seções de contraste suave |
| `--paper` | `#FFFDF8` | 📄 Papel | Fundo limpo principal da página |
| `--graphite` | `#2B2F32` | 📓 Grafite | Texto do corpo de altíssima legibilidade |
| `--sand` | `#F5EFEB` | 🏜️ Areia | Chão claro mais quente — Before/After, Impact, FAQ |
| `--muted` | `#526980` | 🌫️ Cinza Muted | Descrições secundárias e metadados sobre chão claro |

> **Haze (`#114159`) só existe no canvas.** É navy puxado parte do caminho até petrol, e vive em
> `PALETTE.haze` no `script.js` sem token CSS correspondente — de propósito. Ele é chão e névoa da
> Floor Care e mais nada; petrol saturado usado como fundo de página inteira é uma cor de marca
> virando background, e o site deixa de ser este site. Não promova para `:root`.

> ⚠️ **Duas correções de contraste (2026-08-20).** Esta tabela documentava `--muted` como
> `#62717D`, valor que **nunca esteve no CSS** — o arquivo sempre teve `#627D98`. Ao medir
> contraste real de texto contra o chão, os dois tokens abaixo falhavam WCAG AA para texto
> pequeno e foram escurecidos, mantendo o matiz:
>
> | Token | Antes | Depois | Paper | Ivory | Sand |
> | :--- | :--- | :--- | ---: | ---: | ---: |
> | `--muted` | `#627D98` | `#526980` | 4.21 → **5.60** | 3.90 → **5.19** | 3.76 → **4.99** |
> | numerais da Quote | `--champagne-deep` | `--champagne-text` | 3.24 → **4.77** | — | — |
>
> `--champagne-deep` **não** foi alterado: ele alimenta cinco pontos da tinta adaptativa da
> `.standard`, onde responde por contraste sobre chão **escuro**. Por isso os numerais do
> formulário ganharam um token próprio em vez de o token existente ser escurecido.
>
> Em chão escuro `--canvas-muted` resolve para `--sage-soft` e **nunca** para `--muted`, então
> escurecer esse token não afeta nenhuma superfície escura.
>
> **Pendente com o cliente:** `.t-stars` (as cinco estrelas dos depoimentos) usa `--champagne`
> sobre Paper, 2.21:1. Não foi alterado — são ícones de 20px com `aria-hidden="true"`, portanto
> decorativos e isentos, e deixá-los conformes exigiria estrelas marrons: decisão de marca.

```css
:root {
  --navy: #102A43;
  --navy-dark: #071B2E;
  --navy-2: #173B5A;
  --petrol: #1F6F8B;
  --petrol-light: #2A8EAA;
  --sage: #8BAE8B;
  --sage-soft: #DDE8D8;
  --champagne: #C8A96A;
  --ivory: #F7F4EF;
  --paper: #FFFDF8;
  --sand: #F5EFEB;
  --graphite: #2B2F32;
  --muted: #526980;
}
```

---

## 🌫️ Continuous Editorial Canvas

O fundo Three.js (`initThreeBackground`, `script.js`) não é uma camada decorativa atrás do
HTML: ele é **a fonte de verdade do chão global da página**. Em funcionamento normal com WebGL,
as seções não pintam superfícies full-width próprias; elas apenas fornecem conteúdo, mídia,
componentes e medidas de capítulo para o canvas.

### Document-Space Ground Field

O chão é definido por uma estrutura única em `script.js`, medida contra o DOM real:

```js
{ key: "quote", sel: ".quote", top: PALETTE.paper, bottom: PALETTE.paper, enter: 0, exit: 0 }
```

A sequência de ground é:

`hero → standard → services → maintenance → floorcare → beforeafter → residential → impact → areas → testimonials → faq → quote → final-cta → footer`.

Cada capítulo declara seletor, cores principais, variação top/bottom ou stops internos,
transition-in e transition-out. As posições vêm de `offsetTop` / `offsetHeight`, não de alturas
fixas. `measureGroundField()` recalcula a timeline em `load`, `resize`, `orientationchange`,
`fonts.ready`, `ResizeObserver` e quando `scrollHeight` muda.

No shader, cada fragmento resolve:

```glsl
docY = uScrollY + viewportY;
ground = sampleGroundField(docY);
```

Isso permite que uma única viewport mostre, no mesmo frame WebGL, o topo ainda em Paper e a base
já em Navy, sem nenhum wrapper HTML pintando um segundo chão por cima.

### Ground vs Atmosphere

**Ground** é a superfície base: Navy, Navy Dark, Paper, Ivory, Sand, Sage Soft, Petrol. Ele é
espacialmente correto no documento e alimenta o shader, `sampleGround()`, polaridade, tinta
adaptativa e custom properties públicas.

**Atmosphere** é o que existe entre a câmera e essa superfície: a luz que a raspa, o ar que a
distancia e as marcas que estão paradas dentro dela. Não há `THREE.Fog` e não há luzes na cena —
nenhum material aqui responde a iluminação, são todos Basic — mas há profundidade de verdade, e
ela é um termo do próprio shader. Ver *O ar* abaixo.

Quote e Final CTA têm tratamento explícito no field: a Quote permanece Paper por toda a leitura
do headline, progresso, formulário e sucesso; a Final CTA assume a sequência Petrol Deep →
Petrol → Navy Dark; o Footer chega com Navy Dark já estabilizado.

### Perfis atmosféricos por seção

A identidade de um capítulo vivia espalhada em três listas que não se falavam: `groundChapters`
diz onde o chão está, `stations` diz onde a lâmpada está, e o bloco de geometria diz onde a
estrutura está. Nenhuma delas dizia **que tipo de ar existe entre a câmera e as três** — que é o
que faz uma sala ser uma sala.

`SECTION_PROFILES` é essa quarta tabela, indexada pelo mesmo seletor `.scroll-snap-section` que
as outras usam. Cada estação resolve o seu perfil no boot (`st.profile`); as duas estações da
Floor Care e as duas da FAQ dividem o perfil da seção, porque é uma sala só vista de dois pontos.

| campo | o que decide |
| :--- | :--- |
| `fog` | a cor em que a profundidade resolve — sempre um token vizinho, nunca uma cor nova |
| `density` | quanto ar existe |
| `height` | onde no quadro o ar começa a ganhar corpo (0 = piso, 1 = teto) |
| `falloff` | quanto acima disso ele leva para chegar à densidade cheia |
| `base` | a laje achatada entre câmera e superfície, antes de qualquer horizonte |
| `depth` | quanto a estrutura faz paralaxe neste capítulo |
| `lightCap` | **a calibração de contraste**: o teto de `uGlowStrength` sob este capítulo |

Todos os campos são interpolados entre os dois perfis em que a página está, pelo `blendAt` que já
existia, no canal `surface`. Nenhum valor pula: um capítulo **se torna** o próximo.

Duas regras que não são óbvias e custaram para achar:

- **Em capítulo escuro a névoa é mais CLARA que o chão.** Perspectiva aérea leva as coisas em
  direção à luz ambiente, não em direção à sombra. O rodapé começou com névoa Navy Dark sobre
  chão Navy Dark: cinco linhas de shader e zero pixel. Uma sala só recua se houver para onde.
- **`base` é pequeno de propósito.** Um véu uniforme sobre o quadro inteiro não é profundidade, é
  alguém trocando a cor do chão — e cairia direto em cima de uma paleta aprovada. Quem lê como
  espaço é o gradiente; o `base` é só a garantia de que ele não começa do nada.

### O ar — profundidade dentro do shader

```glsl
float horizon  = clamp((fragUV.y - uFogHeight) / max(0.001, uFogFalloff), 0.0, 1.0);
float airDepth = uFogBase + horizon * horizon;
float air      = 1.0 - exp(-uFogDensity * airDepth * 1.8);
col = mix(col, uFogColor, air);
```

Duas fontes de profundidade, e é o **mesmo ar**. A vertical é perspectiva aérea sobre uma
superfície que recua: altura no quadro é distância, então a bruma engrossa em direção ao
horizonte, e cresce com o quadrado porque o volume cresce. A achatada é a laje que o dolly abre
entre a câmera e a superfície — `uFogBase` carrega o trilho. Beer-Lambert nas duas, que é a lei
que `FogExp2` usa, aplicada à profundidade do quadro em vez de a `z`.

**Aplicado depois da luz**, e a ordem é o efeito inteiro: o ar está entre a superfície e o olho,
não sob a lâmpada. É por isso que um realce lá em cima no quadro aparece velado — e um realce
velado é a única coisa que um degradê plano não consegue fingir.

> ⚠️ **Por que não `THREE.Fog`.** O backdrop é um `ShaderMaterial` cru e material cru **ignora**
> `scene.fog` — não há chunks de fog nele. A névoa que esta página declarava alcançava só os
> objetos de linha e nunca alcançava o chão atrás deles: as duas metades da mesma sala discordavam
> sobre quanto ar havia nela. Repor `scene.fog` seria repor exatamente esse desacordo.

Os objetos recebem a **mesma lei**, calculada na CPU em `updateSpans()` com os uniforms como
fonte única — `1 - exp(-density * (d / RAIL_STEP) * FOG_OBJ_K)` — tingindo a cor em direção à
névoa e reduzindo a opacidade juntas. Uma marca que emerge do fundo emerge **do ar**, ganhando cor
e peso ao mesmo tempo, em vez de subir de opacidade já saturada.

> ⚠️ `1.8` é a profundidade óptica a horizonte cheio e densidade 1, e vive nos **dois lados do
> espelho**: o literal no shader e `AIR_K` em `airAt()`. Mudar um sem o outro é a página medindo
> uma luz em que não está.

### A luz rasante e o acabamento da superfície

O realce é uma **gaussiana elíptica** em coordenadas locais de um eixo rasante (≈ −18°, que se
inclina acoplado ao `uGroundSkew` para que luz e chão concordem sobre o horizonte numa travessia).
É o núcleo do modelo de Ward com os termos geométricos removidos — sem normais, o que sobrevive é
a exponencial de duas projeções ortogonais com escalas independentes:

```glsl
sheen = exp(-( across²/uSheenAcross² + along²/uSheenAlong² ))
```

`uSheenAcross` e `uSheenAlong` são o αx e o αy de Ward, e **a razão entre eles é o acabamento da
superfície** — isso não é metáfora: polir um piso é literalmente aumentar a anisotropia da sua
BRDF. Uma superfície fosca espalha luz de forma quase isotrópica; uma brunida espalha alongada no
eixo do ferramental.

`uFinish` (0 → 1) percorre essa razão ao longo do trilho:

| Trecho | `uFinish` | Realce |
| :--- | :--- | :--- |
| hero → maintenance (rail 0–3.4) | 0 | quase isotrópico, largo — próximo de propósito da mancha radial aprovada |
| floorcare in→out (rail 3.4–6) | 0 → 1 | a elipse se estreita e alonga durante o capítulo sobre polimento |
| beforeafter (rail 6) em diante | 1 | corrida especular limpa, **mantida** — um piso restaurado continua restaurado |

É a mesma escala Worn ↔ Restored que a régua `.ba-scale` mostra no DOM. O canal médio dos três
relógios, `atmSurface`, carrega **duas coisas que andam juntas**: o acabamento da superfície e a
densidade do ar. Um piso e o ar acima dele são o mesmo fato material e chegam no mesmo relógio.

> ⚠️ `uFinish` deriva do trilho, **nunca de um relógio**. Nada na atmosfera pode rodar no tempo,
> ou o `wake`/`framesAtRest` nunca mais estaciona e um canvas fixo em tela cheia passa a custar um
> frame para sempre.

#### O teto da luz é por capítulo

Conforme a elipse colapsa numa faixa, a mesma `glowStrength` autorada se espalha por uma fração
da área e o pico sobe junto — que é como um capítulo que lê a própria tinta desta tela acaba com o
chão empurrado através do limiar de polaridade com o texto ainda na tela.

Esse teto era um número só (`SHEEN_CEILING = 0.58`) para catorze capítulos com necessidades
opostas. Agora é `profile.lightCap`, interpolado com o resto: baixo onde o tipo lê o canvas
(`.standard`, `.beforeafter`, `.faq`, `.testimonials`, `.quote`), alto onde a folha de estilo fixa
a tinta e a luz pode fazer o que a estação pedir.

**É aqui que contraste se calibra** — por seção, na luz — em vez de mexer numa cor de chão que uma
dúzia de outras coisas está pisando.

#### Escuro↔claro é transformação, não crossfade

O par de perfis resolve no trilho de **superfície**; a luz, no de **luz**. O `CHANNEL_LEAD` separa
os dois por alguns por cento de intervalo, e essa defasagem é o efeito:

| travessia | o que acontece primeiro | como se lê |
| :--- | :--- | :--- |
| escuro → claro | a luz entra (`light` lidera 0.09) e o ar rareia atrás dela | iluminação chegando e queimando a bruma |
| claro → escuro | o ar ganha corpo (`surface` lidera 0.09) e a lâmpada responde | a sala muda antes da lâmpada |
| mesma polaridade | quase nada | três temperaturas de um material, não três fundos |

Duas imagens sendo misturadas não conseguem fazer isso. Uma densidade e uma intensidade mudando em
ordens diferentes conseguem — e a ordem é o que o olho lê.

### Adicionar luz a Paper não faz nada — os flancos

Sete dos catorze capítulos ficam sobre chão claro, onde os canais já estão no teto e um realce
aditivo satura em branco. Também não é assim que uma luz rasante se lê num piso pálido: ali a
faixa não é mais clara que o branco, o **entorno é mais fundo**.

Então em chão claro a mesma elipse *escava* em vez de somar: um segundo lobo, 2.6× mais largo no
mesmo eixo, subtraído onde excede o núcleo — portanto exatamente zero na linha de centro. Ele
multiplica o próprio chão, não uma cor fixa, para aprofundar a superfície sem tingi-la. O peso
`carve` é 0 em navy e 1 em paper, medido no chão **antes** da luz.

### Grão e dither

O grão direcional (lento ao longo do eixo, rápido através dele) usa o **Hash without Sine** de
Dave Hoskins, não o `fract(sin(dot(...)) * 43758.5)` canônico: `sin` com argumento grande é
definido pela implementação e dá grão diferente por driver. Ele só aparece **dentro** do realce —
uma superfície só mostra suas marcas onde a luz a raspa — e some em mobile e reduced-motion.

O chão vai de `#071B2E` a `#102A43` ao longo de uma viewport: nove passos de 8 bits em vermelho e
vinte e um em azul. Isso é banding de manual, e quem vinha mascarando era o overlay `.grain` do
CSS. Agora há **dither TPDF** no shader (dois samples de Interleaved Gradient Noise somados),
ancorado em `gl_FragCoord` para não cintilar com o scroll — e por isso o `--grain-o` do CSS pôde
cair de .035–.075 para .024–.054.

### A estrutura — três marcas, três profundidades

Cortar quinze arames para um só acertou o **peso** e errou a **contagem**: o dolly percorre 224
unidades (de `z 20` a `z -204`) e encontrava uma coisa só, no fim de tudo. O espaço tinha destino
e não tinha extensão.

| | `z` | atravessada em | o que é |
| :--- | ---: | :--- | :--- |
| **CORNERS-A** | −60 | Standard → Floor Care | as cantoneiras de registro, mais largas que altas |
| **DIAMOND-B** | −124 | Floor Care out → Impact | o losango sozinho, maior que a viewport |
| **FOURPOINT-C** | −184 | Areas → Quote | a marca de registro completa |

Nenhuma anima: a escala é o dolly e o dolly é o scroll. Nenhuma carrega cor própria — cada uma
toma a cor da luz que está atravessando a página e é então **tomada pelo ar** que está entre ela e
a câmera, que é toda a diferença entre um objeto na sala e um objeto desenhado na parede. A câmera
as encontra em sequência, e encontrar coisas em sequência é o que faz uma profundidade ler como um
espaço contínuo em vez de um fundo que muda.

`spanFade()` é a **janela de visibilidade** — decide se o objeto está em jogo — e o ar decide
quanto dele sobrevive à distância. Dois trabalhos; antes eram um.

### ⚠️ Espaço de cor: não "consertar"

O importmap fixa `three@0.128.0`, que **não exporta** `SRGBColorSpace`, `outputColorSpace` nem
`ColorManagement` (zero ocorrências no build). Sem gerenciamento de cor, `new THREE.Color(0x102A43)`
guarda os canais sRGB crus e o shader os escreve crus — e é isso que faz `PALETTE.navy` na tela
ser byte a byte o `--navy: #102A43` do CSS. `relLuminance()` lineariza onde linearizar importa (ao
medir contraste) e em nenhum outro lugar. Não subir a versão do three sem re-derivar todos os
chãos.

### Ponte canvas → CSS

O JS publica leituras da luz como custom properties registradas: `--canvas-lum`, `--canvas-pol`,
`--canvas-glow`, `--canvas-air`, `--grain-o`. Delas o CSS deriva `--canvas-ink`,
`--canvas-strong`, `--canvas-rule`, `--canvas-muted`, `--canvas-accent`, `--canvas-halo` e
`--canvas-envelope`.

`--canvas-air` é quanto ar o canvas está segurando entre o leitor e o chão no centro do quadro,
vindo de `airAt(0.5)`. O DOM não enxerga um termo de shader, e uma hairline é a primeira coisa que
ar espesso dissolve — então `--canvas-rule` e `--canvas-rule-soft` são puxadas um pouco de volta
em direção à tinta, proporcionalmente ao ar à frente delas.

> Com `initial-value: 0` — que aqui é estrutural — ninguém escreve essa property sem canvas, o
> reforço resolve em exatamente zero e os blocos `.no-canvas` continuam byte a byte o que eram.

> ⚠️ Uma custom property é substituída **no elemento que a declara**. Por isso o bloco de
> derivações aparece em `:root, [data-canvas-ink]` — e por isso o fallback `.no-canvas` reafirma
> os valores concretos em vez de só virar `--canvas-pol`.

Elementos com `data-canvas-ink` são amostrados **na própria posição**, não no centro da viewport:
durante uma travessia o cabeçalho do Before/After está perto da borda inferior, onde a luz já
está um capítulo à frente do meio. Hoje são `.ba-head`, `.ba-scale`, `.ba-caption` e `.ba-notes`.
`.faq-intro` **não** é um deles de propósito: é `position: sticky`, e o offset de layout de um
elemento sticky não é onde ele está na tela.

### ⚠️ Regra crítica: o sampler espelha o shader

`sampleGround()` usa o mesmo Document-Space Ground Field do shader e soma os termos atmosféricos
que interferem na luminância. É dele que vive a tinta adaptativa da `.standard` e a legibilidade
dos elementos com `data-canvas-ink`. **Todo termo novo que altere luminância no shader precisa ser
espelhado lá** — senão a página mede uma luz em que não está.

O realce e os flancos vivem em **espaço de frame** (`gl_FragCoord.xy / uResolution`, y para cima,
que é a convenção em que `glowPos` é autorado), não no uv do plano do backdrop. Isso não é
detalhe: o plano tem 220 unidades de largura e a viewport ocupava cerca de um décimo dele, então
no uv toda posição autorada caía muito fora do frame visível e só a cauda da queda aparecia. Em
espaço de frame o espelho na CPU é `screenX / viewW` e `1 - screenY / viewH` — shader e sampler
não têm mais como discordar sobre onde um pixel está, e o `halfHCache`/`halfWCache` que
reconstruía o mapeamento antigo deixou de existir.

**O ar é o exemplo vivo dessa regra.** Ele desloca luminância de forma **sistemática** — num
capítulo escuro levanta o topo do quadro em direção à bruma, num de papel abaixa, e nos dois casos
por uma quantidade fixa, não em torno de zero. Um cabeçalho parado em ar espesso está sobre um chão
diferente do mesmo cabeçalho no piso do quadro, e a tinta precisa ser avisada. Por isso `airAt()`
existe em função separada: shader, `sampleGround()` e `--canvas-air` leem a mesma conta.

**Dois termos não são espelhados, de propósito:** o grão e o dither. Ambos são de média zero por
construção — `(g - 0.5)` e `(d1 + d2 - 1)` — e limitados, o grão a 0.03 em unidades de cor e o
dither a um passo de 8 bits. A contribuição esperada de cada um para a luminância é nula e nenhum
tem amplitude para virar polaridade sozinho. Qualquer termo novo que **não** seja de média zero
precisa ser espelhado.

Como verificar o espelho na prática: `--canvas-lum` publicado no `:root` é exatamente o retorno de
`sampleGround()` no centro da viewport. Compare com a luminância relativa do pixel central de um
screenshot, num ponto sem DOM por cima. Divergência acima de ~0.02 significa espelho quebrado.

### ⚠️ Repouso: todo estado atmosférico precisa chegar

`dampTo` e `springStep` são **assintóticos**: fecham uma fração da distância por segundo e nunca
chegam de fato. Num loop que estaciona, esse resto é a diferença entre uma página parada e um
frame para sempre por uma mudança que ninguém vê. Já custou caro uma vez — a cauda de `inkTemp`
mantinha a página acordada por mais dez segundos depois de tudo assentar.

Então cada seguidor atmosférico tem um epsilon de chegada explícito, na unidade em que ele se
move, e abaixo dele o valor é **snapado**:

| valor | epsilon | unidade |
| :--- | ---: | :--- |
| `atmLight` / `atmSurface` / `atmDepth` | `EPS_SCROLL` 0.5 | pixel de documento |
| `camRail` | `EPS_RAIL` 0.0015 | unidade de trilho |
| `uGroundSkew` | `EPS_SKEW` 0.25 | pixel de documento |
| `scrollVel` | `EPS_VEL` 6 | px/s |
| `uFogDensity` | `EPS_FOG` 0.0015 | fração de mistura |
| `uFogHeight` / `uFogFalloff` / `uFogBase` | `EPS_FOG_GEO` 0.002 | frame space |
| `uFogColor` | `EPS_FOG_COL` 0.002 | por canal |

Um epsilon só para todos seria errado: pixel de documento, passo de trilho e densidade de névoa
são três escalas diferentes.

> ⚠️ Nos três canais o snap precisa zerar **`v` junto com `x`**. `springStep` carrega velocidade —
> snapar só a posição faz o passo seguinte empurrar de volta para fora do alvo, e o resíduo nunca
> morre.

A soma de repouso em `updateFromScroll` soma os resíduos **já snapados**, então ela alcança um zero
de verdade em vez de um número cada vez menor que nunca cruza `REST_EPSILON`. O ar entra pesado
(`fogRest * 60`) porque suas unidades são frações de mistura, não pixels.

Como medir: envolver `gl.drawArrays` / `gl.drawElements` num contador e conferir **0 draws** em
três janelas de 3s consecutivas com a página parada.

### Fallback sem WebGL

Se o contexto não vier, `initThreeBackground` marca `document.documentElement` com `.no-canvas` e
o CSS devolve chão sólido coerente às seções. O fallback não tenta reproduzir animações, seams ou
glows complexos; ele preserva contraste e leitura quando a superfície WebGL não existe.

> Para exercitar esse caminho, bloqueie o contexto **antes** do módulo carregar, e cubra as três
> variantes: `webgl2`, `webgl` e `experimental-webgl`. Um filtro que só testa `indexOf('webgl')
> === 0` deixa passar `experimental-webgl`, o three obtém contexto e o fallback nunca dispara.

---

### `background.html` está obsoleto

`background.html` é o laboratório de uma passagem anterior desta atmosfera: dez estações, um único
glow radial, sem Document-Space Ground Field, sem spans e sem tinta adaptativa. Ele **não espelha**
o `script.js` e não é servido em produção. Trate-o como registro histórico, não como referência.

---

## 📐 `.spec-list` — o componente que costura três capítulos

Um único `<dl>` de rows label/valor com hairlines aparece três vezes e **nunca é reestilizado**:

| Aparição | Onde | Papel |
| :--- | :--- | :--- |
| `FC—01 Specialty` | `.fc-dossier` | dossiê impresso sobre a fotografia |
| `PL—02 Case` | `.ba-notes` | notas de leitura na margem da prancha |
| assurance index | `.faq-assurance` | segunda massa que equilibra o accordion |

Só a tinta muda, e ela vem de `--canvas-*`. Essa repetição é o argumento inteiro: três decorações
diferentes leem como três seções que receberam trabalho; um componente em três chãos lê como uma
publicação com estilo de casa para informação técnica.

No mobile (≤767px) ele empilha — label acima do valor — porque duas colunas em 346px deixam o
valor com ~250px e transformam "Greater Boston & Massachusetts" em três linhas irregulares.

---

## 🖥️ Desktop Full-Viewport / Scroll Snap (≥ 1201px)

No Desktop amplo a página deixa de ser uma coluna contínua de seções com alturas próprias e passa a
ser uma sequência de cenas: **um capítulo, uma viewport**. Quando o scroll estabiliza, uma única
seção domina o frame de ponta a ponta. A única camada que ainda atravessa a fronteira é a atmosfera
WebGL — isso é intencional, porque ela não sabe onde as seções terminam.

Tudo vive em **um único bloco** no fim de `style.css` (`/* 21. DESKTOP FULL-VIEWPORT / SCROLL SNAP */`),
depois do bloco Mobile.

### `.scroll-snap-section`

A classe está nos 14 capítulos: `.hero`, `.standard`, `.services`, `.maintenance`, `.floorcare`,
`.beforeafter`, `.residential`, `.impact`, `.areas`, `.testimonials`, `.faq`, `.quote`, `.final-cta`
e `.site-footer`. O `.site-header` **não** a recebe: continua camada fixa sobre as cenas.

Ela carrega apenas responsabilidade estrutural — onde o capítulo encaixa, quanto mede uma cena, que
ela livra o header e que o conteúdo se centraliza no frame. Composição continua pertencendo a
`.hero`, `.standard`, `.services` e às demais. Não transforme a classe num componente cheio de
exceções.

### Breakpoint

`@media (min-width:1201px) and (min-height:640px) and (prefers-reduced-motion: no-preference)`.

1200px é onde `.services-grid` colapsa para uma coluna (§19); abaixo disso a composição assimétrica
de Desktop amplo não existe e o sistema não teria o que enquadrar. `min-height: 640px` mantém o
sistema longe de janelas onde um capítulo de viewport inteira seria absurdo. A preferência por
movimento reduzido devolve a rolagem contínua, sem snap obrigatório. As duas faixas — esta e a Mobile
Edition (`≤767px`) — são disjuntas, então nada aqui alcança o mobile.

### 100dvh e a compressão por altura

Cada cena é `min-height: 100dvh` (com fallback `100vh`), em coluna flex centralizada. Nenhum
conteúdo é escondido, cortado ou removido para caber: a compressão vem de quatro tokens derivados da
**altura da viewport**, declarados dentro do bloco —

```css
--scene-pad-top:    calc(var(--header-h) + clamp(16px, 3.2dvh, 48px));
--scene-pad-bottom: clamp(44px, 6.5dvh, 96px);
--scene-gap:        clamp(20px, 3.4dvh, 48px);
--scene-row:        clamp(8px, 1.4dvh, 12px);
```

1920×1080 respira, 1440×900 fica confortável, 1366×768 se aperta sozinho — sem media query extra e
sem tocar em `font-size`. Onde padding e gap não bastaram, quem cedeu foi a mídia, sempre mantendo
proporção: a foto da Residential ganhou altura em `dvh`, o radar da Areas escala com `52dvh`, e o
frame do Before/After troca a proporção por altura de viewport (`3/2` → `16/9` ≤980px → `2/1`
≤820px), mantendo a mesma largura de prancha e apenas ampliando o crop de um `background: cover`.
Tipografia só foi ajustada em *leading*, e em `max-height:880px` há uma densificação pontual da
microcópia dos cards de serviço.

### Estados dinâmicos

A altura é `min-height`, nunca `height`. Um estado que cresce — resposta do FAQ aberta, o step 04 da
Quote — **empurra a cena para além de 100dvh** em vez de estourar dentro dela. Não existe
`overflow`, scrollbar interna nem nested scrolling em lugar nenhum: enquanto a seção for maior que a
viewport, o usuário continua percorrendo **o mesmo capítulo** até chegar ao próximo. Isso é garantido
pelo spec de CSS Scroll Snap: quando a snap area é maior que o snapport, toda posição que o cobre é
uma posição de snap válida.

### Transição entre cenas

Quando o navegador suporta `animation-timeline: view()`, cada `.scroll-snap-section` publica a
timeline nomeada `--snap-scene`. Duas curvas leem a mesma posição real: a cena dissolve de `.82` para
`1`, passando por `.94`, enquanto o wrapper interno percorre no máximo `12–18px` no eixo vertical e
escala de `.994` para `1`. Ambas ficam integralmente assentadas numa faixa ampla de 38% a 62%, para
que estados expandidos de FAQ e Quote continuem estáveis durante a leitura.

O `transform` nunca é aplicado na própria `.scroll-snap-section`: Hero anima `.hero-content`, os
capítulos regulares animam seu `.container` direto e a Closing Scene anima apenas `.final-cta` e
`.site-footer`. Assim a geometria do snap e as medições do documento não mudam. Essa camada não cria
listeners de scroll e não toca no canvas WebGL. Navegadores sem View Timelines mantêm o snap nativo;
com `prefers-reduced-motion: reduce`, todo o bloco Desktop Scroll Snap continua inativo.

### Relação com o Document-Space Ground Field

Nada foi hardcoded no Three.js. `measureGroundField()` e `measureRail()` continuam lendo
`offsetTop` / `offsetHeight` reais, e a remedição existente já cobre as novas alturas: `resize`,
`load`, `fonts.ready`, `ResizeObserver` e a checagem por frame de `scrollHeight` em
`updateFromScroll` — que é exatamente o que captura o FAQ abrindo. O canvas continua acompanhando o
`scrollY` real; não existe animação de background específica para o snap.

O mesmo seletor serve de chave em três lugares: `groundChapters` (chão), `stations` (luz) e
`SECTION_PROFILES` (ar, profundidade e teto de contraste). Renomear ou remover uma
`.scroll-snap-section` desalinha os três de uma vez — o chão some da timeline, a estação perde
âncora e o perfil cai no `DEFAULT_PROFILE`, que mantém o ar da página mas para de mudá-lo.

### ⚠️ Duas armadilhas ao editar

- **`scroll-margin-top: 0` nos capítulos.** A regra base dá `calc(var(--header-h) + 16px)` a todo
  `[id]`, e `scroll-margin` também expande a *snap area*: com ela, o capítulo encaixaria ~102px
  acima do próprio topo e as últimas linhas do capítulo anterior ficariam sob o header. A folga do
  header vem do padding interno da cena, não do offset de snap.
- **`--fc-fade-top` / `--fc-fade` continuam sendo o padding da Floor Care.** Eles foram reescalados e
  o `padding-block` foi reconstruído a partir deles. Quebrar essa identidade coloca o fade da
  fotografia atravessando o dossiê.

### Navegação por âncora

`initSnapAnchors()` (`script.js`) é o **único** acréscimo ao JS. Ele não escuta wheel, trackpad nem
teclado e nunca chama `preventDefault()`: snap mandatório com `scroll-snap-stop: always` pode
interromper um salto de fragmento na primeira posição que atravessa, então um clique em
`a[href^="#"]` libera o snap (`html.is-snap-released`) só durante aquela rolagem e o devolve no
`scrollend`. Um debounce passivo de 180ms após o último evento de scroll cobre navegadores sem esse
evento e saltos que não saem do lugar, sem presumir quanto tempo uma travessia longa deve durar. Ao
restaurar, o navegador reencaixa na posição mais próxima — o topo do capítulo alvo. Abaixo do
breakpoint ou com movimento reduzido a função é inerte.

---

## 📱 Edição Mobile (≤ 767px)

O mobile não é o desktop empilhado: é uma composição própria sob o conceito **"4POINTS — Mobile
Editorial Utility"**. Toda ela vive em **um único bloco** no fim de `style.css`
(`/* 20. MOBILE EDITION */` e `20b` para telas ≤380px), posicionado depois de todas as outras media
queries para vencer por ordem de fonte.

**Regra ao editar:** nada fora desse bloco deve ser alterado para resolver um problema de mobile, e
todo override precisa igualar ou superar a especificidade da regra que substitui (as queries de
`≤560` e `≤768` usam seletores como `.hero-cta .btn`, então `.btn` sozinho não vence).

Decisões de composição:

- **Um elemento dominante por viewport** e três assinaturas visuais espaçadas — Hero
  (cinematográfica), Floor Care (pôster fotográfico) e Our Impact 5:1 (pôster editorial).
- **Ritmo vertical em três níveis** (`--pad-xl` 92px / `--pad-lg` 74px / `--pad-md` 58px)
  alternados por seção, em vez de um `padding` único.
- **Dieta de cápsulas:** ~45 formas pill no mobile antigo → ~12. Pill fica reservada a ações,
  seleção e estados; tags e listas viram tipografia com hairlines.
- **Crops de foto por slide da Hero** (`56%` / `50%` / `54%`) — em retrato só ~36% da largura de uma
  foto 3:2 sobrevive, então o enquadramento é deliberado.
- **Before/After** vertical (`4/5`) e full-bleed, com `background-size: 150%` e
  `background-position: 50% 82%` para enfatizar o primeiro plano, onde a diferença entre as duas
  fotos realmente está.
- **Alvos de toque:** todo elemento interativo tem no mínimo 44×44px.

### 20a. Sistema de navegação iOS (dentro do mesmo bloco `≤767px`)

Uma sub-seção **`20a. iOS NAVIGATION SYSTEM`**, ao final do bloco `20` (antes do `}` que o fecha, e
portanto antes de `20b`), acrescenta uma camada de navegação de app nativo só para telefone:

- **Top bar** compacta (vidro navy + `env(safe-area-inset-top)`) com o botão de opções
  (`.m-options-toggle`, `data-options-sheet-toggle`) substituindo o hambúrguer *apenas* em
  `≤767px` — o hambúrguer/`.mobile-menu` original continua 100% funcional em `768–992px`.
- **Tab bar** inferior persistente (`.m-tabbar`, `data-tabbar`), 4 destinos (Home/Services/
  Impact/Quote), com uma régua-índice champagne (`.m-tabbar-indicator`) sincronizada por toque e
  por um segundo `IntersectionObserver` (`initTabBar()` em `script.js`) independente do
  `initScrollSpy()` existente.
- **Bottom sheet de opções** (`.m-sheet`, `data-options-sheet`) para Floor Care, Áreas, FAQ e
  contato — controlado por `initOptionsSheet()`.
- **Camadas de serviço em tela cheia** (`.m-cover`, `data-service-cover`), uma por card de
  serviço, abertas por `initServiceCovers()` via um listener de clique em **fase de captura** no
  `.service-card` (intercepta o accordion antigo só quando `matchMedia('(max-width:767px)')` é
  verdadeiro, sem alterar `initServiceInteractions()`).

**Histórico das camadas de serviço.** Uma camada se comporta como tela empilhada, então o gesto de
voltar do sistema tem que revertê-la em vez de sair do site. `initServiceCovers()` mantém um
sinalizador `ownsEntry`:

| Ação | Efeito no histórico |
| :--- | :--- |
| Abrir a partir do catálogo | `pushState({cover})` — **uma** entrada |
| Trocar direto de um serviço para outro | `replaceState({cover})` — a pilha **não** cresce |
| Fechar pelo chevron / `Escape` | `history.back()`; o `popstate` é que fecha, consumindo a entrada |
| Voltar pelo gesto do sistema | `popstate` sem `state.cover` → fecha |
| Tocar no CTA de orçamento (`<a href="#quote">`) | `replaceState({})` e fecha **sem** `back()` — a âncora vai empilhar `#quote` logo em seguida, e voltar de lá não pode reabrir a camada |

> O **bottom sheet de opções não** integra histórico, de propósito: é um painel transitório, e uma
> entrada por abertura faria o botão voltar reabri-lo em vez de sair da página.

> ⚠️ **Nunca esconda uma superfície `m-*` pelo atributo `hidden`.** O `.m-sheet-backdrop` foi
> escrito com `hidden` no HTML **e** `display:block` no CSS de `20a`. Estilos de autor vencem a
> regra do user-agent `[hidden]{display:none}`, então o atributo não fazia nada: sobrava um painel
> `position:fixed; inset:0; z-index:390; opacity:0` invisível cobrindo a tela inteira e **engolindo
> todo toque da página no mobile** — todos os botões pareciam mortos. O estado fechado agora usa
> `visibility:hidden` + `pointer-events:none`, alternado por `.is-open`, igual a `.mobile-menu` e
> `.m-cover`. Ao criar qualquer superfície nova, siga esse padrão.
>
> **Como testar isso:** `element.click()` e `dispatchEvent` disparam direto no nó e **ignoram
> hit-testing** — nenhum teste desse tipo detecta uma sobreposição invisível. Use cliques reais ou
> `document.elementFromPoint(cx, cy)` e confirme que o elemento retornado é o alvo. Foi assim que o
> bug passou despercebido por toda uma bateria de testes "verdes".

`initServiceCovers()` também fecha a camada aberta se a viewport crescer além de `767px`
(`mobileNav` change) — sem isso ela ficaria escondida pelo CSS mas ainda segurando o scroll lock,
exatamente a rede de segurança que `initNavigation()` já tem.

**Namespace:** todo componente novo usa classes `m-*`, exclusivas — nunca reutilizadas pelo CSS de
desktop nem pelo restante da Mobile Edition. Cada uma tem uma regra-base `display:none` fora de
qualquer media query (mesmo padrão de `.hero-rail`), então acima de `767px` elas são inertes por
construção. Faixa de `z-index` reservada: `.m-tabbar` 300 · `.m-sheet-backdrop` 390 · `.m-sheet`
400 · `.m-cover` 500 (abaixo de skip-link/`#loading`, 999/1000).

### 20c. Restyling por seção (fase 2)

Sub-seção final do bloco `≤767px`, só apresentação — vence por ordem de fonte sobre as regras por
seção acima, na mesma especificidade:

- **Serviços** viram catálogo: Commercial mantém o formato dominante (470px), os outros três caem
  para 186px em bloco browsável. O `.card-toggle` deixa de ser "+" de accordion e vira **chevron de
  disclosure** (`pointer-events:none`, desenhado com duas bordas) — tocar o card abre uma página,
  então o controle não pode mais prometer expansão inline. `.card-cta` some no mobile: o CTA agora
  vive na barra fixa da própria camada.
- **Planos recorrentes** ganham um segmented control de verdade: `.freq-tabs::before` é um indicador
  champagne único que desliza via `--freq-i`, publicado por `initMaintenanceSelector()`
  (`z-index:-1` + `isolation:isolate` no trilho o mantém atrás dos rótulos). A lógica de dados
  (`plans`, `render()`) não mudou.
- **Floor Care** recebe `scroll-snap-align` em `.floorcare-content` e `.fc-dossier` (só sob
  `prefers-reduced-motion: no-preference`), como páginas consecutivas do mesmo capítulo.
- **Impact** centraliza o 5:1 como pôster. Atenção: `.impact-ratio` carrega o próprio
  `text-align`, então centralizar só o pai não basta — o token precisa ser reescrito no elemento.
- **Orçamento** passa a uma pergunta por tela: `.q-options` em coluna única, linhas de 58px, e
  `.q-nav` fechando o formulário como placa de rodapé com hairline e safe-area.

> ⚠️ **`.q-nav` não é `position: sticky`, e isso é deliberado.** Tanto `.quote-form` quanto
> `.section.quote` usam `overflow: hidden` (o formulário para conter o slide de 16px do `qfade`, a
> seção para sua arte de profundidade). Qualquer um dos dois basta para tornar o formulário o bloco
> de contenção do sticky, prendendo a barra a uma caixa que nunca rola — o sticky simplesmente não
> engata. Abrir os dois para alcançar a viewport custaria mais do que entrega, já que com uma
> pergunta por tela a ação já fica a um scroll curto. Se um dia isso for revisitado, é preciso
> liberar **os dois** `overflow` e revalidar a arte da seção.

---

## 📐 Layout, Grid & Responsividade

- **Container Máximo:** `1280px` (`--container`).
- **Gutter Fluido:** `clamp(20px, 5vw, 64px)` (`--gutter`), garantindo margens perfeitas em qualquer tela.
- **Sistema de Raios (`border-radius`):**
  - Small: `14px` (`--radius-sm`)
  - Medium: `22px` (`--radius-md`)
  - Large: `32px` (`--radius-lg`)
- **Sombras de Elevação:**
  - Soft: `0 2px 10px rgba(7,27,46,.06)`
  - Medium: `0 18px 44px rgba(7,27,46,.12)`
  - Floating: `0 30px 80px rgba(7,27,46,.18)`

---

## 🎬 Sistema de Animações & Interações

1. **Scroll Reveal (`[data-reveal]`):**
   - Utiliza `IntersectionObserver` para revelar elementos suavemente à medida que entram na viewport.
   - Aplica efeito *fade-up* (`transform: translateY(28px)`) ou escala suave (`[data-reveal="scale"]`).
   - Escalonamento automático de tempo (*stagger*) entre itens filhos (90ms de intervalo, até o limite de 360ms).
   - Curva de aceleração: `cubic-bezier(.16, .8, .24, 1)`.

2. **Acessibilidade de Movimento:**
   - Respeita nativamente a preferência do sistema `@media (prefers-reduced-motion: reduce)`, desativando transições bruscas e reduzindo a duração para `0.001ms`.

---

## 📸 Detalhamento das Seções com Capturas de Tela

Abaixo está o detalhamento técnico e visual de cada uma das 13 seções do layout.

---

### 1. Cabeçalho & Hero Carousel (`.site-header` & `.hero`)

- **Design:** Header fixo translúcido (`backdrop-filter: blur(12px)`), logo minimalista `4POINTS.`, menu de navegação, atalho para ligação telefônica e botão de orçamento em destaque.
- **Hero Carousel:** Carrossel de 3 slides (Comercial, Cuidados com Pisos e Limpeza Residencial) com temporizador automático de 7 segundos, navegação por setas e suporte a *swipe* por toque. Painel lateral exibe os 4 pilares de confiança (15+ anos de experiência, Seguro Total, Serviço 100% Móvel e Cobertura em Massachusetts).

![Header e Hero Carousel](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_1_hero_1786378898355.png)

---

### 2. O Padrão 4Points (`.section.standard`)

- **Design:** Layout em grid com 4 pilares estratégicos de valor da marca.
- **Pilares:**
  1. `01 Precision`: Padrão rigoroso em cada ponto de contato.
  2. `02 Reliability`: Planos recorrentes pontuais para gestores de facilidades.
  3. `03 Care`: A cada 5 limpezas residenciais, 1 limpeza social gratuita é financiada.
  4. `04 Consistency`: Mesma equipe, mesmo checklist e resultado garantido.

![O Padrão 4Points - Pilares 1 a 3](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_2_pillars_part1_1786378930528.png)
![O Padrão 4Points - Pilar 4](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_2_pillars_part2_1786378958286.png)

---

### 3. Visão Geral de Serviços (`.section.services`)

- **Design:** Cards interativos com imagens de fundo (`--img-commercial`, `--img-floor`, `--img-residential`), botão de expansão com ícone `+` e lista detalhada dos itens incluídos em cada modalidade.
- **Categorias:**
  - **Commercial & Janitorial** (Foco Prioritário B2B)
  - **Floor Care** (Especializado em Pisos)
  - **Residential** (Atendimento Residencial)

![Serviços Principais - Comercial e Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_3_services_part1_1786379016720.png)
![Serviços Principais - Residencial](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_3_services_part2_1786379060670.png)

---

### 4. Manutenção Recorrente (`.section.maintenance`)

- **Design:** Focado em Facility Managers. Sistema de abas dinâmicas (`Daily`, `Weekly`, `Bi-Weekly`, `Monthly`) que atualiza a lista de tarefas recomendadas com animação de entrada item a item.

![Manutenção Recorrente - Plano Diário](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_4_maintenance_daily_1786379165053.png)
![Manutenção Recorrente - Plano Semanal](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_4_maintenance_weekly_1786379222269.png)

---

### 5. Floor Care — Specialist Manifesto (`.floorcare`)

- **Função narrativa:** o capítulo em que a marca deixa de falar de limpeza e demonstra domínio de
  uma especialidade. Um dos três picos visuais do site.
- **Composição (desktop):** manifesto à esquerda — eyebrow, `Polishing. Waxing. Restoring.`, uma
  frase de manifesto, badge de domingo e CTA — e, na margem direita, o **dossiê `FC—01`**
  (`.spec-list`) impresso sobre a fotografia. Atrás dele, `.fc-figure`: a marca 4POINTS desenhada
  como construção (`--mark-figure`, eixos que passam do losango, nós abertos, círculo inscrito) em
  escala arquitetônica, **registrada à informação** — seu eixo vertical cai na borda esquerda do
  dossiê e o horizontal no centro dele.
- **A costura, feita com alpha:** o `background-color` sólido saiu. A fotografia (`::before`) e o
  scrim (`::after`) compartilham `--fc-mask` e **perdem alpha** nas duas pontas, revelando o
  canvas. Não existe faixa de cor em lugar nenhum porque a camada de cima perde alpha em vez de
  ganhar outra cor.

> ⚠️ `--fc-mask` é construído a partir de `--fc-fade-top` / `--fc-fade`, que **são** o padding da
> seção. A parte sólida da fotografia termina exatamente onde a content box termina, em qualquer
> viewport. Uma versão anterior usava porcentagens e o fade atravessava o dossiê em certas
> alturas — tinta branca sobre fotografia dissolvendo sobre canvas clareando. Não mexa em um sem
> o outro.

- **Planos:** `initFloorParallax` faz uma única leitura de scroll e escreve `--parallax` (foto),
  `--fc-figure` (a figura, em sinal oposto: é isso que os faz ler como distâncias diferentes),
  `--fc-enter` e `--fc-exit`. Os dois últimos são escritos **também sob `prefers-reduced-motion`**:
  não são movimento, são a costura.
- **É o capítulo com mais ar da página** (`density: 0.72`, névoa em Haze sobre chão Navy Dark) e
  também onde `uFinish` percorre de 0 a 1. Luz baixa subindo do piso do quadro, bruma petróleo
  enchendo o alto e a elipse se estreitando: os três dizem a mesma coisa, que é o que este
  capítulo vende.
- **Mobile:** o pôster vertical continua intacto; a fotografia recebe o pôster mais o próprio
  dissolve (`92svh + 210px`) e o dossiê continua abaixo, sobre o canvas, como a próxima página do
  mesmo capítulo.

![Especialistas em Cuidados com Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_5_floor_care_banner_1786379340053.png)

---

### 6. Before / After — Editorial Case Study (`.section.beforeafter`)

- **Função narrativa:** a Floor Care afirma a especialidade; aqui ela é provada.
- **A prancha:** `.ba-board` é um grid de 12 colunas com hairline em cima e embaixo e cantoneiras
  de registro (`.cornered`). Cabeçalho e prancha ocupam as colunas 1–8; as **notas de leitura**
  (`PL—02`, `.spec-list`) ficam na margem, colunas 9–12, alinhadas à base. A seção não pinta chão:
  o Paper é o canvas, e o anel que nasceu atrás da fotografia da Floor Care está aqui, grande o
  bastante para sangrar pelas duas bordas.
- **A escala:** `.ba-scale` é uma régua com marcas; a leitura (`50`) cavalga o divisor via
  `--ba-x` e deixa cair uma hairline até a prancha. Número e divisor são um objeto só.
- **A seção responde à proporção:** `setPosition` escreve `--ba-x` e `--ba-split` em `.ba-board`.
  `CONDITION` e `RESULT` se acendem conforme o lado que está sendo mostrado
  (`.lean-worn` / `.lean-restored`), e cada caption se apaga **antes** do corte chegar nela — uma
  legenda é legível ou ausente, nunca fatiada no meio de uma palavra.
- **Worn × restored sem filtro:** as duas fotos são o mesmo lobby da mesma posição de câmera, e
  esse é o argumento inteiro. O véu cinza pesado e o véu de menta saíram. O lado gasto recebe
  densidade (lavagem grafite leve + o grão da própria página); o restaurado recebe luz (uma aresta
  fria discreta no topo). Nada inventa uma diferença que o piso não tinha.

> ⚠️ **Não regredir:** `.ba-range` (`position:absolute; inset:0; opacity:0; z-index:5`) **é** a
> superfície de arraste. O `pointerdown` do frame retorna cedo quando o alvo é o input e o range
> nativo cuida de drag, touch e teclado. Preservar geometria, `aria-label` e `touch-action`.

![Comparador Antes / Depois de Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_6_before_after_slider_1786379476368.png)

---

### 7. Serviços Residenciais (`.section.residential`)

- **Design:** Layout de 2 colunas com fotografia de ambiente residencial e lista dos 3 pilares de atendimento em residências: Limpeza Padrão, Limpeza Pesada e Limpeza Move-In / Move-Out.

![Limpeza Residencial](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_7_residential_1786379643896.png)

---

### 8. Impacto Social (`.section.impact`)

- **Design:** Contador animado de proporção `5:1` (A cada 5 limpezas contratadas, 1 limpeza gratuita é oferecida para pacientes em situação de vulnerabilidade). Parceria humanitária com a organização **PPEAL**.

![Impacto Social e Parcerias](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_8_social_impact_1786379828526.png)

---

### 9. Áreas Atendidas (`.section.areas`)

- **Design:** Apresentação do conceito de Serviço 100% Móvel. Gráfico animado no estilo radar SVG que ilustra o alcance de atendimento na região de Greater Boston e estado de Massachusetts.

![Áreas de Atendimento e Raio Móvel](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_9_areas_serve_1786380011203.png)

---

### 10. Depoimentos de Clientes (`.section.testimonials`)

- **Design:** Carrossel de avaliações 5 estrelas com feedback de diretores de operações, gestores de facilities e proprietários de imóveis.

![Depoimentos de Clientes](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_10_testimonials_1786380165485.png)

---

### 11. FAQ — Technical Reassurance (`.section.faq`)

- **Função narrativa:** o momento em que a marca responde a objeções. Informação é protagonista;
  a composição serve à confiança.
- **Duas massas:** `.faq-board` é um grid de duas colunas. À esquerda, `.faq-intro` (sticky) com
  eyebrow, headline e o **assurance index** (`.spec-list`) — a segunda massa que equilibra o
  accordion sem virar sete cards. À direita, a lista, com a estrutura de rows e o ARIA intactos.
- **Estados:** a pergunta aberta troca para Fraunces e ganha a régua champagne, o deslocamento e
  um wash que se apaga bem antes da borda da coluna (um wash, não um painel). O controle `+`
  responde à mesma régua champagne em vez de virar um botão preenchido de aplicativo. A resposta
  pendura numa hairline própria com um nó no início.
- **Profundidade:** vem toda do canvas — um losango de quatro pontos maior que a viewport,
  entrando e saindo do frame conforme a câmera viaja. Não há nada decorativo no DOM aqui.
- **Encerramento:** FAQ e Quote permanecem sobre chão claro no Document-Space Ground Field. A
  entrada dark só começa depois da leitura da Quote, na Final CTA, onde o próprio field assume
  Petrol Deep → Petrol → Navy Dark.
- **Mobile:** coluna única, intro não-sticky, e o índice de confiança **condensado a 3 linhas**
  acima das perguntas — seis empurrariam a primeira pergunta para fora da tela, que é a única
  coisa que esta seção não pode fazer.

> ⚠️ **Não regredir:** `aria-expanded` / `aria-controls` e a remedição de `panel.scrollHeight` em
> `resize` e `orientationchange`.

---

### 12. Formulário de Orçamento Multi-etapas (`.section.quote`)

- **Design:** Formulário em 4 passos lógicos para simplificar a solicitação de proposta:
  1. **Passo 01:** Tipo de Imóvel (*Commercial, Office, School, Residential, Other*)
  2. **Passo 02:** Frequência Desejada (*One-Time, Weekly, Bi-Weekly, Monthly, Custom*)
  3. **Passo 03:** Tamanho da Área (Sq. Ft / cômodos)
  4. **Passo 04:** Dados de Contato e Envio

---

### 13. Chamada Final & Rodapé (`.final-cta` & `.site-footer`)

- **Design:** CTA de alto contraste incentivando a solicitação de orçamento imediata. Rodapé completo em colunas contendo informações de contato, links rápidos, horário de atendimento, redes sociais e direitos autorais dinâmicos com ano atual.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico:** `<header>`, `<main>`, `<section>`, `<article>`, `<footer>` com acessibilidade ARIA completa.
- **Vanilla CSS:** Sem dependências externas de frameworks CSS (Tailwind ou Bootstrap), proporcionando desempenho máximo e controle total sobre o design system.
- **Vanilla JavaScript (ES6+):** Código limpo em IIFE, modularizado e focado em eventos passivos e `IntersectionObserver`.
- **Google Fonts:** Fraunces e Manrope.

---

## Cache Busting

O projeto usa cache busting por hash de conteúdo para CSS e JavaScript. Antes de publicar uma nova versão, rode:

```bash
node scripts/cache-bust.js
```

O script atualiza referências locais em arquivos HTML, como `style.css?v=<hash>` e `script.js?v=<hash>`, mantendo os caminhos relativos originais. Arquivos externos, imagens e outros assets não são reescritos.

Não foi adicionado um loader com timestamp no `<head>` porque isso forçaria uma URL nova a cada visita e reduziria o reaproveitamento de cache. Também não foram adicionadas tags `<meta http-equiv>` de cache, pois o controle confiável deve ficar nos headers HTTP da hospedagem/CDN; o HTML deve ser revalidado e CSS/JS podem usar cache longo graças ao `?v=<hash>`.

---

## ⚡ Como Executar Localmente

1. Navegue até a pasta do projeto:
   ```bash
   cd "/home/https/Área de trabalho/workspace/4pointscleaning/4points_website"
   ```
2. Inicie qualquer servidor HTTP simples (exemplo com Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Abra no navegador:
   `http://localhost:8080`
