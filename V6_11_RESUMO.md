# InfraOS V6.11 — Notificações Globais por Usuário e Dispositivo

A V6.11 ajusta o comportamento das notificações de intervenções para o uso real da equipe: todos os usuários ativos recebem a notificação interna, e cada usuário recebe push PWA em todos os dispositivos onde tiver ativado a permissão.

## Principais mudanças

- A rotina `/api/cron/reminders` agora cria notificações internas de intervenção para **todos os usuários ativos**, não apenas para o responsável pela intervenção.
- O envio PWA continua por usuário e por dispositivo: se o usuário ativou no Windows e no celular, recebe nos dois.
- Subscriptions PWA continuam vinculadas ao usuário logado e podem ser desativadas sem afetar outros usuários.
- Adicionado banner discreto após login/acesso ao painel pedindo para ativar notificações neste dispositivo quando ele ainda não está ativo.
- O banner não abre o prompt do navegador automaticamente; a permissão só é solicitada após clique em **Ativar**.
- O botão **Agora não** oculta o aviso por 7 dias neste navegador via `localStorage`.
- A área **Notificações neste dispositivo** agora diferencia melhor:
  - permissão do navegador;
  - dispositivo atual ativo/inativo;
  - quantidade total de dispositivos ativos do usuário;
  - último envio PWA;
  - lista de dispositivos do usuário.
- A lista de dispositivos permite desativar um dispositivo específico do próprio usuário.
- Logs de entrega PWA agora podem registrar `subscription_id`, permitindo diagnosticar envio por dispositivo.

## Migration

Execute após a V6.9/V6.10:

```sql
database/18_global_push_devices.sql
```

Essa migration adiciona `subscription_id` em `notification_delivery_logs` e cria índice para diagnóstico.

## Teste recomendado

1. Aplicar `database/18_global_push_devices.sql`.
2. Fazer deploy da V6.11.
3. Usuário A entra no Windows e ativa notificações.
4. Usuário A entra no celular e ativa notificações.
5. Usuário B ativa notificações em outro dispositivo.
6. Forçar um lembrete pendente e rodar `/api/cron/reminders`.
7. Conferir que todos os usuários ativos receberam notificação interna.
8. Conferir que cada dispositivo ativo recebeu uma tentativa PWA em `notification_delivery_logs`.

## SQL de diagnóstico

```sql
select
  dl.channel,
  dl.status,
  dl.user_id,
  dl.subscription_id,
  ps.user_agent,
  dl.error_message,
  dl.sent_at,
  dl.created_at
from notification_delivery_logs dl
left join push_subscriptions ps on ps.id = dl.subscription_id
order by dl.created_at desc
limit 30;
```
