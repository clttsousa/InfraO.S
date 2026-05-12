# InfraOS V6.12.2 — Hotfix Layout Fluido Desktop + Responsividade por Zoom

## Objetivo
Corrigir o layout desktop/Windows quando o navegador está em zoom alterado ou em telas largas, removendo faixas laterais vazias e fazendo o conteúdo ocupar corretamente o espaço disponível ao lado da sidebar.

## Principais alterações

- Removido o limite global `max-w-[1800px]` e `mx-auto` do AppShell protegido.
- O layout principal agora usa containers fluidos: `.app-shell`, `.app-shell-layout`, `.app-shell-main`, `.app-main-content` e `.app-content-fluid`.
- O conteúdo principal usa `flex-1`, `w-full` e `min-w-0`, evitando sobras laterais e overflow.
- Sidebar desktop continua fixa em 96px e o main calcula melhor o espaço restante.
- Dashboard recebeu `.dashboard-grid-fluid` para melhorar distribuição de cards, gráficos e colunas.
- Cards superiores do Dashboard continuam em 5 colunas no desktop e usam melhor a largura disponível.
- Gráficos e superfícies receberam proteções com `min-width: 0` e `max-width: 100%`.
- Topbar ajustada para ocupar a largura correta do conteúdo sem ultrapassar a tela.
- Padding inferior da bottom navigation permanece apenas no mobile.
- Mobile preservado: bottom navigation continua correta, sem sidebar lateral e sem overflow horizontal.

## Arquivos principais alterados

- `components/shared/app-shell.tsx`
- `components/dashboard/dashboard-live-page.tsx`
- `components/dashboard/dashboard-charts.tsx`
- `components/pwa/pwa-activation-prompt.tsx`
- `app/globals.css`
- `README.md`
- `CHANGELOG.md`

## Como validar

1. Abrir o Dashboard no desktop.
2. Testar em 1366px, 1440px e 1920px.
3. Alterar zoom do navegador para 80%, 90%, 100%, 110% e 125%.
4. Confirmar que não há faixas laterais vazias exageradas.
5. Confirmar que a sidebar fica fixa à esquerda e o conteúdo ocupa o restante.
6. Confirmar que a bottom navigation não aparece no desktop.
7. Testar mobile em 390px e 430px para garantir que bottom navigation e safe area continuam corretas.

## Banco de dados

Sem migration nova.
