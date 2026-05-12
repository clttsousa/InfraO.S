# V6.12.4 — Estabilidade Geral e Correções Finas

Versão de estabilização antes de novos recursos. O foco foi reduzir falsos erros, padronizar mensagens para o usuário e deixar o build mais previsível em páginas protegidas.

## Principais correções

- Adicionado helper `lib/action-errors.ts` para detectar `NEXT_REDIRECT` e evitar que redirects do Next sejam tratados como erro operacional.
- Corrigidas actions de intervenções para relançar `NEXT_REDIRECT` antes de qualquer rollback/mensagem de erro.
- Corrigidas actions de filtros salvos em Ordens para não capturar redirect de sucesso como falha.
- Mensagens de erro vindas de banco/SQL agora são sanitizadas antes de aparecer no front-end.
- Mensagens de feedback vindas da URL passam por `decodeSearchParamMessage`, evitando exibição de `NEXT_REDIRECT`, stack trace ou erro técnico.
- `FormStateGuard` agora também reduz risco de submit duplicado por duplo clique.
- Toasts/notificações flutuantes respeitam a bottom navigation no mobile e não ficam atrás da barra inferior.
- Páginas protegidas e páginas dependentes de sessão foram marcadas como `force-dynamic`, evitando tentativa de geração estática indevida em páginas que dependem de banco/cookies.
- Ajustado `package.json`/`package-lock.json` para versão `6.12.4`.
- Corrigida a configuração `ignoreDeprecations` no `tsconfig.json` para compatibilidade com TypeScript 6.0 usado no projeto.

## Arquivos principais alterados

- `lib/action-errors.ts`
- `lib/search-param-feedback.ts`
- `app/(protected)/intervencoes/actions.ts`
- `app/(protected)/orders/actions.ts`
- `app/(protected)/users/actions.ts`
- `app/(protected)/technicians/actions.ts`
- `components/shared/form-state-guard.tsx`
- `components/providers/notification-provider.tsx`
- páginas protegidas com `export const dynamic = "force-dynamic"`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

## Validação executada

```bash
npm ci --ignore-scripts
npm run typecheck
```

Resultado: typecheck aprovado.

Também foi executado:

```bash
CI=1 NEXT_TELEMETRY_DISABLED=1 timeout 240s npm run build
```

Resultado: compilação e TypeScript passaram; o ambiente local ainda encerrou em `Collecting page data` com `EPIPE`. Foram aplicados `force-dynamic` nas páginas protegidas para evitar geração estática indevida, então a recomendação é validar o build também no ambiente real/Vercel.

## Testes recomendados

1. Criar O.S. e confirmar que não aparece erro falso após sucesso.
2. Editar O.S. e mudar status.
3. Criar intervenção e confirmar que não aparece `NEXT_REDIRECT`.
4. Editar intervenção e alterar status.
5. Salvar/remover filtro de Ordens.
6. Criar/editar usuário como admin.
7. Criar/editar técnico como admin.
8. Testar central de notificações, marcar como lida e marcar todas como lidas.
9. Testar PWA: `Testar local` e `Enviar teste push`.
10. Testar mobile com bottom navigation e toasts.
