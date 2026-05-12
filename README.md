# InfraOS v6.9

Painel interno para operação de ordens de serviço, com autenticação própria, trilha de auditoria, relatórios e fila operacional pensada para uso diário.

## O que entrou nesta versão
- endurecimento técnico de produção com `proxy.ts`
- endpoint de saúde em `/api/health`
- refatoração da camada de dados em módulos menores
- filtros ativos mais claros na tela de ordens
- visões salvas por usuário para combinações recorrentes de filtros
- dashboard com drill-down direto para a fila correspondente


## V6.7 — Intervenções Programadas

A versão V6.7 adiciona o módulo **Intervenções**, uma agenda operacional para avisos recebidos por WhatsApp ou outros canais.

Principais recursos:
- nova página `/intervencoes`;
- cadastro manual de intervenção;
- campo para colar mensagem original;
- parser local para data, horário, pontos e links do Google Maps;
- múltiplos pontos por intervenção;
- filtros por hoje, amanhã, semana, atrasadas, concluídas, canceladas, tipo, localidade, status, origem, responsável e período;
- drawer lateral de detalhes com edição e troca de status;
- migration `database/15_interventions.sql`;
- auditoria estruturada para criação, edição, conclusão, cancelamento e mudança de status.

Para ativar no banco, execute `database/15_interventions.sql` após as migrations anteriores.

## V6.8 — Lembretes Internos e Notificações no Painel

A versão V6.8 complementa o módulo **Intervenções** com lembretes automáticos e notificações internas persistidas no painel.

Principais recursos:
- geração automática de lembretes ao criar/editar intervenção;
- lembretes padrão de **1 dia antes às 08:00** e **no dia às 08:00**;
- estrutura preparada para tipos futuros `two_hours_before` e `thirty_minutes_before`;
- nova rota protegida `/api/cron/reminders`;
- notificações internas persistidas em `app_notifications`;
- integração com o sino de notificações e página `/notifications`;
- botão para marcar notificações como lidas;
- dashboard com bloco **Intervenções próximas** mostrando hoje, amanhã e atrasadas;
- atualização realtime quando novas notificações são criadas;
- migration `database/16_reminders_notifications.sql`;
- `vercel.json` com cron diário `0 11 * * *`, equivalente a 08:00 BRT.

Para ativar no banco, execute `database/16_reminders_notifications.sql` após a migration `database/15_interventions.sql`.


## V6.9 — Notificação tipo app / PWA

A versão V6.9 adiciona suporte a instalação como PWA e notificações tipo app para lembretes de intervenções programadas.

Principais recursos:
- manifesto PWA em `public/manifest.webmanifest`;
- ícones básicos em `public/icons/`;
- service worker em `public/sw.js` focado apenas em push notification, sem cache offline agressivo;
- área **Notificações neste dispositivo** na página `/notifications` e em Configurações;
- ativação/desativação de push por dispositivo;
- APIs autenticadas para salvar, desativar, consultar e testar subscriptions;
- tabela `push_subscriptions`;
- tabela `notification_delivery_logs` para registrar entregas `internal`, `pwa` e canais futuros;
- integração da rota `/api/cron/reminders` com envio PWA depois da criação das notificações internas;
- script `npm run generate:vapid` para gerar chaves VAPID compatíveis com a implementação local.

Para ativar no banco, execute `database/17_pwa_push_notifications.sql` após a migration `database/16_reminders_notifications.sql`.

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
- `CRON_SECRET`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Banco de dados
Para ambiente novo:
1. aplique `database/01_initial_schema.sql`
2. aplique `database/09_upgrade_v2_9.sql`
3. aplique `database/11_saved_order_views.sql`
4. aplique `database/12_support_technicians.sql`
5. aplique `database/13_user_presence_activity.sql`
6. aplique `database/14_audit_events.sql`
7. aplique `database/15_interventions.sql`
8. aplique `database/16_reminders_notifications.sql`
9. aplique `database/17_pwa_push_notifications.sql`
10. aplique o seed adequado ao seu cenário

## Como rodar
```bash
npm install
npm run generate:vapid
npm run typecheck
npm run build
npm run start
```

Para desenvolvimento:
```bash
npm install
npm run dev
```

## Cron de lembretes

A rota de processamento é:

```text
/api/cron/reminders
```

Ela exige `CRON_SECRET` e aceita o segredo via header `Authorization: Bearer <CRON_SECRET>`, header `x-cron-secret` ou query `?secret=` para testes manuais controlados.

No Vercel, o `vercel.json` agenda a rotina todos os dias às `11:00 UTC`, equivalente a `08:00` no horário de Brasília.

Teste manual em ambiente protegido:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/reminders
```


## PWA e Web Push

Gere as chaves VAPID localmente:

```bash
npm run generate:vapid
```

Copie os três valores gerados para `.env.local` e para as variáveis do Vercel:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:infraos@seudominio.com.br"
```

Depois do deploy em HTTPS, acesse `/notifications` e use **Ativar notificações**. O navegador precisa permitir notificações. Se o usuário bloquear a permissão, será necessário liberar manualmente nas configurações do navegador.

A V6.9 não usa cache offline agressivo. O `public/sw.js` recebe apenas eventos `push` e `notificationclick`, evitando telas antigas após atualização do sistema.

Teste manual:

```bash
# 1. Ative notificações na tela /notifications
# 2. Clique em Enviar teste
# 3. Verifique a entrega em notification_delivery_logs
```

## Checklist rápido antes do deploy
- revisar `.env.local`
- validar acesso admin
- validar login/logout
- validar lifecycle da O.S.
- validar exportações
- testar `/api/health`
- executar `database/16_reminders_notifications.sql`
- executar `database/17_pwa_push_notifications.sql`
- configurar `CRON_SECRET` no Vercel
- configurar as chaves VAPID no Vercel
- testar `/api/cron/reminders` com autorização
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
- agenda de intervenções programadas com pontos do Maps
- lembretes internos automáticos para intervenções
- central de notificações com alertas persistidos no banco
- PWA com push notification para lembretes de intervenções
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
