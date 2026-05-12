# InfraOS V6.9 — Notificação tipo app / PWA

## Objetivo

Permitir que o InfraOS envie lembretes de intervenções programadas como notificações tipo app no Windows/celular, sem depender da aba do navegador aberta.

## Implementado

- Configuração PWA com `public/manifest.webmanifest`.
- Ícones básicos em `public/icons/`.
- Service Worker em `public/sw.js` focado em push notification.
- Registro automático do service worker nas áreas protegidas.
- Área **Notificações neste dispositivo** em `/notifications` e em Configurações.
- Estados de permissão: não solicitado, permitido/ativo, permitido/inativo, bloqueado e indisponível.
- Botões para ativar, desativar e enviar teste.
- APIs autenticadas:
  - `GET /api/push/status`
  - `POST /api/push/subscribe`
  - `POST /api/push/unsubscribe`
  - `POST /api/push/test`
- Tabela `push_subscriptions` para dispositivos autorizados.
- Tabela `notification_delivery_logs` para auditoria de entrega por canal.
- Integração com `/api/cron/reminders` para enviar PWA após a criação das notificações internas.
- Logs para canais `internal` e `pwa`, com canais futuros preparados: `telegram_future`, `email_future`, `whatsapp_future`.
- Script `npm run generate:vapid`.

## Migration

Execute após a V6.8:

```sql
\i database/17_pwa_push_notifications.sql
```

Ou copie o conteúdo de `database/17_pwa_push_notifications.sql` no editor SQL do seu banco.

## Variáveis de ambiente

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:infraos@seudominio.com.br"
```

Gere as chaves com:

```bash
npm run generate:vapid
```

## Observações importantes

- Push notification exige HTTPS em produção.
- Em `localhost`, navegadores modernos geralmente permitem testar.
- Se o usuário bloquear notificações, é necessário liberar manualmente no navegador.
- Esta versão não usa cache offline agressivo para evitar dados antigos na operação.
- Telegram, e-mail e WhatsApp oficial continuam preparados para uma versão futura, mas não foram implementados nesta versão.
