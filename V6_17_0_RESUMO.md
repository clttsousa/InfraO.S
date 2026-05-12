# InfraOS V6.17.0 — Performance, Paginação e Busca

## Objetivo

Preparar o InfraOS para crescimento real de dados, evitando carregar listas inteiras no cliente e deixando Ordens, Intervenções, Notificações, Usuários e Auditoria mais rápidas no mobile e no desktop.

## Entregas principais

### 1. Paginação server-side

- **Ordens**: mantida a paginação server-side já existente, com busca ampliada e preservação de filtros por URL.
- **Intervenções**: listagem passou a retornar `items`, `total`, `page`, `pageSize` e `totalPages` vindos do servidor.
- **Notificações**: central completa passou a paginar a fila por filtro, sem buscar tudo de uma vez.
- **Usuários**: página administrativa passou a buscar, filtrar e paginar no banco.
- **Auditoria**: eventos passaram a usar paginação server-side com filtros combinados.

### 2. Busca otimizada

- **Ordens**: busca por número da O.S., cliente, descrição, endereço/localidade, técnico principal, equipe de apoio, responsável interno, status e prioridade.
- **Intervenções**: busca por título, localidade, tipo, origem, status, mensagem original e observações.
- **Usuários**: busca por nome, e-mail e perfil.
- **Auditoria**: busca por O.S., intervenção, entidade, ação, campo, usuário, descrição e metadados.

### 3. Filtros preservados na URL

- Filtros e paginação permanecem na URL em Ordens, Intervenções, Usuários, Auditoria e Notificações.
- Atualizar a página não perde o contexto.
- Links filtrados podem ser compartilhados.
- Abrir detalhes/drawers preserva o contexto da listagem.

### 4. UX de paginação

- Criado `components/shared/pagination-footer.tsx`.
- Desktop: seletor de quantidade por página, contador de registros, páginas numeradas e botões anterior/próxima.
- Mobile: layout compacto com contador, página atual e botões simples.
- Opções padrão:
  - Intervenções: 20, 50, 100.
  - Notificações: 20, 50, 100.
  - Usuários: 25, 50, 100.
  - Auditoria: 25, 50, 100.

### 5. Notificações

- A central agora trabalha por filtros paginados:
  - Todas;
  - Intervenções;
  - Ordens;
  - Sistema;
  - Lidas.
- O dropdown/popover continua limitado a itens recentes e não tenta renderizar histórico completo.
- O endpoint `/api/notifications/summary` aceita `filter`, `page` e `pageSize`.

### 6. Auditoria

- Auditoria recebeu paginação server-side.
- Adicionados filtros por:
  - período;
  - usuário;
  - entidade;
  - ação;
  - busca textual.
- A lista continua adequada para mobile e desktop.

### 7. Migration de índices

Criado o arquivo:

```text
database/20_performance_indexes.sql
```

Inclui índices para:

- status;
- prazos/datas;
- atualização recente;
- técnico/responsável;
- intervenções por data/status/responsável;
- notificações por usuário/leitura/data;
- lembretes pendentes;
- auditoria por período/entidade/ação/usuário;
- busca textual com `pg_trgm` em campos relevantes;
- presença/atividade de usuários;
- logs recentes usados no dashboard/notificações.

## Arquivos principais alterados

- `lib/server-data/shared.ts`
- `lib/server-data/interventions.ts`
- `lib/server-data/users.ts`
- `lib/server-data/audit.ts`
- `lib/server-data/notifications.ts`
- `lib/server-data/dashboard.ts`
- `app/(protected)/intervencoes/page.tsx`
- `app/(protected)/users/page.tsx`
- `app/(protected)/audit/page.tsx`
- `app/(protected)/notifications/page.tsx`
- `app/api/notifications/summary/route.ts`
- `components/notifications/notifications-live-page.tsx`
- `components/shared/notification-bell.tsx`
- `components/shared/pagination-footer.tsx`
- `types/index.ts`
- `database/20_performance_indexes.sql`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`

## Instruções de upgrade

1. Faça backup do banco antes de aplicar a nova migration.
2. Aplique:

```sql
-- Neon/Supabase SQL Editor
-- Cole e execute o conteúdo de:
database/20_performance_indexes.sql
```

3. Instale dependências:

```bash
npm ci --ignore-scripts
```

4. Valide TypeScript:

```bash
npm run typecheck
```

5. Publique normalmente na Vercel.

## Checklist de teste funcional

- [ ] Login continua funcionando.
- [ ] Dashboard abre rápido e mantém prioridades operacionais.
- [ ] Ordens pesquisam por número, cliente, descrição, técnico, status e prioridade.
- [ ] Ordens paginam sem perder filtros.
- [ ] Drawer de O.S. abre preservando URL e filtros.
- [ ] Intervenções pesquisam e paginam corretamente.
- [ ] Filtros rápidos/avançados de Intervenções resetam página corretamente.
- [ ] Notificações alternam filtros e paginam sem carregar tudo.
- [ ] Usuários filtram por status, perfil, presença e busca.
- [ ] Auditoria filtra por período, usuário, entidade, ação e busca textual.
- [ ] Mobile não renderiza listas gigantes de uma vez.
- [ ] Desktop mantém paginação, contadores e seletor por página legíveis.
- [ ] Lembretes configuráveis, PWA, cron e notificações push continuam funcionando.

## Observações

- Esta versão adiciona migration de índices, mas não altera a estrutura funcional das tabelas.
- Os índices com `pg_trgm` dependem da extensão `pg_trgm`, já usada no schema inicial do projeto.
- Em bases grandes, a criação de índices pode levar alguns segundos/minutos. Aplique preferencialmente fora do horário de pico.
