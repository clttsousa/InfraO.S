# V6.10 — Mobile First e Login Premium

Esta versão refina o InfraOS para uso operacional no celular e melhora a primeira impressão da tela de login.

## Principais melhorias

- Bottom navigation no mobile com atalhos principais.
- Topbar mobile mais compacta.
- Login redesenhado com visual mais premium e menos pesado.
- Cards de notificações em carrossel horizontal no mobile.
- Cards de O.S. mobile mais compactos e legíveis.
- Filtros de O.S. com chips roláveis no celular.
- Intervenções com botão flutuante de nova intervenção no mobile.
- Drawers/bottom sheets com melhor comportamento visual em telas pequenas.
- Ajuste de safe area para Android/iPhone/PWA.

## Lembretes de intervenção

A configuração atual continua igual à V6.8/V6.9:

- `one_day_before`: 1 dia antes, às 08:00, no fuso `America/Sao_Paulo`.
- `same_day`: no dia da intervenção, às 08:00, no fuso `America/Sao_Paulo`.

A estrutura do banco já aceita `two_hours_before` e `thirty_minutes_before`, mas estes dois tipos ainda não são gerados automaticamente nesta versão.

## Migration

Não há migration nova na V6.10.
