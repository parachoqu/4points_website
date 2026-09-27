# 4Points Cleaning Services — site

> **Empresa:** 4Points Cleaning Services
> **Escopo:** limpeza comercial, zeladoria, cuidados especializados de piso e limpeza residencial
> em Greater Boston & Massachusetts.
> **Hospedagem:** Vercel, projeto `4pointscleaning`.

Site estático — HTML, CSS e JavaScript sem framework, sem build step, sem dependência de runtime —
mais uma única função serverless para o formulário de orçamento.

A direção visual atual é a **"Superfície de Precisão / Luz Rasante"**: a página se comporta como um
plano tratado sob luz rasante, e se pole ao longo do capítulo sobre polimento. Substituiu o
"Relevo Arquitetônico" (Fraunces + campo de gradientes desfocados) em 2026-09-27; o design anterior
segue no histórico do git e nas capturas em `captures/` e `docs/`.

---

## Estrutura

```
index.html                     a página inteira
css/styles.css                 base + 18 camadas de refinamento
js/main.js                     conteúdo dos serviços, interações, dois shaders
api/quote.js                   função serverless: envia o orçamento por e-mail
scripts/cache-bust.js          versiona CSS/JS por hash de conteúdo
assets/images/
  uniformes/*-hq.webp          as seis fotos de serviço (edição de uniforme 2026-09-21)
  uniformes/*.json             procedência: prompts e hashes das edições
  compare/before.jpg after.jpg o comparador de piso do #floorcare
  favicon.png  LOGO TIPOGRAFICA.png
docs/  captures/               registro do design anterior
```

O logotipo do cabeçalho **não** é um arquivo: é o token `--logo`, um PNG em base64 dentro do
`styles.css`. Trocar a marca é trocar aquele data-URI.

---

## As 18 camadas

O `styles.css` é uma base seguida de dezoito camadas, cada uma ligada por um `data-*` no `<html>` e
**cada uma removível sozinha** — tirar o atributo devolve o estado anterior sem tocar em nenhuma
regra. A ordem no arquivo é a ordem da cascata: uma camada só sobrepõe as anteriores.

| `data-*` no `<html>` | O que liga |
| :-- | :-- |
| `art-direction="surface-plane"` | arestas, contato e profundidade: a página vira superfície |
| *(mesma camada)* | coreografia: cinco gestos de entrada, `.sp-motion`, só no desktop |
| *(mesma camada)* | latão mineral nos pontos de decisão + serif editorial nos títulos |
| `palette="atelie-operacional"` | composição cromática: papéis de marinho, petróleo, latão, sage |
| `brand-tones="logo"` | azuis e dourados reancorados nos hex medidos da logo |
| `navy-flow="logo"` | superfícies escuras viram gradiente vivo de 24 s |
| `navy-field="shader"` | o fluxo marinho vira um campo WebGL único atrás da página |
| `sand-field="shader"` | a versão clara do mesmo campo, atrás das sete seções de papel |
| `cta-plate="osso"` | os 5 CTAs de conversão saem do latão e ganham filete de ouro profundo |
| `cta-fill="logo"` | e o preenchimento passa a ser o azul exato da lâmina da logo |
| `hero-card="osso"` | a placa de credenciais do hero em osso, com borda azul da marca |
| `header-logo="compacta"` | logo do cabeçalho a ~88% |
| `footer-height="compacta"` | rodapé ~22% mais baixo no desktop |
| `btn-plate="rasante"` | a física do botão deixa de depender do fundo (três níveis de peso) |
| `type-scale="editorial"` | hierarquia tipográfica: três vozes, escala fluida |
| `mobile-deck="baralho"` | o mobile vira cartas opacas sobre uma mesa marinha |
| `mobile-chrome="seletor-indice"` | menu vira seletor de 4 linhas; rodapé vira índice corrido |

Duas camadas locais foram acrescentadas ao portar para este repositório (no fim do arquivo, sem
`data-*` porque não são opcionais): **âncoras de compatibilidade** (`#residential` e `#areas`, os
endereços do site anterior) e o **aviso de falha do envio** (`.form-error`).

**Ao editar, leia o comentário de bloco da camada antes.** Cada um registra o que foi medido, a
especificidade escolhida e por quê — inclusive os empates de cascata que só se resolvem pela ordem.

---

## Cor

Cinco papéis, e a regra é que cada cor só aparece onde tem função:

| Papel | Quando aparece |
| :-- | :-- |
| **marinho** `#0C283E` | autoridade, estrutura, pausa, comparação, decisão |
| **petróleo** `#16617A` | operação: seleção, fluxo, interação, serviço em andamento |
| **latão** `#CCA85E` | decisão: conversão, avanço, controle prioritário |
| **champanhe** `#CBB68D` | precisão: filetes, costuras, marcadores, acabamento |
| **sage** `#86A58A` | cuidado: impacto positivo, sucesso, confirmação |

O azul da lâmina da logo é `#1F6F8B` e o ouro da horizontal é `#C8A96A` — todos os tons acima são
giros medidos em OKLCH a partir desses dois.

A cadência da página: hero (tensão) → placas minerais (tratar) → placa escura do Floor Care
(comprovar o material) → papéis quentes (método, equipe, impacto) → areia profunda (decidir) →
marinho (pausa).

**Os contrastes estão medidos, não estimados.** Os comentários do CSS carregam as razões WCAG de
cada par crítico, inclusive nos quatro quadros do ciclo do shader. Ao mudar um token, remeça.

## Tipografia

- **Newsreader** — capítulo: H1, todo H2, título do impacto, citações
- **Barlow** — componente: H3/H4 em painéis, pilares, FAQ, formulário
- **Manrope** — leitura: lead, corpo, rótulos

