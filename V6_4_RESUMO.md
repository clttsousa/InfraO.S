# InfraOS V6.4.0 — Paginação Server-side e Performance da Fila

Esta versão prepara a tela de Ordens de Serviço para uso com maior volume de dados.

## Principais entregas

- Paginação server-side em `/orders`.
- Controle de 25, 50 e 100 O.S. por página.
- Rodapé de paginação com contagem clara: `Mostrando X–Y de Z O.S.`.
- Links numerados com elipses para muitas páginas.
- Botões Anterior/Próxima com estado desabilitado.
- Preservação de filtros, busca, ordenação e tamanho da página na URL.
- Normalização automática da página quando os filtros reduzem o total de resultados.
- API `/api/orders` pronta para paginação e atualizações realtime.
- Contadores de alertas calculados no banco para a visão filtrada.
- Visual da paginação ajustado ao Dark Graphite.

## Arquivos principais alterados

- `app/(protected)/orders/page.tsx`
- `components/orders/order-filters.tsx`
- `lib/filter-params.ts`
- `lib/server-data/orders.ts`
- `types/index.ts`
- `app/globals.css`
- `CHANGELOG.md`

## Como testar

1. Suba o projeto localmente.
2. Acesse `/orders`.
3. Teste paginação com 25, 50 e 100 registros.
4. Aplique busca, status, prioridade, técnico e filtros rápidos.
5. Confirme que a página volta para 1 ao aplicar filtros.
6. Confirme que a URL mantém `page`, `pageSize`, `sortBy` e `sortDir`.
7. Abra uma O.S. pelo drawer e navegue entre páginas para verificar preservação de contexto.

## Observação

A exportação por API continua buscando a visão filtrada completa, não apenas a página visível. Já o botão local de exportação rápida mantém os itens renderizados na página atual.
