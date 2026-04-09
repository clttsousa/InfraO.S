# V6.1 — Performance e Consistência

## O que foi otimizado
- `getServiceOrderDetail` agora busca dados principais, notas e logs em uma única consulta agregada
- a tela de ordens deixou de carregar listagens completas de usuários internos sempre; isso só ocorre quando a edição precisa dos selects
- filtros e selects operacionais passaram a usar diretórios leves de técnicos/usuários, reduzindo consulta desnecessária nas rotas operacionais
- a exportação Excel de ordens e relatórios passou a sair do próprio formulário de filtros, eliminando divergência entre tela e arquivo
- os cards com sparkline agora reduzem ou simplificam a leitura quando há baixo volume, evitando gráficos visualmente enganosos
- `getEnv()` e o pool de banco ficaram mais previsíveis em desenvolvimento, especialmente após Fast Refresh ou mudança de `.env`

## Arquivos alterados
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `CHECKLIST_V61.md`
- `V6_1_RESUMO.md`
- `tsconfig.json`
- `types/index.ts`
- `lib/data.ts`
- `lib/db.ts`
- `lib/env.ts`
- `lib/sparkline.ts`
- `lib/server-data/orders.ts`
- `lib/server-data/users.ts`
- `app/(protected)/dashboard/page.tsx`
- `app/(protected)/orders/page.tsx`
- `app/(protected)/orders/new/page.tsx`
- `app/(protected)/reports/page.tsx`
- `components/orders/order-detail-panel.tsx`
- `components/orders/order-filters.tsx`
- `components/orders/support-technician-selector.tsx`

## Ganhos esperados
- menos custo para abrir o detalhe da O.S.
- menos dados auxiliares carregados sem necessidade na operação diária
- exportação mais confiável e alinhada à UI
- dashboard com leitura visual menos enganosa em bases pequenas
- ambiente dev mais estável ao iterar configurações

## Validação executada
- `npm install`
- `npm run typecheck`
