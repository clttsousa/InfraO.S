# Checklist v2.8 — robustez, operação e refinamento

## Segurança e robustez
- [x] validação central de ambiente (`DATABASE_URL`, `AUTH_SECRET`)
- [x] mensagem amigável quando a conexão está mal configurada
- [x] login com rate limit básico por IP/e-mail
- [x] sessão revogável via `session_version`
- [x] reset de senha invalida sessões antigas
- [x] UUIDs validados antes de consultar/alterar registros
- [x] ações críticas da O.S. com fluxo auditável preservado
- [x] exportações com tratamento de erro genérico no servidor

## Performance e banco
- [x] cache curto no dashboard (60s)
- [x] cache curto nos relatórios (5 min)
- [x] paginação na listagem de ordens
- [x] ordenação configurável na listagem de ordens
- [x] índice adicional para busca por cliente
- [x] migration nova para sessão revogável e busca textual

## Funcionalidades e UX
- [x] alteração da própria senha em `/profile`
- [x] exportação continua respeitando filtros ativos
- [x] prazo validado para não permitir criação/edição no passado
- [x] busca do topo agora leva para a busca avançada de ordens

## Visual
- [x] troca da fonte base para stack moderna de UI
- [x] números do dashboard em mono/tabular
- [x] cards de estatística com diferenciação semântica
- [x] linhas de O.S. atrasadas/vencendo hoje com destaque visual
- [x] item ativo da sidebar mais leve no light mode
- [x] timeline visual para atividades, histórico e observações
- [x] empty states com borda delimitadora
- [x] scrollbar custom limitada a áreas internas
- [x] indicador visual de carga no resumo por técnico
- [x] raio dos controles padronizado por token
