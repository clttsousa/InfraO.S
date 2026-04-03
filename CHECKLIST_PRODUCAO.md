# Checklist final de produção — InfraOS v2.6

## Banco de dados
- [ ] Projeto Neon criado na região correta.
- [ ] `DATABASE_URL` com pooling configurada no ambiente.
- [ ] Migrations aplicadas nesta ordem:
  1. `database/01_initial_schema.sql`
  2. `database/02_seed.sql`
  3. `database/03_upgrade_v1_8.sql`
  4. `database/04_upgrade_v2_2.sql`
  5. `database/05_upgrade_v2_5.sql` (informativa)
  6. `database/06_upgrade_v2_6.sql`
- [ ] Confirmado que existe ao menos 1 usuário ADMIN ativo.
- [ ] Confirmado que o login funciona com um usuário real.

## Variáveis de ambiente
- [ ] `DATABASE_URL` preenchida com a connection string do Neon.
- [ ] `AUTH_SECRET` com valor forte e único.
- [ ] Ajustados, se necessário, `DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS` e `DB_CONNECTION_TIMEOUT_MS`.

## Segurança e acesso
- [ ] Somente equipe interna possui acesso.
- [ ] Técnicos continuam sem conta no sistema.
- [ ] Usuários ADMIN revisados.
- [ ] E-mails de usuários armazenados em minúsculas.
- [ ] Exportações protegidas por sessão.

## Operação
- [ ] Cadastro manual de O.S. validado.
- [ ] Parser por texto colado validado com pelo menos 3 exemplos reais.
- [ ] Fluxo de editar, alterar status, adicionar observação, finalizar, reabrir e cancelar validado.
- [ ] Histórico de auditoria validado em pelo menos 1 O.S.
- [ ] Filtros de atrasadas, vencendo hoje e sem atualização revisados.
- [ ] Exportação de ordens e relatórios testada.

## Deploy
- [ ] `npm install` executado sem erros.
- [ ] `npm run typecheck` executado sem erros.
- [ ] `npm run build` executado sem erros.
- [ ] Deploy realizado no ambiente escolhido.
- [ ] Teste pós-deploy concluído com login, criação, edição, finalização e exportação.
