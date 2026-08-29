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
| `--champagne-text` | `#876E3D` | 🟫 Champagne Texto | Champagne legível como texto pequeno sobre chão claro **chapado** (Mobile Edition) |
| `--champagne-ink` | `#7E6738` | 🟤 Champagne Tinta | Champagne legível como texto pequeno sobre o chão claro **renderizado pelo campo de relevo** (≥768px) |
| `--ivory` | `#F7F4EF` | 📜 Marfim | Seções de contraste suave |
| `--paper` | `#FFFDF8` | 📄 Papel | Fundo limpo principal da página |
| `--graphite` | `#2B2F32` | 📓 Grafite | Texto do corpo de altíssima legibilidade |
| `--sand` | `#F5EFEB` | 🏜️ Areia | Chão claro mais quente — Before/After, Impact, FAQ |
| `--muted` | `#526980` | 🌫️ Cinza Muted | Descrições secundárias e metadados sobre chão claro |

> **Petrol Deep é chão da Floor Care e mais nada.** Ele é o tom `petrol` do campo de relevo, e o
> único capítulo que o veste. Petrol saturado usado como fundo de página inteira é uma cor de marca
> virando background, e o site deixa de ser este site. Não estenda o tom a outros capítulos.
>
> *(O antigo `PALETTE.haze` — `#114159`, navy puxado até petrol — existia só dentro do shader
> WebGL e saiu junto com ele.)*

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

> ⚠️ **O chão medido não é o chão declarado (2026-08-29).** As razões acima foram calculadas contra
> os tokens de tom (Paper `#FFFDF8`, Ivory, Sand). Mas nenhum capítulo é o token puro: o campo de
> relevo deita uma sombra difusa larga por cima dele. Amostrando o pixel realmente renderizado atrás
> do texto, em 1440×900:
>
> | Onde | Chão declarado | Chão medido | Efeito |
> | :--- | :--- | :--- | :--- |
> | Numerais da Quote | Paper, L≈.983 | L≈.855 | `--champagne-text` cai de 4.77 → **4.18:1** |
> | `.ba-caption` | Sand, L≈.871 | `rgb(206,202,200)`, L≈.603 | `--canvas-muted` cai de 4.99 → **3.53:1** |
>
> O primeiro foi resolvido com `--champagne-ink` (≥768px). **O segundo continua em aberto** e é
> decisão de design: `.ba-caption` é o único texto `--canvas-muted` que não se apoia em nenhum painel
> e cai justamente na parte mais escura da sombra do relevo. Corrigi-lo exige escolher entre escurecer
> `--muted` globalmente ou dar tinta local à legenda — e tinta local contraria o princípio de que o
> `.spec-list`/`.ba-*` recebem a tinta do canvas, nunca de si mesmos.

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

## 🌫️ Relevo Arquitetônico

O background de desktop é **uma única superfície fixa** de gradientes desfocados, inteiramente em
CSS. Não são cenas por seção: é um campo contínuo de luz e sombra que se desloca e se recolore
conforme a página avança. Nenhuma camada tem contorno, aresta ou forma fechada — tudo é gradiente
suave mais blur, nunca linha.

Não há WebGL, shader, canvas nem dependência externa. `initReliefBackground()` em `script.js` só
decide qual capítulo está sendo lido, que tom ele veste e o quanto os planos já viajaram; as
camadas em si vivem no bloco `02a` de `style.css`.

O campo existe apenas acima de `915px`. Abaixo disso ele não é escondido, é **desmontado**:
`.no-canvas` volta, `.bg-root` sai com `display:none` e os fundos CSS chapados por seção assumem.

### As camadas

