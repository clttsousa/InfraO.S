# InfraOS v3.1

Painel interno para controle operacional de ordens de serviço de infraestrutura.

## Stack
- Next.js
- React
- Tailwind CSS
- PostgreSQL
- `xlsx` para exportação em Excel

## O que foi fechado nesta entrega
- dependências fixadas em versões exatas
- login sem credenciais padrão expostas na interface
- logout mais robusto
- command palette sem listener duplicado
- revalidação correta de dashboard e relatórios por tag
- proteção de login persistente no banco com fallback local
- listagem de O.S. com cards em telas menores e tabela no desktop
- busca e filtro na gestão de usuários
- troca rápida de perfil com confirmação
- configurações administrativas funcionais no navegador da equipe

## Variáveis de ambiente
Crie um arquivo `.env.local` a partir do `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require&channel_binding=require"
AUTH_SECRET="troque-por-uma-chave-longa-e-segura"
DB_POOL_MAX="10"
DB_IDLE_TIMEOUT_MS="30000"
DB_CONNECTION_TIMEOUT_MS="10000"
```

## Como aplicar o banco
### Ambiente novo
1. Execute `database/01_initial_schema.sql`
2. Execute `database/03_upgrade_v1_8.sql`
3. Execute `database/04_upgrade_v2_2.sql`
4. `database/05_upgrade_v2_5.sql` é apenas informativo e não altera estrutura
5. Execute `database/06_upgrade_v2_6.sql`
6. Execute `database/08_upgrade_v2_8.sql`
7. Execute `database/09_upgrade_v2_9.sql`
8. Para desenvolvimento local, execute `database/02_seed.sql`
9. Para produção, prefira `database/10_seed_admin_production.sql` e ajuste nome, e-mail e senha antes de aplicar

### Ambiente já existente na v2.8.x
1. Execute `database/09_upgrade_v2_9.sql`

## Como rodar localmente
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Abra `http://localhost:3000`.

## Como subir em produção
### 1. Banco
- use uma connection string estável com SSL
- aplique as migrations na ordem descrita acima
- crie o administrador inicial com `database/10_seed_admin_production.sql`

### 2. Variáveis de ambiente
Configure no provedor do app:
- `DATABASE_URL`
- `AUTH_SECRET`
- `DB_POOL_MAX`
- `DB_IDLE_TIMEOUT_MS`
- `DB_CONNECTION_TIMEOUT_MS`

### 3. Build
```bash
npm install
npm run typecheck
npm run build
npm run start:prod
```

### 4. Validação pós-deploy
- testar login e logout
- testar criação manual de O.S.
- testar parser por texto colado
- testar alteração de status
- testar finalização, reabertura e cancelamento
- testar exportação de ordens e relatórios
- testar filtros da página de usuários

## Seeds
### Desenvolvimento
`database/02_seed.sql` mantém um admin local padrão apenas para ambiente de desenvolvimento.

### Produção
`database/10_seed_admin_production.sql` cria um admin inicial com dados que você deve editar antes de aplicar.

## Ajuste para uso real
Se você já aplicou seeds antigos ou dados de demonstração, execute `database/07_reset_seed_for_real_usage.sql` antes de cadastrar a operação real.

## Observação sobre proteção de login
A v3.1 cria uma tabela de rate limit persistente. Se a migration `database/09_upgrade_v2_9.sql` ainda não tiver sido aplicada, o login usa fallback local em memória para não bloquear o ambiente.

## Regras administrativas
- Apenas **ADMIN** pode acessar Usuários, Técnicos e Configurações.
- Operadores continuam com acesso à operação de O.S., dashboard e relatórios.
- O último administrador ativo não pode ser removido nem inativado.

## Checklist final
Consulte `CHECKLIST_PRODUCAO.md` antes do deploy final.
