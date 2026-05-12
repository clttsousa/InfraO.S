# V6.12.3 — Hotfix iOS PWA Push + Diagnóstico de Dispositivo

## Objetivo

Corrigir o fluxo de ativação de notificações PWA no iOS/iPhone e tornar o diagnóstico claro para Windows, Android, iOS e desktop.

## O que foi implementado

- Detecção client-side de plataforma e contexto:
  - iOS/iPadOS;
  - Android;
  - Windows/Desktop;
  - modo PWA instalado/standalone;
  - navegador normal;
  - Service Worker;
  - Push API;
  - Notification API;
  - suporte a `showNotification`.
- Fluxo especial para iPhone/iPad fora do PWA:
  - não mostra ativação direta de push;
  - exibe orientação para adicionar o InfraOS à Tela de Início;
  - mantém botão **Entendi** com ocultação temporária via `localStorage`.
- Ativação normal no iOS apenas quando aberto pelo ícone instalado.
- Painel **Diagnóstico do dispositivo** na área de notificações PWA.
- Banner pós-login ajustado para instrução específica em iOS.
- `manifest.webmanifest` revisado com ícones PNG e SVG.
- Criados ícones PNG:
  - `public/icons/icon-192.png`;
  - `public/icons/icon-512.png`;
  - `public/icons/apple-touch-icon.png`.
- `app/layout.tsx` atualizado com metadados de PWA/iOS.
- `public/sw.js` atualizado para versão interna 6.12.3, sem cache offline agressivo.

## Como testar no iPhone

1. Remova qualquer ícone antigo do InfraOS da Tela de Início.
2. Abra o InfraOS no Safari em HTTPS.
3. Toque em Compartilhar.
4. Toque em Adicionar à Tela de Início.
5. Abra o InfraOS pelo ícone criado.
6. Faça login.
7. Acesse Configurações ou Notificações.
8. Confirme no diagnóstico:
   - Plataforma: iOS / iPadOS;
   - Abertura: PWA instalado;
   - Service Worker: ativo/registrado;
   - Push API: disponível.
9. Clique em Ativar notificações.
10. Clique em Testar local.
11. Clique em Enviar teste push.

## Observações

- Sem migration nova.
- O fluxo PWA continua dependendo de HTTPS, chaves VAPID e permissão do navegador/sistema.
- O service worker continua focado em push notification; não foi adicionado cache offline agressivo.
