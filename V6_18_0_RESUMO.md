# V6.18.0 — Motor de Notificações Inteligentes

## Objetivo

Transformar as notificações do InfraOS em uma **Central Operacional de Alertas Inteligentes**, com regras configuráveis, severidade, destinatários, preferências por usuário, cooldown, agrupamento simples, ações rápidas e logs de execução.

## Principais entregas

### 1. Regras configuráveis

Nova área administrativa:

```text
Configurações > Notificações inteligentes
```

A tela permite:

- criar regra;
- editar regra;
- ativar/desativar regra;
- configurar tipo de evento;
- configurar entidade;
- informar condições em JSON;
- definir severidade;
- escolher destinatários;
- escolher canais;
- configurar template/mensagem;
- configurar ação/URL;
- configurar cooldown.

Tipos iniciais contemplados:

- O.S. criada sem responsável;
- O.S. atribuída ao usuário;
- O.S. vencendo em X horas;
- O.S. atrasada;
- O.S. sem atualização há X horas;
- status da O.S. alterado;
- O.S. reaberta;
- O.S. cancelada;
- intervenção hoje;
- intervenção amanhã;
- intervenção não concluída;
- intervenção cancelada;
- lembrete de intervenção pendente;
- falha de cron;
- erro ao gerar notificação;
- tentativa de login falha;
- usuário criado;
- perfil/permissão alterado.

> Nem todos os eventos são disparados automaticamente por hooks específicos ainda. A base do motor, UI, migration, logs e execução por cron/manual já ficam preparados para evolução incremental.

### 2. Severidade

Foram adicionados os níveis:

- informativa;
- atenção;
- importante;
- crítica.

A severidade aparece em:

- central de notificações;
- cards;
- badges;
- filtros;
- contadores;
- agrupamentos;
- dashboard operacional.

### 3. Destinatários inteligentes

As regras suportam estratégias como:

- responsável;
- técnico;
- criador;
- administradores;
- operadores;
- todos da operação;
- base para usuário específico via `user:<uuid>`.

### 4. Preferências por usuário

Na tela de notificações inteligentes há um bloco de preferências do usuário atual com:

- receber notificações internas;
- receber Push PWA quando disponível;
- silenciar notificações informativas;
- manter críticas sempre ativas;
- pausar notificações até um horário;
- horário silencioso simples.

### 5. Cooldown

O motor evita repetição usando uma chave por:

- regra;
- entidade;
- janela de cooldown.

Exemplo: uma regra de O.S. atrasada com cooldown de 60 minutos não fica criando várias notificações iguais a cada execução dentro da mesma janela.

### 6. Agrupamento simples

A central de notificações passou a exibir agrupamentos gerados a partir de `group_key`, como:

- ordens atrasadas;
- ordens vencendo;
- ordens sem atualização;
- intervenções de hoje/amanhã;
- lembretes pendentes;
- alertas de sistema.

### 7. Notificações acionáveis

Notificações inteligentes têm ações rápidas:

- abrir destino;
- adiar 1h;
- silenciar regra.

A central também mantém:

- marcar todas como lidas;
- filtros por categoria;
- filtros por severidade;
- filtros por entidade;
- paginação preservada da V6.17.0.

### 8. Logs de execução

Nova tabela `notification_rule_logs` registra:

- regra executada;
- entidade analisada;
- se houve match;
- notificação criada;
- ignorado por cooldown;
- ignorado por preferência;
- erro, se houver;
- data/hora.

A tela administrativa mostra os logs recentes.

### 9. Integração com cron

A rota:

```text
/api/cron/reminders
```

agora continua processando lembretes de intervenções e também executa o motor de notificações inteligentes.

### 10. Dashboard

O Dashboard operacional passa a considerar falhas do motor nas últimas 24h, exibindo item de prioridade para regras com erro.

## Migration nova

Criada:

```text
database/21_notification_rules.sql
```

Ela adiciona/ajusta:

- `notification_rules`;
- `notification_rule_logs`;
- `notification_preferences`;
- `notification_deliveries`;
- novas colunas em `app_notifications`:
  - `severity`;
  - `entity_type`;
  - `entity_id`;
  - `action_url`;
  - `action_label`;
  - `group_key`;
  - `rule_id`;
  - `muted_until`;
  - `snoozed_until`;
  - `metadata`.

Também adiciona índices úteis para:

- regra ativa/evento;
- severidade;
- logs por regra;
- logs por entidade;
- preferências por usuário;
- entregas por usuário/notificação/regra;
- notificações por severidade, entidade, regra, agrupamento e ação.

## Instruções de teste

1. Aplicar `database/21_notification_rules.sql` no Supabase após a migration 20.
2. Rodar localmente:

```bash
npm ci --ignore-scripts
npm run typecheck
npm run dev
```

3. Entrar como admin.
4. Acessar `Configurações > Notificações inteligentes`.
5. Confirmar se as regras iniciais aparecem.
6. Criar uma regra nova ou editar uma existente.
7. Clicar em **Executar motor**.
8. Acessar `Notificações`.
9. Testar filtros:
   - Todas;
   - Intervenções;
   - Ordens;
   - Sistema;
   - Lidas;
   - Críticas;
   - Importantes;
   - Atenção;
   - Informativas;
   - entidade Ordem/Intervenção/Sistema.
10. Testar ações de notificação inteligente:
    - abrir destino;
    - adiar 1h;
    - silenciar regra.
11. Executar `/api/cron/reminders` com `CRON_SECRET` configurado e validar o retorno `smartRules`.
12. Conferir no Dashboard se falhas de regra aparecem quando existirem logs com erro nas últimas 24h.

## Validação executada

```bash
npm ci --ignore-scripts
npm run typecheck
```

Resultado: typecheck aprovado.

## Observações

- Esta versão cria a base profissional do motor de alertas.
- Canais externos como e-mail, WhatsApp oficial e webhooks ficam preparados no modelo, mas não são enviados automaticamente nesta versão.
- Eventos mais granulares como status alterado, usuário criado e perfil alterado ficam cadastráveis/estruturados para evolução futura por hooks específicos.
- A V6.18.0 não altera login, ordens, intervenções, PWA, auditoria, usuários, paginação e busca da V6.17.0.
