# InfraOS v3.7 aplicado

## Escopo implementado
- endurecimento técnico com `proxy.ts`
- endpoint de saúde em `/api/health`
- reorganização da camada de dados em módulos de servidor
- filtros ativos mais claros na fila de O.S.
- visões salvas por usuário em `saved_order_views`
- cards do dashboard com drill-down direto para a fila correspondente
- atualização da documentação de deploy e checklist

## Antes de subir
1. aplicar `database/09_upgrade_v2_9.sql`
2. aplicar `database/11_saved_order_views.sql`
3. configurar `.env.local`
4. rodar `npm install`
5. rodar `npm run typecheck`
6. rodar `npm run build`
7. validar `/api/health`

## Validação rápida
- login/logout
- alteração de status da O.S.
- finalização/reabertura/cancelamento
- exportação de ordens
- salvar e remover visão de filtros
- acesso admin e operador
