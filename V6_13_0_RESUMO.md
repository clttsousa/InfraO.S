# InfraOS V6.13.0 — Lembretes Configuráveis

## Objetivo

Permitir configurar quando cada intervenção deve gerar lembretes, substituindo o comportamento fixo de apenas “1 dia antes às 08:00” e “no dia às 08:00”.

## Implementado

- Seção **Lembretes** no cadastro/edição de intervenção.
- Opções por intervenção:
  - 1 dia antes;
  - No dia;
  - 6 horas antes;
  - 2 horas antes;
  - 30 minutos antes;
  - Personalizado.
- Horário diário por intervenção para lembretes “1 dia antes” e “No dia”.
- Configuração global em **Configurações > Lembretes de intervenções**.
- Tabela `intervention_reminder_settings`.
- Coluna `infra_events.reminder_config`.
- Campo `canceled_at` e `metadata` em `reminders`.
- Cron atualizado para processar todos os tipos de lembrete.
- Detalhe da intervenção com listagem e status dos lembretes.

## Migration

Execute:

```sql
database/19_configurable_reminders.sql
```

## Como testar

1. Criar intervenção com 1 dia antes, no dia e 2 horas antes.
2. Abrir detalhe da intervenção e conferir a seção Lembretes.
3. Editar data/horário e confirmar recálculo dos lembretes pendentes.
4. Cancelar/concluir a intervenção e confirmar cancelamento dos lembretes pendentes.
5. Forçar um lembrete para o passado no banco e rodar `/api/cron/reminders`.
6. Confirmar notificações internas e PWA.

## Validação

- `npm ci --ignore-scripts`
- `npm run typecheck`

Typecheck aprovado no ambiente de geração.
