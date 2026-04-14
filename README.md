# InfraOS v3.7

Painel interno para operação de ordens de serviço, com autenticação própria, trilha de auditoria, relatórios e fila operacional pensada para uso diário.

## O que entrou nesta versão
- endurecimento técnico de produção com `proxy.ts`
- endpoint de saúde em `/api/health`
- refatoração da camada de dados em módulos menores
- filtros ativos mais claros na tela de ordens
- visões salvas por usuário para combinações recorrentes de filtros
- dashboard com drill-down direto para a fila correspondente

## Requisitos
- Node.js 20+
- PostgreSQL compatível com o schema da pasta `database/`

## Variáveis de ambiente
Copie `.env.example` para `.env.local`.

Campos esperados:
- `DATABASE_URL`
- `AUTH_SECRET`
- `DB_POOL_MAX`
- `DB_IDLE_TIMEOUT_MS`
- `DB_CONNECTION_TIMEOUT_MS`

## Banco de dados
Para ambiente novo:
1. aplique `database/01_initial_schema.sql`
2. aplique `database/09_upgrade_v2_9.sql`
3. aplique `database/11_saved_order_views.sql`
4. aplique `database/12_support_technicians.sql`
4. aplique o seed adequado ao seu cenário

## Como rodar
```bash
npm install
npm run typecheck
npm run build
npm run start
```

Para desenvolvimento:
```bash
npm install
npm run dev
```

## Checklist rápido antes do deploy
- revisar `.env.local`
- validar acesso admin
- validar login/logout
- validar lifecycle da O.S.
- validar exportações
- testar `/api/health`
- confirmar que `.env` e backups não vão para o Git

## Estrutura principal
- `app/` rotas do Next.js
- `components/` interface e blocos reutilizáveis
- `lib/server-data/` consultas e agregações do servidor
- `database/` schema, upgrades e seeds
- `docs/` documentação operacional

## Fluxos já suportados
- autenticação interna
- rate limit de login
- gestão de usuários internos
- gestão de técnicos
- criação, edição e acompanhamento de O.S.
- finalização, cancelamento e reabertura com auditoria
- exportação de dados
- filtros salvos por usuário


## Melhorias recomendadas
- plano objetivo por prioridade: `docs/PLANO_MELHORIAS_PRIORIZADO.md`
- foco em qualidade (CI), segurança, performance e operação
- inclui trilha dedicada para UX/visual, acessibilidade e consistência entre telas

## Observações de produção
- use contas nominais
- troque senhas provisórias
- faça backup antes de upgrades
- rode `npm run build` antes de publicar
