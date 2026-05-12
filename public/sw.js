/* InfraOS V6.12.3 — Service Worker focado em Push Notification.
   Não aplica cache agressivo para evitar telas desatualizadas. */

const INFRAOS_SW_VERSION = "6.12.3";

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function safeParsePushData(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    try {
      return { title: 'InfraOS', body: event.data.text() };
    } catch {
      return {};
    }
  }
}

self.addEventListener('push', (event) => {
  const payload = safeParsePushData(event);
  const title = payload.title || 'InfraOS';
  const options = {
    body: payload.body || payload.message || 'Novo alerta operacional disponível.',
    icon: payload.icon || '/icons/icon-192.svg',
    badge: payload.badge || '/icons/badge.svg',
    tag: payload.tag || payload.notificationId || `infraos-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    timestamp: Date.now(),
    data: {
      url: payload.url || '/notifications',
      notificationId: payload.notificationId || null,
      eventId: payload.eventId || null,
      version: INFRAOS_SW_VERSION
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(targetUrl);
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // A renovação completa depende de usuário autenticado; por isso o painel de
  // configurações força uma nova inscrição quando a chave VAPID muda ou o endpoint expira.
  event.waitUntil(Promise.resolve());
});
