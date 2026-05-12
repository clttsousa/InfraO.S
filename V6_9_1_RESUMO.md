# InfraOS V6.9.1 — Hotfix Push PWA

Esta versão corrige e melhora o diagnóstico das notificações tipo app/PWA criadas na V6.9.

## Problema tratado

Na V6.9, o botão de teste criava corretamente a notificação interna no InfraOS e registrava `channel = pwa` como `sent`, mas em alguns cenários a notificação não aparecia no Windows/celular.

A causa provável era a implementação local de criptografia Web Push usando fluxo incompatível com `aes128gcm`. O push service podia aceitar a requisição, mas o navegador não conseguia descriptografar o payload para acionar o `push` no Service Worker.

## Correções aplicadas

- Corrigido `lib/web-push.ts` para usar o fluxo de criptografia RFC 8291 / `aes128gcm`.
- Mantida implementação local, sem adicionar dependência externa obrigatória.
- Melhorado retorno de envio com detalhes de `sent`, `failed`, `skipped`, mensagens e status HTTP.
- Ajustado `lib/push-notifications.ts` para retornar detalhes reais de entrega ao botão de teste.
- A ativação PWA agora verifica se a subscription atual do navegador usa a mesma chave VAPID pública configurada.
- Se a chave VAPID mudou, a subscription antiga é desativada e uma nova inscrição é criada.
- `public/sw.js` foi reforçado para push, clique em notificação e atualização sem cache agressivo.
- `PwaBootstrap` agora chama `registration.update()` após registrar o service worker.

## UI/UX

A área **Notificações neste dispositivo** agora mostra:

- status da permissão do navegador;
- total de dispositivos e dispositivos ativos;
- último envio PWA registrado;
- mensagem do último teste;
- botão **Testar local**;
- botão **Enviar teste push**.

## Como testar

1. Ative as notificações no dispositivo.
2. Clique em **Testar local**.
   - Se não aparecer fora da aba, o problema está no navegador/Windows/celular/permissões.
3. Clique em **Enviar teste push**.
   - Esse teste valida backend → push service → dispositivo.
4. Confira o banco:

```sql
select
  channel,
  status,
  error_message,
  sent_at,
  created_at
from notification_delivery_logs
where channel = 'pwa'
order by created_at desc
limit 20;
```

## Migration

Não há migration nova nesta versão.

Mantenha aplicada:

```sql
database/17_pwa_push_notifications.sql
```
