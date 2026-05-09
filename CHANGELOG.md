# Changelog — Frontend

Todas as mudanças relevantes deste projeto são documentadas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

---

## [0.9.0] — 2025-05-09 — Comparativo Avançado

### Adicionado
- **Página `/comparativo`** completamente refatorada com dois modos:
  - **Comparativo Avançado** (plano PROFISSIONAL+): comparativo entre dois períodos arbitrários com gráficos e heatmap
  - **Comparativo Legado**: comparativo mensal simples (mantido para compatibilidade retroativa)
- **Componentes** em `src/components/comparativo/`:
  - `IntervaloSelector` — seleção de dois períodos com validação e persistência no `localStorage`
  - `GranularidadeToggle` — botões DIA / MES / HORA
  - `ResumoCards` — 4 KPIs lado a lado com variação percentual (↑ verde / ↓ vermelho)
  - `GraficoComparativo` — gráfico de linhas dual (período A vs B) usando Recharts
  - `HeatmapSemana` — grid 7 × 24 com escala de cores por intensidade de fluxo
  - `ExportacaoBotoes` — dropdown para download de XLSX / PDF / CSV
- **Tipos API** em `src/api/client.ts`:
  - `ComparativoPeriodosDto`, `ComparativoResumoDto`, `PontoSerieDto`, `HeatmapCelulaDto`
  - `dashboardApi.getComparativo()` e `dashboardApi.exportarComparativo()`
- **Testes Vitest**:
  - `src/test/Comparativo.test.tsx` (12 testes: renderização, toggle de granularidade, estado de carregamento, plano gate)
  - `src/test/IntervaloSelector.test.tsx` (8 testes: validação de datas, persistência localStorage, estado inválido)
- **Testes E2E Playwright** em `e2e-tests/comparativo-evolucao.spec.ts` (10 cenários):
  - Controle de acesso por plano (ESSENCIAL vê banner de upgrade)
  - Validação de formulário (datas inválidas, período futuro)
  - Persistência de filtros no localStorage
  - Dropdown de exportação presente e funcional
  - Resultados renderizados após submit
  - Navegação e rota protegida
- **`e2e-tests/helpers/auth.ts`**: `loginAs()` (UI), `setToken()` (localStorage), `gotoComparativo()`
- **`playwright.config.ts`** com `webServer` auto-start, Chromium, `baseURL: localhost:5173`
- Scripts npm: `test`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`

### Modificado
- `eslint.config.js`: desabilita globalmente `react-hooks/set-state-in-effect` (regra controversa v5 que flageia padrões válidos) e reduz `react-refresh/only-export-components` para `warn`
- `vitest.config.ts`: exclui `e2e-tests/**` para evitar que o Vitest tente rodar specs do Playwright
- `src/pages/Comparativo.tsx`: reestrutura `useEffect` do modo legado com `Promise.resolve()` chain para compatibilidade com nova regra ESLint

### Corrigido
- `src/pages/HistoricoUpload.tsx`: ternário usado como statement para side-effects → convertido para `if/else` explícito (erro `@typescript-eslint/no-unused-expressions`)

---

## [0.8.0] — 2025-04 — Upload em Lote (Fase 1)

### Adicionado
- **Página `/importar`** com modo de upload em lote:
  - Seleção múltipla de PDFs
  - Pré-checagem de duplicata via `HEAD /api/importacao/hash/{sha256}` antes do upload
  - Cálculo de SHA-256 no browser (Web Crypto API) sem envio do arquivo
  - Fila visual com status por arquivo (novo / duplicado / enviando / processando / concluído / erro)
  - Polling de status por `job_id` com intervalo de 3s e timeout de 5min
- **Tipos API**: `ImportacaoJob`, `checkHash()`, `criarJob()`, `consultarJob()`
- **Testes Vitest**: `sha256` (5 casos), `HeuristicaTipo` (6 casos), `UploadEmLote` (12 casos)
- **Testes E2E Playwright**: spec de upload em lote com mock de API

### Corrigido
- `job_id` retornado em snake_case pelo backend — normalizado no `client.ts`
- `checkHash` distingue 200 (duplicado) de 204 (novo arquivo)
- Campos `snake_case` (`data_referencia`, `tipo_relatorio`) no histórico de uploads

---

## [0.7.0] — 2025-04 — Histórico de Uploads e Autenticação

### Adicionado
- **Página `/historico`** — histórico de uploads agrupado por dia:
  - Cards expansíveis por dia com status COMPLETO / PENDENTE
  - Lista de arquivos com nome, tipo, status de processamento e data de envio
  - Indicação de arquivos faltando (RFE e/ou REM não enviados)
  - Filtros de ano e mês com busca manual e automática ao montar
  - Resumo: total de dias, completos, pendentes
- **Contexto de autenticação** (`AuthContext`) com JWT no `localStorage`
- **Contexto de instituição** (`InstituicaoContext`) para SUPER_ADMIN/SISTEMA_ADMIN selecionarem tenant
- **Hook `useAuth`** e **hook `usePlano`** para acesso a dados do usuário e feature gating
- **Páginas admin**: `Usuarios`, `Instituicoes`, `PlanoGestao`, `Contas`
- **Fluxo de senha**: `EsqueciSenha`, `ResetSenha`
- Proteção de rotas: redirect para `/login` se não autenticado; redirect se não tem acesso ao plano

### Corrigido
- Upload de PDF passava sem `instituicaoId` — agora lido do `InstituicaoContext`

---

## [0.6.0] — 2025-03 — Páginas Avançadas do Dashboard

### Adicionado
- **`/semana`** (`AnaliseSemana`) — análise de desempenho por dia da semana com heatmap semanal
- **`/gratuidade`** (`Gratuidade`) — análise de tickets gratuitos e isenções
- **`/ranking`** (`Ranking`) — ranking comparativo entre instituições (SUPER_ADMIN/SISTEMA_ADMIN)
- **`/metas`** (`Metas`) — definição e acompanhamento de metas mensais
- **`/previsao`** (`Previsao`) — previsão de resultados do mês baseada em histórico + IA

---

## [0.5.0] — 2025-02 — Distinção de Veículos e Desempenho Anual

### Adicionado
- **`/anual`** (`DesempenhoAnual`) — gráfico mensal do ano com seleção de ano e variação
- Gráficos com distinção carros / motos / caminhões / credenciados
- `fluxo-diario-veiculo` e `fluxo-horario-veiculo` na API

---

## [0.4.0] — 2024-12 — Dashboard Inicial

### Adicionado
- **`/`** (`Overview`) — KPIs mensais, fluxo diário e receita
- **`/fluxo`** (`FluxoVeiculos`) — fluxo diário por categoria com seleção de mês
- **`/horario`** (`MovimentacaoHoraria`) — movimentação por faixa horária com seleção de data
- Layout responsivo: sidebar fixa ≥ 1024px; drawer + hamburger < 1024px
- `src/api/client.ts` com funções tipadas para todos os endpoints do dashboard

---

## [0.3.0] — 2024-12 — Separação em Repositório Próprio

### Adicionado
- Frontend extraído do monorepo para `soares-consultoria/estacionamento-frontend`
- Configuração Vite + TypeScript + Tailwind CSS 3
- Pipeline CI/CD independente (`deploy.yml`): build → SCP → nginx reload
- Variável `VITE_API_URL` via GitHub Secrets

---

## [0.1.0] — 2024-11 — Implementação Inicial

### Adicionado
- Projeto React 19 + TypeScript + Vite criado
- Integração inicial com API de importação e dashboard básico
