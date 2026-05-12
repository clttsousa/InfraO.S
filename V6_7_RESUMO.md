# InfraOS V6.7 — Intervenções Programadas

## Objetivo

Adicionar uma agenda operacional para registrar intervenções programadas recebidas por WhatsApp ou outros canais, como troca de postes, manutenção elétrica, desligamentos programados, obras de terceiros e remanejamentos de rede.

## O que foi implementado

- Nova aba **Intervenções** no menu lateral.
- Nova página `/intervencoes`.
- Cards de resumo:
  - Hoje
  - Amanhã
  - Esta semana
  - Atrasadas
  - Concluídas
- Filtros rápidos:
  - Todas
  - Hoje
  - Amanhã
  - Esta semana
  - Atrasadas
  - Concluídas
  - Canceladas
- Filtros avançados:
  - Busca textual
  - Tipo
  - Localidade
  - Status
  - Origem
  - Responsável
  - Período
- Cadastro de intervenção com:
  - Título
  - Tipo
  - Localidade
  - Data
  - Horário inicial
  - Horário final
  - Status
  - Origem
  - Responsável
  - Observações
  - Mensagem original
- Parser local, sem IA/API externa, para mensagens recebidas por WhatsApp.
- Pontos/localizações múltiplas com label e link do Google Maps.
- Drawer de detalhes com edição e troca de status.
- Confirmação antes de concluir ou cancelar.
- Auditoria estruturada para criação, edição e mudança de status.
- APIs internas para lista e detalhe:
  - `/api/interventions`
  - `/api/interventions/[id]`

## Migration

Execute no banco, após as migrations anteriores:

```sql
\i database/15_interventions.sql
```

Ou copie o conteúdo de `database/15_interventions.sql` e execute no editor SQL do banco.

A migration cria:

- `infra_events`
- `infra_event_points`
- índices operacionais
- triggers de `updated_at`
- ampliação das constraints de `audit_events` para suportar `infra_event` e escopo `intervention`

## Observação sobre RLS

A base atual do InfraOS usa autenticação própria e acesso ao banco via backend/server actions. Por isso, a V6.7 mantém o mesmo padrão de segurança já usado no projeto: dados são acessados e alterados apenas por rotas protegidas/server actions com sessão válida.

Caso o projeto seja migrado para Supabase Auth/RLS no futuro, as tabelas `infra_events` e `infra_event_points` já estão separadas e prontas para receber políticas específicas.

## Validação

Com dependências instaladas:

```bash
npm run typecheck
```

Resultado: concluído com sucesso.

```bash
CI=1 NEXT_TELEMETRY_DISABLED=1 timeout 90s npm run build
```

Resultado: compilação concluída com sucesso e rota `/intervencoes` incluída no build.