| Camada | Papel | Quando |
| :--- | :--- | :--- |
| `#relief-a` | Onda mestra, o plano difuso mais amplo | Sempre |
| `#relief-b` | Segunda depressão, mais lenta, cruzando em diagonal | Sempre |
| `#relief-c` | Pressão de canto — herdou o papel da antiga vinheta, sem falloff duro | Sempre |
| `#relief-directional` | Faixa direcional: acabamento tratado sob luz rasante, nunca reflexo especular | Só Floor Care |
| `#relief-zones` | Cinco zonas de pressão amplas e fracas — "cinco regiões" sem virar mapa | Só Impact |
| `#fog-far/-mid/-near` | Névoa 2.5D, três velocidades de paralaxe de cursor lendo como três distâncias | Sempre (invertida no claro) |
| `#accent-champagne` | Tingimento quente em `soft-light` | Floor Care, Impact |
| `#accent-sage` | Tingimento frio em `soft-light` | Before/After, Residential |
| `.grain` | Grão abaixo do limiar consciente, só para quebrar banding | Sempre |

A classe utilitária `.is-dark` acompanha os tons escuros e inverte cada camada de relevo entre
sombra preta e realce branco — por isso os gradientes são escritos duas vezes, e não uma vez por tom.

### Mapa de tons

Posições vêm de `offsetTop` / `offsetHeight`, então acompanham a altura efetiva do DOM, incluindo
FAQ aberto e etapas da Quote. O capítulo corrente é decidido por um único ponto —
`scrollY + innerHeight * .52` — porque com um fundo fixo **a viewport inteira é um tom só** a cada
instante.

| Seção real | Tom | Ground | Acento | Camada especial |
| :--- | :--- | :--- | :--- | :--- |
| Hero | `navy-deep` | Navy Dark | Petrol | — |
| Standard | `navy` | Navy | Petrol | — |
| Services | `navy` | Navy | Petrol Light | — |
| Maintenance | `paper` | Paper | Petrol | — |
| Floor Care | `petrol` | Petrol Deep | Champagne | `#relief-directional` |
| Before / After | `sand` | Sand | Petrol | `#accent-sage` |
| Residential | `ivory` | Ivory | Sage | `#accent-sage` |
| Impact | `sand` | Sand | Champagne | `#relief-zones` |
| Areas | `navy` | Navy | Petrol | — |
| Testimonials | `ivory` | Ivory | Champagne | — |
| FAQ | `paper` | Paper | Petrol | — |
| Quote | `paper` | Paper | Petrol | — |
| Closing / Footer | `navy-deep` | Navy Dark | Petrol Light | — |

### Movimento e repouso

O relevo se desloca lentamente com o progresso do scroll; a névoa carrega um offset de scroll
próprio, mais lento — essa diferença de ritmo é a razão inteira de ela ler como camada mais
distante. A posição do cursor é suavizada por interpolação contínua, nunca seguida diretamente; em
ponteiro grosso a névoa deriva sozinha em vez de ficar estática.

Com `prefers-reduced-motion: reduce`, relevo e névoa não se deslocam e o loop de névoa nem é
agendado. Os tons continuam trocando. A névoa também para com a aba oculta.

### Ponte tom → CSS e contraste

Continuam públicos os contratos `.no-canvas`, `data-canvas-ink` e `--canvas-*`. O que mudou é a
**fonte**: `--canvas-lum`, `--canvas-pol` e `--canvas-glow` não são mais amostrados de um chão
renderizado — são o que o tom do capítulo é, computados uma vez a partir do hex do ground. Como
`--canvas-pol` é registrada com `inherits: true` e a viewport inteira é um tom só, basta escrever
na raiz.

> **A polaridade pousa no meio da travessia, não no início.** O ground leva 1.8s para cruzar;
> `--canvas-lum` e `--canvas-glow` acompanham essa mesma curva, para que o halo alimentado por
> luminância abra exatamente enquanto o chão está no meio do caminho. Mas polaridade é binária e não
> pode interpolar: virá-la no primeiro frame poria tipografia escura sobre um chão ainda escuro por
> quase um segundo. Por isso ela é escrita com 900ms de atraso.

`data-webgl-state` foi substituído por **`data-bg-state`** (`booting` / `ready` / `disabled`).

Contraste medido de tinta contra ground, nos treze capítulos: corpo ≥ 8.28:1, texto `muted`
≥ 4.99:1, acento ≥ 3.68:1. Nenhum par reprova.

---

## 📐 `.spec-list` — o componente que costura três capítulos

