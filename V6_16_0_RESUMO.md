# V6.16.0 — Dashboard Operacional + Melhor Uso de Tela Larga

## Objetivo

Melhorar o Dashboard do InfraOS para que ele responda rapidamente **o que precisa de atenção agora**, tanto no celular quanto no desktop, e aproveitar melhor telas largas do Windows como 1366px, 1440px e 1920px.

## Principais entregas

### 1. Prioridade operacional no topo

O Dashboard agora abre com a seção **Prioridade operacional**, contendo cards clicáveis para:

- O.S. atrasadas;
- O.S. vencendo hoje;
- O.S. sem atualização;
- intervenções de hoje;
- intervenções de amanhã;
- notificações críticas;
- lembretes pendentes.

Cada card leva diretamente para a fila relacionada.

### 2. Dashboard mobile mais operacional

No mobile, a tela prioriza:

- alertas importantes;
- ações rápidas;
- filas compactas de O.S. atrasadas, vencendo hoje e sem atualização;
- intervenções próximas;
- leitura curta e com pouco conteúdo decorativo.

Os gráficos ficam ocultos no mobile para evitar rolagem antes das prioridades reais.

### 3. Dashboard desktop e telas largas

Foram reforçados:

- grids responsivos;
- containers fluidos;
- uso de `min-w-0`, `w-full` e `flex-1`;
- distribuição melhor de cards, gráficos, listas e coluna lateral;
- aproveitamento de telas 1366px, 1440px e 1920px;
- proteção contra grandes espaços vazios no centro da tela.

### 4. Cards clicáveis e atalhos rápidos

Os principais indicadores do Dashboard viraram atalhos de operação:

- O.S. atrasadas abre `/orders?lateOnly=1`;
- O.S. vencendo hoje abre `/orders?dueToday=1`;
- O.S. sem atualização abre `/orders?staleOnly=1`;
- Intervenções de hoje/amanhã abrem filtros rápidos em Intervenções;
- Notificações críticas abre a central de notificações;
- Lembretes pendentes abre Intervenções.

### 5. Topbar e containers

A topbar desktop recebeu ajustes para evitar overflow/desalinhamento em zoom comum do Windows.

Também foram reforçados containers fluidos nas telas:

- Dashboard;
- Ordens;
- Intervenções;
- Notificações;
- Configurações.

## Compatibilidade

Não houve migration nova.

Preservado:

- login;
- layout desktop;
- layout mobile;
- sidebar;
- bottom navigation;
- menu mobile;
- ordens;
- intervenções;
- lembretes configuráveis;
- notificações;
- PWA;
- usuários;
- auditoria;
- cron.

## Validação recomendada

Executar:

```bash
npm ci --ignore-scripts
npm run typecheck
npm run build
```

Também validar visualmente:

- 390px;
- 430px;
- 768px;
- 1024px;
- 1366px;
- 1440px;
- 1920px;
- zoom 80%, 90%, 100%, 110% e 125%.
