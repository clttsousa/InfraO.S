# InfraOS V6.14.0 — Mobile Premium Final

Esta versão faz um pente fino final na experiência mobile do InfraOS, mantendo o desktop preservado e sem adicionar migrations.

## Principais melhorias

- Bottom navigation mobile refinada com altura, safe area, estados ativos e área de toque mais confortável.
- Menu mobile reorganizado em grupos: Operação, Gestão e Sistema.
- Opção **Sair do InfraOS** permanece clara no menu mobile.
- Topbar mobile mais compacta, sem ações excessivas e sem duplicidade com a navegação inferior.
- Dashboard mobile ganhou bloco **Prioridade operacional**, com atalhos para O.S. atrasadas, intervenções de hoje e pendências.
- Cards superiores do dashboard viraram carrossel horizontal no mobile para evitar grid apertado.
- Cards de O.S. e intervenções ficaram mais compactos e com melhor leitura no celular.
- Filtros de ordens ficaram mais adequados para mobile, com área sticky e chips roláveis.
- Drawer/sheet de detalhe no mobile recebeu ajuste de altura, raio, padding e comportamento visual mais próximo de app.
- Mensagem original da intervenção ficou recolhível/expansível para não dominar a tela do celular.
- Lembretes configuráveis receberam ajustes visuais mobile para toque e leitura.
- Central de notificações passou a agrupar itens por Intervenções, Ordens/alertas e Movimentações.
- Popover de notificações foi ajustado para comportamento de sheet no mobile.
- Inputs, botões, cards e form actions receberam ajustes de tamanho/área de toque no mobile.
- Login mobile recebeu refinamento final para ficar mais direto, sem excesso de conteúdo.

## Arquivos principais alterados

- `app/globals.css`
- `components/shared/mobile-bottom-nav.tsx`
- `components/shared/topbar.tsx`
- `components/dashboard/dashboard-live-page.tsx`
- `components/interventions/intervention-detail-panel.tsx`
- `components/notifications/notifications-live-page.tsx`
- `package.json`
- `package-lock.json`
- `README.md`
- `CHANGELOG.md`

## Validação executada

```bash
npm ci --ignore-scripts
npm run typecheck
```

Resultado: typecheck aprovado.

Também foi executado:

```bash
CI=1 NEXT_TELEMETRY_DISABLED=1 timeout 240s npm run build
```

A compilação passou, mas o ambiente encerrou por timeout durante a etapa de TypeScript/build, comportamento já observado em versões anteriores neste ambiente local. Recomenda-se validar o build completo na Vercel/ambiente real.

## Testes recomendados

### Mobile

- 390px e 430px no DevTools.
- iPhone/PWA instalado.
- Android/Chrome.

Fluxos:

1. Login.
2. Dashboard.
3. Abrir Ordem.
4. Abrir Intervenção.
5. Criar/editar intervenção com lembretes.
6. Abrir central de notificações.
7. Abrir menu mobile e testar logout.
8. Configurações e diagnóstico PWA/iOS.

### Desktop

- 1366px, 1440px e 1920px.
- Confirmar que a sidebar desktop continua correta.
- Confirmar que a bottom navigation não aparece no desktop.
- Confirmar que não há overflow horizontal.

## Migration

Não há migration nova nesta versão.