Um único `<dl>` de rows label/valor com hairlines aparece três vezes e **nunca é reestilizado**:

| Aparição | Onde | Papel |
| :--- | :--- | :--- |
| `FC—01 Specialty` | `.fc-dossier` | dossiê impresso sobre a fotografia |
| `PL—02 Case` | `.ba-notes` | notas de leitura na margem da prancha |
| assurance index | `.faq-assurance` | segunda massa que equilibra o accordion |

Só a tinta muda, e ela vem de `--canvas-*`. Essa repetição é o argumento inteiro: três blocos
técnicos diferentes leem como três seções que receberam trabalho; um componente em três chãos lê como uma
publicação com estilo de casa para informação técnica.

No mobile (≤767px) ele empilha — label acima do valor — porque duas colunas em 346px deixam o
valor com ~250px e transformam "Greater Boston & Massachusetts" em três linhas irregulares.

---

## 🖥️ Desktop Full-Viewport / Scroll Snap (≥ 1201px)

No Desktop amplo a página deixa de ser uma coluna contínua de seções com alturas próprias e passa a
ser uma sequência de cenas: **um capítulo, uma viewport**. Quando o scroll estabiliza, uma única
seção domina o frame de ponta a ponta. A única camada que ainda atravessa a fronteira é o campo de
relevo — a recoloração contínua de 1.8s entre tons é intencional.

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
proporção: a foto da Residential ganhou altura em `dvh`, o bloco de Areas se compacta, e o frame
do Before/After troca a proporção por altura de viewport (`3/2` → `16/9` ≤980px → `2/1`
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
`.site-footer`. Assim o layout do snap e as medições do documento não mudam. Essa camada não cria
listeners de scroll e não toca no campo de relevo. Navegadores sem View Timelines mantêm o snap nativo;
com `prefers-reduced-motion: reduce`, todo o bloco Desktop Scroll Snap continua inativo.

### Relação com o mapa de tons em document-space

Nada é posicionado por uma sequência fixa de alturas. O mapa lê `offsetTop` / `offsetHeight` reais e
a remedição cobre `resize`, `orientationchange` e `load`, incluindo FAQ aberto e etapas da Quote. O
campo acompanha o `scrollY` real; não há uma animação de background específica para o snap.

Os seletores de capítulo são a chave comum entre DOM, paleta e perfil material. Ao renomear ou
remover uma `.scroll-snap-section`, atualize a entrada correspondente na trilha para manter cor,
contraste e estado material alinhados.

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
  (`.spec-list`) impresso sobre a fotografia, com a figura de registro `--mark-figure` atrás dele,
  ancorada ao próprio dossiê. Desde §22 o desktop também recebe `.fc-sheen`: uma faixa direcional
  larga que compartilha `--fc-mask` com foto e scrim e desliza contra o parallax.
- **A costura, feita com alpha:** o `background-color` sólido saiu. A fotografia (`::before`) e o
  scrim (`::after`) compartilham `--fc-mask` e **perdem alpha** nas duas pontas, revelando o campo
  de relevo. Não existe faixa de cor em lugar nenhum porque a camada de cima perde alpha em vez de
  ganhar outra cor.

> ⚠️ `--fc-mask` é construído a partir de `--fc-fade-top` / `--fc-fade`, que **são** o padding da
> seção. A parte sólida da fotografia termina exatamente onde a content box termina, em qualquer
> viewport. Uma versão anterior usava porcentagens e o fade atravessava o dossiê em certas
> alturas — tinta branca sobre fotografia dissolvendo sobre um chão clareando. Não mexa em um sem
> o outro.

- **Planos:** `initFloorParallax` mantém o deslocamento da fotografia e escreve também as variáveis
  de entrada/saída usadas pela costura. Sob `prefers-reduced-motion`, a foto não deriva e a máscara
  é resolvida diretamente no estado estável.
- **Campo material:** o tom passa a Petrol Deep e `#relief-directional` acende — uma faixa longa,
  difusa e fora de eixo, sugerindo acabamento polido sob luz rasante. Nunca um brilho de vitrine, e
  nenhuma decoração adicionada ao DOM.
- **Mobile:** o pôster vertical continua intacto; a fotografia recebe o pôster mais o próprio
  dissolve (`92svh + 210px`) e o dossiê continua abaixo, sobre o fallback CSS, como a próxima
  página do mesmo capítulo.

![Especialistas em Cuidados com Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_5_floor_care_banner_1786379340053.png)

---

### 6. Before / After — Editorial Case Study (`.section.beforeafter`)

- **Função narrativa:** a Floor Care afirma a especialidade; aqui ela é provada.
- **A prancha:** `.ba-board` é um grid de 12 colunas. Cabeçalho e comparador ocupam as colunas 1–8;
  as **notas de leitura** (`PL—02`, `.spec-list`) ficam na margem, colunas 9–12, alinhadas à base.
  A seção não pinta um fundo full-width: o campo material atravessa Paper → Sand e conduz a
  passagem visual entre fosco e restaurado.
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
> nativo cuida de drag, touch e teclado. Preservar dimensões, `aria-label` e `touch-action`.

![Comparador Antes / Depois de Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_6_before_after_slider_1786379476368.png)

---

### 7. Serviços Residenciais (`.section.residential`)

- **Design:** Layout de 2 colunas com fotografia de ambiente residencial e lista dos 3 pilares de atendimento em residências: Limpeza Padrão, Limpeza Pesada e Limpeza Move-In / Move-Out.

![Limpeza Residencial](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_7_residential_1786379643896.png)

---

### 8. Impacto Social (`.section.impact`)

- **Design:** Contador animado de proporção `5:1` (A cada 5 limpezas contratadas, 1 limpeza gratuita é oferecida para pacientes em situação de vulnerabilidade). Parceria humanitária com a organização **PPEAL**.
- **Campo material:** cinco presenças suaves cercam uma ausência central somente neste capítulo; o
  motivo começa a se dissolver antes de Areas.

![Impacto Social e Parcerias](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_8_social_impact_1786379828526.png)

---

### 9. Áreas Atendidas (`.section.areas`)

- **Design:** Apresentação do conceito de Serviço 100% Móvel e da cobertura em Greater Boston e
  Massachusetts. Desde §22 o desktop volta às duas massas assimétricas (`1.15fr / .85fr`): a
  mensagem e o **raio de cobertura** — anéis, linhas de alcance e quatro pontos que se reportam.
  Abstrato por construção, e calmado (sweep 11s → 26s, anel 48s → 96s): é um raio, não um radar
  fazendo demonstração. Nenhum mapa falso em lugar nenhum.

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
  responde à mesma régua champagne em vez de virar um botão preenchido de aplicativo.
- **Profundidade:** vem do Quiet Material Field, com terraços largos que se assentam sob o conteúdo.
  Desde §22 o accordion recupera o ritmo de índice técnico: numeração `01–08` por `counter()`, e a
  régua com nó de volta na resposta.
- **Encerramento:** FAQ e Quote permanecem sobre campo claro na trilha document-space. A entrada
  escura só começa depois da leitura da Quote, na Final CTA, onde o perfil assume Petrol → Navy →
  Navy Dark.
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

## ✨ 22. Editorial Polish (2026-08-29)

Passagem de **polimento**, não de redesenho. Nenhum capítulo foi recomposto, nenhum texto, imagem,
`id`, `data-*` ou CTA se moveu, e **nada abaixo de 767px foi tocado** — toda regra do bloco está em
`min-width:768px` ou acima. Vive em um bloco único no fim de `style.css` (`/* 22. EDITORIAL POLISH */`),
depois do bloco Desktop Scene Layout, para vencer por ordem de fonte.

### 22a. Tokens de movimento (aditivos)

Nenhum token existente foi redefinido — por isso toda regra escrita antes deste bloco mantém
exatamente o timing aprovado, mobile incluído.

```css
--ease-editorial: cubic-bezier(.25, 1, .5, 1);   /* chega, abre, assenta */
--ease-quick:     cubic-bezier(.32, .96, .52, 1); /* feedback */
--dur-reveal: 1.05s;  --dur-hover: .34s;  --dur-micro: .22s;
--champagne-ink: #7E6738;
```

### 22b. Line masking

Títulos em Fraunces entram **linha a linha, cada uma saindo da própria máscara**. As linhas não são
autoradas: `initLineMask()` mede o resultado real do navegador e reconstrói o heading a partir dele,
então as quebras são as que o browser escolheu naquela largura, com aquelas métricas. Remede em
`resize`, `orientationchange` e `document.fonts.ready`. Só toca headings de texto puro — um heading
que já carrega elementos próprios (as três especialidades da Floor Care) é reconhecido e ignorado.

> ⚠️ **`.lm-ghost` não é decoração — é o que segura a composição.** Linhas são caixas de bloco, então
> um heading quebrado contribui apenas com a **linha mais longa** para `max-content`, onde o heading
> inteiro contribuía com a frase toda. Como toda cena de desktop centraliza um container
> `fit-content` (margem auto em flex column ⇒ o item não estica), isso sozinho **reduziu a coluna da
> Quote de 1189px para 948px** — e as linhas tinham sido medidas contra a largura que a coluna deixou
> de ter. O ghost carrega a frase original com `height:0`, devolvendo a contribuição intrínseca
> original. Removê-lo reabre o loop de realimentação.

> A máscara é **desenhada, não recortada.** `overflow:hidden` cortaria também o `text-shadow` do hero
> e da Final CTA. A máscara termina exatamente na borda inferior da caixa de linha e sangra
> `--lm-bleed` (36px) nos outros três lados.

### 22c. Vocabulário desenhado, reequilibrado

A passagem anterior respondeu "o campo carrega a atmosfera" removendo **toda** a construção acima de
915px. Removeu demais: sem hairlines, cantoneiras, nós de índice e marcadores numéricos, nada costurava
uma cena à seguinte. A distinção que importa não é ornamento × nada — é **desenhado × pintado**:

- **volta** (peso reajustado): cantoneiras `.cornered`, tique e régua do `.eyebrow`, régua superior e
  espinha 01→04 da `.standard`, cantoneira do `.service-card`, régua/nó do `.spec-list`, moldura da
  `.residential-media`, régua e nó da resposta do FAQ, diagrama 5:1 do Impact, raio de cobertura do
  Areas (e sua composição em duas massas), medalhão da Closing Scene e as réguas do rodapé;
- **continua fora** do desktop: `.watermark` — massa preenchida em escala arquitetônica, a única que
  de fato disputa com o campo.

A régua de fechamento do `.eyebrow` agora **se desenha** na entrada da seção. Está escrita como estado
*fechado* no lado não revelado (`[data-reveal]:not(.is-revealed)`), nunca como estado aberto no lado
revelado — assim um eyebrow fora de qualquer contexto de reveal (o overlay de menu de 916–992px) mantém
a régua inteira em vez de ficar preso em `scaleX(0)`.

### 22d/e. Por capítulo

| Capítulo | O que mudou |
| :--- | :--- |
| Hero | Vinheta direcional (luz do alto à direita) + parallax de baixa amplitude (±13px). O push lento passou para `@property --hero-zoom`, para que o relógio de 8s fique no zoom e o parallax pouse no frame em que foi escrito |
| Standard | Espinha vertical na borda da coluna de numerais, desenhada na entrada; a régua de cada ponto agora atravessa a coluna e **encosta na espinha** no hover — o ponto se reporta ao protocolo |
| Services | Overlay vira luz caindo sobre a foto (dois radiais) em vez de uma rampa chapada; zoom quase imperceptível (1.035) em 1.6s |
| Maintenance | Painel do plano perde peso: menos vidro, hairline no lugar de borda, sombra de contato |
| Floor Care | `.fc-sheen` — uma faixa direcional larga compartilhando `--fc-mask` com foto e scrim, deslocando contra o parallax. Piso tratado sob luz rasante, sem reflexo especular |
| Before/After | Prancha WebGL local (§22f) |
| Impact / Areas | Diagrama 5:1 e raio de cobertura de volta, calmos (sweep 11s → 26s, ring 48s → 96s) |
| FAQ | Índice numérico `01–08` por `counter()` — zero markup, zero ARIA nova. `justify-content` passa a `flex-start` com o `+` empurrado por `margin-left:auto` |
| Quote | Hierarquia das etapas migra de **opacidade para cor** (ver contraste acima) |

Seis headings (`.maintenance-head h2`, `.residential h2`, `.impact h2`, `.areas h2`, `.quote h2`,
`.final-cta h2`) nunca declararam `line-height` e herdavam o `1.55` do body — em tipo de 40–58px isso
lê como entrelinha frouxa enquanto todo o resto da página já vive entre `.98` e `1.12`. Só a entrelinha
entrou no sistema; família, peso e tamanho não mudaram.

### 22f. A prancha WebGL do Before/After

Único WebGL do site, e o único lugar onde ele se paga: é o capítulo cujo argumento é materialidade,
então a fronteira entre as duas fotografias pode se comportar como uma lâmina d'água em vez de um corte
reto.

**Monta apenas** em `≥916px`, `pointer: fine`, sem `prefers-reduced-motion`, e só depois de as duas
fotografias decodificarem. Antes disso — e para sempre, se o contexto falhar — as duas camadas CSS
**são** a página.

- **O `input[type=range]` continua sendo a fonte de verdade.** O shader só traduz onde ele está;
  nunca escreve de volta. Verificado por `elementFromPoint` nas três terças do frame: o range recebe
  todos os hit tests.
- **Empilhamento:** o canvas é o **primeiro** filho do `.ba-frame`, então as duas `.ba-img` pintam
  por cima e continuam donas das suas legendas; com a prancha ativa elas apenas param de carregar a
  fotografia (`background-image:none; background-color:transparent`).
- **A máscara** mistura as duas texturas por ruído de valor de baixa frequência, duas oitavas.
  Deslocamento da fronteira: 0.75% da prancha em repouso, ~1.8% durante o arraste.
- **Dentro da faixa** (±2%): deslocamento UV amortecido, RGB split de ~0.15%, e um brilho petrol frio
  a ~8% — leitura de superfície úmida, nunca glitch.
- **Inércia curta:** o divisor persegue o alvo com `dt*11` e a energia decai `0.06^dt` (metade em
  ~250ms). Quando assenta, **o loop rAF para de vez** — a fronteira mantém a forma orgânica e nada
  mais se move. Por isso o contexto usa `preserveDrawingBuffer: true`: é um renderizador sob demanda.
- **Pausa** fora da viewport (IntersectionObserver), com a aba oculta, e desmonta em
  `webglcontextlost`, em ponteiro grosso ou com movimento reduzido.
- As fotografias são lidas de `--img-before` / `--img-after` no próprio frame — uma fonte só para a
  prancha e para o fallback. O mapeamento reproduz `cover` com o mesmo ponto focal do CSS
  (`center 62%`), e o shader reproduz as duas lavagens (grafite no gasto, aresta fria no restaurado),
  senão trocar entre prancha e fallback seria um corte.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico:** `<header>`, `<main>`, `<section>`, `<article>`, `<footer>` com acessibilidade ARIA completa.
- **Vanilla CSS:** Sem dependências externas de frameworks CSS (Tailwind ou Bootstrap), proporcionando desempenho máximo e controle total sobre o design system.
- **Vanilla JavaScript (ES6+):** Código limpo em IIFE, modularizado e focado em eventos passivos e `IntersectionObserver`.
- **Background em CSS puro:** o Relevo Arquitetônico é uma superfície fixa de gradientes desfocados.
  Nenhum WebGL, shader ou dependência participa dele.
- **WebGL nativo, em um único lugar:** a prancha local do Before/After (§22f de `style.css`,
  `initBeforeAfterGL()` em `script.js`). Sem Three.js, sem biblioteca de animação, sem vendor local —
  ~90 linhas de GLSL e o contexto `webgl` cru, com fallback CSS completo.
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
