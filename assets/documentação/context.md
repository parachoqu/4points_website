# Project Brief: US Cleaning & Janitorial Services Website

Este documento consolida todas as informações, dores operacionais, objetivos de negócio e requisitos técnicos para o desenvolvimento do novo ecossistema digital do cliente de serviços de limpeza baseado nos EUA.

---

## 1. Perfil do Cliente e Cenário Atual

* **Localização da Operação:** Estados Unidos.
* **Estrutura de Pessoal:** A empresa opera atualmente com uma equipe enxuta de apenas 2 funcionários, gerando um fluxo de trabalho intenso e uma agenda apertada.
* **Desempenho Orgânico:** O perfil do Google Business Account atrai de forma consistente entre 2 a 3 ligações semanais de novos clientes potenciais, mesmo sem nenhum investimento ativo em anúncios pagos.

---

## 2. Mapeamento do Problema (Dores do Negócio)

* **Falha no Canal Digital Anterior:** O cliente removeu o site antigo devido a falhas críticas no sistema de agendamento integrado, o que interrompeu o fluxo de conversão digital.
* **Logística de Endereço Físico:** A empresa não possui um escritório comercial físico aberto ao público. O endereço cadastrado no Google Business é de caráter puramente residencial, utilizado apenas para validação da conta. Como consequência, clientes em potencial frequentemente se deslocam até a residência por engano ao buscarem direções no mapa.

---

## 3. Direcionamento Estratégico e Público-Alvo

O modelo de negócios divide-se em duas frentes de atuação com margens de rentabilidade distintas:

### Contratos Comerciais (Foco de Alta Rentabilidade)
* **Objetivo:** O foco estratégico principal é fechar contratos comerciais de longo prazo com recorrências fixas (manutenções semanais, quinzenais ou mensais).
* **Segmento:** Atendimento a comércios, escritórios, refeitórios e instituições de ensino. 
* **Serviços Especializados:** A empresa realiza serviços de zeladoria (*janitorial services*), incluindo a retirada de lixo, higienização de banheiros e pisos, além de serviços especializados de enceramento e polimento de superfícies (*floor polishing & waxing*) realizados aos domingos.

### Serviços Residenciais (Foco de Volume)
* **Objetivo:** Captar serviços avulsos de limpeza residencial. 
* **Vantagem:** O fluxo de caixa é imediato, com pagamentos efetuados logo após a conclusão do serviço.
* **Desvantagem:** É um modelo operacionalmente exaustivo que consome muito tempo da equipe.

### Diferencial Competitivo e Impacto Social
* **Programa Social 5:1:** A cada 5 limpezas residenciais concluídas pela empresa, 1 limpeza corporativa/residencial de suporte é realizada gratuitamente como doação para projetos humanitários.
* **Parcerias Institucionais:** A empresa mantém uma colaboração ativa com duas organizações não governamentais (ONGs) focadas em ajuda humanitária, sendo uma delas a **PPEAL**, que oferece suporte a pacientes hospitalares acamados e necessitados de higienização em suas moradias.

---

## 4. Requisitos de Solução Digital

### Arquitetura do Site
* **Tipo:** Site Institucional Multi-Page focado em Geração de Leads (Lead Gen).
* **Estrutura Básica de Páginas:**
    * **Home Page:** Painel principal focado na proposta de valor única, conversão imediata (ligações/formulário) e exibição do programa social.
    * **Commercial / Janitorial Services:** Página dedicada a gerentes de facilities, detalhando planos recorrentes e o serviço de tratamento de pisos.
    * **Residential Cleaning:** Página voltada a agendamentos ou solicitações residenciais rápidas.
    * **Our Social Impact:** Seção institucional contando a história das parcerias humanitárias com a PPEAL.

### Recursos Técnicos Obrigatórios
* **Contorno de Localização Física:** Substituição do endereço fixo por uma seção em destaque de "Áreas Atendidas" (*Areas We Serve*), fixando o conceito de atendimento 100% móvel e sob demanda.
* **Formulário de Cotação Inteligente:** Substituição do antigo sistema problemático por um formulário de triagem de leads, coletando o tipo de propriedade, frequência de manutenção e tamanho estimado do local.
* **Otimização Local & Mobile:** Alinhamento completo com o tráfego mobile vindo do Google Business Account.
* **Performance Control:** O pipeline de desenvolvimento deve forçar a atualização imediata dos arquivos de estilo e scripts em produção através de mecanismos de Cache Busting dinâmico, evitando gargalos de carregamento em dispositivos móveis no tráfego de rua.

---

## 5. Escopo de Entrega e Design

| Fase do Projeto | Descrição da Entrega |
| :--- | :--- |
| **Fase 1: Brand Identity** | Criação de um novo logotipo corporativo mais atraente e definição da paleta de cores institucional. |
| **Fase 2: UI/UX & Copy** | Design visual das telas (Figma) e redação dos textos focados no mercado americano (*Janitorial, Floor Care, Maintenance Plans*). |
| **Fase 3: Code & SEO** | Desenvolvimento frontend/backend responsivo, integração do formulário e otimização para SEO Local. |
| **Fase 4: Setup Google** | Integração do novo link no Google Business Account e atualização da nova identidade visual. |

---

## 6. Proposta Financeira e Condições

> **Nota de Alinhamento:** Por se tratar de um mercado internacional com faturamento dolarizado, o valor de mercado deve ser balizado de forma competitiva com o cenário B2B americano.

### Condições de Pagamento
* **30% de Entrada (Sinal):** Valor pago no ato da contratação para cobrir os custos imediatos de licenciamento de ferramentas, servidores de desenvolvimento e reserva de agenda. **Não reembolsável.**
* **40% Intermediário:** Pago após a entrega e aprovação formal do layout de interface e do logotipo finalizado.
* **30% na Entrega Final:** Pago no encerramento do desenvolvimento, homologação do formulário e publicação do site em ambiente de produção (Live).