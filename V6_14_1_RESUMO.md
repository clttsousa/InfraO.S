# V6.14.1 — Intervenções Mobile Compactas + Filtros em Bottom Sheet

Esta versão foi criada em cima da V6.14.0 e foca exclusivamente em melhorar a experiência da tela **Intervenções** no celular, sem alterar banco de dados e sem recomeçar o projeto.

## Objetivo

Reduzir drasticamente a altura ocupada por filtros e cards antes da lista de intervenções. No mobile, a primeira dobra da tela agora mostra rapidamente:

- título compacto da tela;
- busca rápida;
- botão **Filtrar**;
- chips rápidos roláveis;
- resumo compacto;
- início da lista de intervenções.

## Principais mudanças

### 1. Mobile mais compacto

A página `/intervencoes` ganhou uma composição mobile própria. O cabeçalho ficou menor, a descrição longa foi removida do mobile e a lista passou a aparecer mais cedo.

### 2. Bottom sheet de filtros avançados

Os filtros avançados saíram da tela principal no mobile e agora ficam dentro de uma bottom sheet acionada pelo botão **Filtrar**.

Campos disponíveis na sheet:

- Tipo;
- Localidade;
- Status;
- Origem;
- Responsável;
- De;
- Até;
- Aplicar filtros;
- Limpar filtros.

No desktop, os filtros continuam abertos como antes.

### 3. Chips rápidos horizontais

No mobile, os filtros rápidos agora ficam em uma faixa horizontal rolável:

- Todas;
- Hoje;
- Amanhã;
- Esta semana;
- Atrasadas;
- Concluídas;
- Canceladas.

Os chips exibem contadores quando disponíveis.

### 4. Resumo compacto

Os cards grandes de resumo foram substituídos no mobile por chips/cards pequenos horizontais:

- Hoje;
- Amanhã;
- Semana;
- Atrasadas;
- Concluídas.

Isso evita que os cards ocupem metade da tela antes da lista.

### 5. Cards mobile de intervenção

Os cards da lista foram compactados para mostrar somente o essencial:

- status;
- tipo;
- origem;
- título;
- localidade;
- data e horário;
- quantidade de pontos;
- lembretes pendentes, quando houver;
- responsável e última atualização.

O card inteiro continua abrindo o detalhe da intervenção. As ações secundárias permanecem no detalhe.

### 6. Botão Nova intervenção

O botão **Nova intervenção** continua como ação flutuante no mobile, acima da bottom navigation, sem ocupar espaço antes da lista.

### 7. Filtros aplicados

Quando há filtros ativos, a tela mostra chips pequenos com os filtros aplicados e permite remover filtros individualmente quando simples.

## Compatibilidade preservada

Mantido sem quebra:

- login;
- layout desktop;
- bottom navigation mobile;
- intervenções existentes;
- criação e edição de intervenção;
- detalhe/drawer de intervenção;
- parser de WhatsApp;
- lembretes configuráveis;
- notificações internas;
- PWA;
- cron;
- dashboard;
- usuários;
- auditoria.

## Banco de dados

Sem migration nova.

A única alteração de dados foi de leitura: a lista passa a buscar contagem resumida de lembretes pendentes para exibir no card mobile quando houver.

## Arquivos principais alterados

- `app/(protected)/intervencoes/page.tsx`
- `components/interventions/intervention-mobile-filters.tsx`
- `components/interventions/intervention-list.tsx`
- `components/interventions/intervention-workspace-client.tsx`
- `lib/server-data/interventions.ts`
- `types/index.ts`
- `app/globals.css`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`

## Validação executada

```bash
npm ci --ignore-scripts
npm run typecheck
```

Resultado: typecheck aprovado.

O `npm run build` compilou e passou a etapa de TypeScript, mas o ambiente local encerrou em `Collecting page data` por timeout/EPIPE. Recomenda-se validar o build final na Vercel ou no ambiente real do projeto.
