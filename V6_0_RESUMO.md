# V6.0 — Blindagem de Produção

## O que foi corrigido
- rate limit de login mantido com banco como fonte principal, com fallback em memória apenas como contingência e log explícito quando acionado
- proteção de origem confiável nas Server Actions críticas
- sanitização centralizada de `locationLink`, aceitando apenas `http://` e `https://`
- pool PostgreSQL estabilizado com singleton também em produção
- decode seguro de feedback via query string para evitar quebra por `decodeURIComponent`
- exclusão de filtros salvos com validação de UUID antes do `DELETE`
- correção do `package.json` para deploy consistente em ambientes como a Vercel

## Arquivos alterados
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `CHECKLIST_V60.md`
- `V6_0_RESUMO.md`
- `lib/db.ts`
- `lib/order-parser.ts`
- `lib/server-data/shared.ts`
- `lib/export.ts`
- `lib/url-safety.ts`
- `lib/search-param-feedback.ts`
- `lib/server-action-security.ts`
- `app/api/auth/login/route.ts`
- `app/(protected)/orders/actions.ts`
- `app/(protected)/users/actions.ts`
- `app/(protected)/technicians/actions.ts`
- `app/login/page.tsx`
- `app/(protected)/orders/page.tsx`
- `app/(protected)/orders/new/page.tsx`
- `app/(protected)/users/page.tsx`
- `app/(protected)/technicians/page.tsx`
- `app/(protected)/profile/page.tsx`
- `components/orders/order-detail-panel.tsx`

## Testes executados
- `npm run typecheck`
- `npm run build` com variáveis de ambiente de placeholder válidas para validação de build
