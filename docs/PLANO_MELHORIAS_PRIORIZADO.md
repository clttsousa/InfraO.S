# Plano de melhorias priorizado (InfraOS)

Este plano organiza melhorias em **impacto x esforço** para evoluir o produto com previsibilidade.

## 1) Quick wins (1-2 semanas)

1. **Padronizar scripts de qualidade**
   - adicionar `lint` e `test` no `package.json`
   - criar pipeline mínima de CI com `typecheck` e `build`
   - ganho: reduz regressão em merge e release

2. **Fortalecer observabilidade operacional**
   - incluir `request-id` em logs de rotas críticas (`/api/orders`, `/api/auth/login`, `/api/exports/*`)
   - padronizar formato de log para facilitar troubleshooting
   - ganho: diagnóstico mais rápido de incidentes

3. **Consolidar documentação de setup de banco**
   - criar checklist único de migrações e seeds por cenário (novo ambiente, atualização, restore)
   - ganho: menos erro manual em implantação

## 2) Médio prazo (30 dias)

1. **Cobertura de testes por camadas**
   - testes unitários para utilitários em `lib/`
   - testes de integração para `app/api/*`
   - smoke tests de fluxos críticos: login, criação e mudança de status de O.S.

2. **Hardening de segurança**
   - revisar limites de rate limiting para autenticação e endpoints de exportação
   - validar estratégia de rotação de `AUTH_SECRET`
   - reforçar controles de autorização por ação sensível

3. **Performance de consultas**
   - medir latência de listagens em `lib/server-data/orders.ts` e dashboard
   - revisar índices em tabelas com filtros frequentes
   - ganho: melhor resposta em horários de pico

## 3) Evolução estrutural (60-90 dias)

1. **Maturidade de release**
   - versionar changelog por padrão semântico
   - checklist de release com rollback testado
   - promoção de ambiente por gates (build + typecheck + smoke)

2. **Confiabilidade de dados**
   - política de backup com testes de restauração periódicos
   - auditoria de retenção de eventos e custo de armazenamento

3. **Experiência de operação**
   - telemetria de uso para telas críticas (dashboard, ordens, notificações)
   - melhorias orientadas por evidência de uso real

---

## Priorização sugerida

- **P0 (imediato):** CI mínima, logs com request-id, checklist de banco
- **P1 (próximo ciclo):** testes de API e fluxos críticos, revisão de autorização
- **P2 (contínuo):** otimização de consultas e maturidade de release

## Indicadores para acompanhar

- lead time de deploy
- taxa de falha em deploy
- tempo médio para detectar/recuperar incidente (MTTD/MTTR)
- latência p95 de endpoints críticos
- cobertura de testes por domínio
