# InfraOS V6.8 — Lembretes Internos e Notificações no Painel

## Objetivo

Adicionar lembretes automáticos para as **Intervenções Programadas** criadas na V6.7 e exibir esses avisos dentro do InfraOS, com persistência no banco, integração com o sino de notificações, dashboard e rota cron protegida.

## O que foi implementado

- Geração automática de lembretes ao criar, editar ou alterar status de uma intervenção.
- Lembretes padrão:
  - `one_day_before`: 1 dia antes às 08:00.
  - `same_day`: no dia da intervenção às 08:00.
- Estrutura preparada para lembretes futuros:
  - `two_hours_before`.
  - `thirty_minutes_before`.
- Nova tabela `reminders` para controlar lembretes pendentes, processados, falhos e cancelados.
- Nova tabela `app_notifications` para notificações internas persistidas por usuário.
- Nova rota protegida:
  - `/api/cron/reminders`
- Proteção da rota via `CRON_SECRET`.
- Suporte a autenticação do cron por:
  - `Authorization: Bearer <CRON_SECRET>`
  - `x-cron-secret`
  - `?secret=` para teste manual controlado.
- Integração das notificações de intervenção no sino do topo.
- Página `/notifications` com card de **Intervenções**.
- Botão **Marcar todas como lidas**.
- Dashboard com bloco **Intervenções próximas**, exibindo:
  - hoje;
  - amanhã;
  - atrasadas;
  - cards clicáveis para abrir o detalhe da intervenção.
- Atualização via realtime/SSE quando uma nova notificação é criada.
- Toast no navegador quando chegar novo lembrete em tempo real.
- `.env.example` criado/atualizado com `CRON_SECRET`.
- `vercel.json` criado com agendamento diário:
  - `0 11 * * *`
  - equivalente a 08:00 BRT.

## Migration

Execute no banco, após a V6.7:

```sql
\i database/16_reminders_notifications.sql
```

Ou copie o conteúdo de `database/16_reminders_notifications.sql` e execute no editor SQL do banco.

A migration cria:

- `reminders`
- `app_notifications`
- índices para lembretes pendentes
- índices para notificações não lidas
- trigger de `updated_at` para `reminders`

## Fluxo técnico

1. O operador cria ou edita uma intervenção.
2. O InfraOS sincroniza lembretes automáticos no banco.
3. A rota `/api/cron/reminders` processa lembretes pendentes cujo `remind_at` já chegou.
4. O sistema cria notificações internas para:
   - responsável da intervenção, quando definido;
   - todos os usuários ativos, quando não houver responsável.
5. O sino e a tela `/notifications` exibem o alerta.
6. O dashboard mostra intervenções próximas e atrasadas.
7. O usuário pode marcar as notificações como lidas.

## Variáveis de ambiente

Adicione no Vercel e no `.env.local`:

```env
CRON_SECRET="troque-por-um-segredo-longo-do-cron"
```

## Teste manual do cron

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/reminders
```

Resposta esperada:

```json
{
  "ok": true,
  "processed": 0,
  "notificationsCreated": 0,
  "failed": 0,
  "checkedAt": "2026-05-12T00:00:00.000Z"
}
```

Os números variam conforme existirem lembretes pendentes.

## Observação sobre Vercel Cron

O `vercel.json` agenda a rotina em UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 11 * * *"
    }
  ]
}
```

`11:00 UTC` equivale a `08:00` no horário de Brasília.

## Validação

Com dependências instaladas:

```bash
npm run typecheck
```

Resultado: concluído com sucesso.

```bash
CI=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

Resultado: compilação e checagem TypeScript concluídas com sucesso no ambiente de validação.