Escala 1440 / 390: H1 72/38, H2 54/31, H3 30/24, lead 21/18, corpo 17/16.

---

## Os dois campos em shader

`js/main.js` traz dois campos WebGL, ambos derivados do shader "Oceanic"
(21st.dev, `@yaoztorun/adisyon-shader`): névoa fbm, onda senoidal, distorção de domínio, deriva
lenta e granulação. Mesma onda, duas paletas — as duas metades da página continuam uma na outra.

- **`.nf-field` (marinho)** — um canvas `position:fixed` em `z-index:-1` atrás de tudo. Cabeçalho,
  rodapé, faixa CTA e `#floorcare` ficam transparentes e o campo aparece por eles. O cabeçalho e o
  menu mobile pintam *acima* do conteúdo, então recebem um **canvas espelho** com a fatia do mesmo
  quadro.
- **`.sf-field` (areia)** — nunca pinta. Alimenta sete espelhos, um por seção clara, cada um
  recortado na caixa da sua seção por `clip-path`. Só acima de 920px.

Ambos são **progressive enhancement**. O JS só escreve `data-field-engine="webgl"` /
`data-sand-engine="webgl"` no `<html>` **depois do primeiro quadro desenhado**, e o CSS só abre as
janelas com esse atributo presente. Sem WebGL, com contexto perdido ou no celular, as superfícies
ficam no gradiente CSS e nada pisca. Abaixo de 921px ou com movimento reduzido o campo marinho
desenha **um quadro só**, parado — o que o conceito do mobile pede, já que a diagonal fica ancorada
na tela e cada capítulo chega sobre um tom diferente.

## Movimento

- **Desktop** — a classe `.sp-motion` é aplicada só com `(min-width:921px)` e
  `prefers-reduced-motion: no-preference`; as entradas esperam a seção entrar em tela via
  `IntersectionObserver`. Cinco gestos: calibrar, assentar, traçar, percorrer, confirmar. Sem
  overshoot, sem bounce, sem loop.
- **Mobile** — as entradas vêm da rolagem, não do relógio: `animation-timeline: view()` atrás de um
  `@supports`. Sem suporte, as cartas ficam estáticas.
- Controles (`.chip`, `.btn`, `.faq__btn`, `.dot`) respondem à pessoa e **nunca** animam sozinhos.

---

## Formulário de orçamento

Quatro passos com validação por etapa, resumo sincronizado com as escolhas feitas nas seções
acima, e revisão final editável. O envio é real.

**Fluxo:** `js/main.js` faz `POST /api/quote` → `api/quote.js` valida de novo no servidor e envia
o e-mail pelo **Resend** → `4pointscontact@gmail.com`, com `reply_to` apontando para quem pediu.

**Quatro estados**, e o quarto importa: se a rede cai, a função erra ou a chave não está
configurada, o formulário **volta inteiro e preenchido** com o telefone ao lado. Ele nunca mostra
"Request received" sem o envio ter acontecido — uma confirmação falsa faria a pessoa esperar por um
retorno que nunca vem.

### Variáveis de ambiente

| Variável | Origem | Sem ela |
| :-- | :-- | :-- |
| `RESEND_API_KEY` | injetada pela integração Resend do Vercel Marketplace | a função responde 503 e o site mostra a falha |
| `QUOTE_TO` | opcional | usa `4pointscontact@gmail.com` |
| `QUOTE_FROM` | opcional | usa `onboarding@resend.dev` (remetente de teste do Resend) |

Provisionar a integração:

```bash
vercel integration add resend/resend-email --yes --no-claim
vercel env pull --yes
```

Depois de verificar `4pointscleaning.com` no painel do Resend, defina
`QUOTE_FROM="4Points <quotes@4pointscleaning.com>"` — a entregabilidade melhora e o e-mail para de
chegar como "via resend.dev".

A função não tem dependências: o runtime é Node 24 (fixado em `.vercel/project.json`) e o `fetch`
é nativo. Não há `package.json` de propósito — uma dependência obrigaria um install no build de um
site que hoje é estático puro.

---

## Cache busting

```bash
node scripts/cache-bust.js
```

Reescreve `css/styles.css?v=<hash>` e `js/main.js?v=<hash>` nos HTML, por sha256 do conteúdo.
**Rode antes de publicar, sempre que CSS ou JS mudar.** O script lança erro se um asset referenciado
não existir, então ele também serve de verificação de caminhos.

O HTML deve ser revalidado e CSS/JS podem usar cache longo graças ao `?v=`. O controle fica nos
headers da CDN, não em `<meta http-equiv>`.

## Rodar local

```bash
python3 -m http.server 8080
```

`http://localhost:8080`. O `/api/quote` **não** responde nesse servidor — o formulário exercita o
caminho de falha, que é justamente o que se quer testar localmente. Para o caminho de sucesso, use
`vercel dev`.

## Verificar antes de publicar

1. Desktop ≥1201px: carrossel do hero, rail de serviços, comparador de piso, os 4 passos do
   formulário. No DevTools, o `<html>` deve ganhar `data-field-engine` e `data-sand-engine`.
2. Mobile 390×844: as cartas sobre a mesa marinha, o CTA "Quote" no cabeçalho, o seletor de menu
   com o capítulo atual centrado, a faixa de credenciais rolando na horizontal.
3. `prefers-reduced-motion`: nada anima, nada fica invisível.
4. Sem WebGL: as superfícies caem para o gradiente CSS, nada fica transparente.
5. Formulário: um envio real chega em `4pointscontact@gmail.com`; com o endpoint fora, o aviso de
   falha aparece e o formulário volta preenchido.
6. `/#residential` e `/#areas` ainda rolam a página.
