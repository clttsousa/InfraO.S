# V6.4.1 — Hotfix Auditoria em Produção

Esta versão corrige o erro reportado ao acessar `/audit` em produção.

## Causa provável

O driver `pg` pode devolver campos `timestamptz` como objeto `Date`. A tela de auditoria usava `createdAtIso.startsWith(...)`, esperando uma string. Quando havia eventos de auditoria na base, isso podia gerar erro de Server Component no Next/Vercel.

Além disso, caso a migration de auditoria ainda não tenha sido aplicada no banco de produção, a consulta em `audit_events` também poderia derrubar a tela.

## Correções aplicadas

- `lib/server-data/audit.ts` agora normaliza `created_at` para string ISO antes de entregar para a UI.
- `getAuditEvents` e `getServiceOrderAuditEvents` tratam ausência da tabela/colunas de auditoria retornando lista vazia em vez de quebrar a página.
- Atualização da versão do pacote para `6.4.1`.

## Atenção

Mesmo com o fallback, para a auditoria funcionar de verdade em produção é necessário rodar a migration:

```sql
-- database/14_audit_events.sql
```

No Supabase, abra o SQL Editor, cole o conteúdo desse arquivo e execute.
