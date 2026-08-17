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
| `--petrol-deep` | `#12556B` | 🌊 Petrol Profundo | Início do gradiente da Final CTA |
| `--petrol` | `#1F6F8B` | 🔹 Azul Petrol | Destaques de badges, subtítulos e links |
| `--petrol-light` | `#2A8EAA` | 💧 Petrol Claro | Estados de `:hover` e anéis de foco de acessibilidade |
| `--sage` | `#8BAE8B` | 🌿 Verde Sálvia | Elementos ecológicos, indicador de presença mobile e impacto social |
| `--sage-soft` | `#DDE8D8` | 🍃 Sálvia Suave | Tags de contraste sobre superfícies escuras |
| `--champagne` | `#C8A96A` | 🟡 Dourado/Champagne | Botões de Ação Principal (CTA) "Request a Quote" |
| `--champagne-deep` | `#A9894C` | 🟤 Champagne Escuro | Estado `:hover` dos numerais dos pilares |
| `--ivory` | `#F7F4EF` | 📜 Marfim | Seções de contraste suave |
| `--paper` | `#FFFDF8` | 📄 Papel | Fundo limpo principal da página |
| `--graphite` | `#2B2F32` | 📓 Grafite | Texto do corpo de altíssima legibilidade |
| `--muted` | `#62717D` | 🌫️ Cinza Muted | Descrições secundárias, bordas e metadados |

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
  --graphite: #2B2F32;
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

### 5. Banner de Cuidados com Pisos (`.floorcare`)

- **Design:** Bloco em fundo escuro nobre (`--navy-dark`) com tipografia Fraunces em grande escala (`Polishing. Waxing. Restoring.`), além de badge destacando atendimento aos domingos (*Sunday Service Available*).

![Especialistas em Cuidados com Pisos](/home/https/.gemini/antigravity-ide/brain/ce12fde1-0eb2-4d3d-947c-877d16257892/section_5_floor_care_banner_1786379340053.png)

---

### 6. Comparador Antes / Depois (`.section.beforeafter`)

- **Design:** Componente interativo de comparação de superfícies de piso. Permite arrastar o divisor ou mover a barra de rolagem para ver a transformação de um piso desgastado em uma superfície restaurada e polida.

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

### 11. Perguntas Frequentes | FAQ (`.section.faq`)

- **Design:** Accordion de perguntas com controle por botão e animação suave de altura (`max-height`). Cobre temas como orçamento, seguros, flexibilidade de contratos, equipamentos e atendimento aos domingos.

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
