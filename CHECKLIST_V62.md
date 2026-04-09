# Checklist V6.2 — UX, Acessibilidade e Fluxo Operacional

## 1. Painel lateral / detalhe da O.S.
- [ ] Em desktop, abrir uma O.S. não deve causar salto brusco de scroll.
- [ ] Em mobile, o detalhe deve abrir como overlay/drawer.
- [ ] Fechar o detalhe no mobile deve voltar para a lista sem recarregar visualmente a página inteira.
- [ ] Botões de ação rápida do detalhe devem continuar funcionando.

## 2. Acessibilidade de formulários
- [ ] Inputs com descrição devem expor `aria-describedby`.
- [ ] Inputs com erro devem expor `aria-invalid` e mensagem associada.
- [ ] Labels continuam vinculados aos campos corretamente.

## 3. Parser da nova O.S.
- [ ] Colar um texto de O.S. deve mostrar campos reconhecidos e pendentes.
- [ ] Campos preenchidos pelo parser devem aparecer com destaque visual leve.
- [ ] Salvamento continua funcionando com ou sem parser.

## 4. Paginação
- [ ] Botões “Primeira” e “Última” funcionam.
- [ ] Campo “Ir para página” respeita o total de páginas.
- [ ] Filtros atuais são mantidos ao navegar pela paginação.

## 5. Busca direta por O.S.
- [ ] Campo da topbar deve aceitar somente dígitos.
- [ ] Buscar um número deve abrir `/orders?q=...`.
- [ ] Command palette deve sugerir “Abrir O.S. ####” ao digitar um número válido.

## 6. Notificações
- [ ] Popover do sino deve exibir CTA textual por item.
- [ ] Página `/notifications` deve mostrar atalhos rápidos para filas críticas.
- [ ] Atividades recentes, quando tiverem `service_order_id`, devem abrir a ordem relacionada.
