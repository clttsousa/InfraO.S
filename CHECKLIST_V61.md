# Checklist V6.1 — Performance e Consistência

## Ordem / detalhe
- [ ] abrir `/orders` e validar que a listagem carrega normalmente
- [ ] selecionar uma O.S. e confirmar que o painel lateral continua exibindo histórico, notas e logs
- [ ] abrir edição de uma O.S. e validar carregamento dos selects de técnico e responsável interno

## Exportação alinhada aos filtros
- [ ] alterar filtros em `/orders` e usar **Exportar Excel** no bloco de filtros
- [ ] confirmar que o arquivo respeita exatamente os campos preenchidos no formulário
- [ ] repetir o fluxo em `/reports`

## Cards / dashboard
- [ ] validar cards com contagens baixas e conferir que a leitura simplificada aparece sem distorção visual
- [ ] validar cards com volume normal e conferir sparkline preservada

## Dev / previsibilidade
- [ ] alterar variáveis de ambiente em dev e confirmar que a leitura do ambiente não fica presa em cache antigo
- [ ] validar que o pool não recria em loop, mas também se atualiza em dev quando a configuração muda

## Build
- [ ] `npm run typecheck`
- [ ] `npm run build` com `DATABASE_URL` e `AUTH_SECRET` válidos
