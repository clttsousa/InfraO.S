# InfraOS v6.17.0

Painel interno para operação de ordens de serviço, intervenções programadas, lembretes configuráveis, notificações e auditoria.

## O que entrou nesta versão
- paginação server-side revisada/implementada em Ordens, Intervenções, Notificações, Usuários e Auditoria;
- busca movida para o banco quando possível, evitando filtrar listas grandes apenas no cliente;
- filtros importantes preservados na URL para atualizar, compartilhar link e abrir detalhes sem perder contexto;
- central de Notificações paginada por categoria: Todas, Intervenções, Ordens, Sistema e Lidas;
- Auditoria preparada para crescer com paginação, filtros por período/usuário/entidade/ação e busca textual;
- Usuários internos com busca/filtros/paginação no servidor;
- Intervenções com total de registros, página atual, próxima/anterior e seletor de itens por página;
- componente reutilizável `PaginationFooter` para desktop/mobile;
- migration `database/20_performance_indexes.sql` com índices de performance e busca.

## V6.17.0 — Performance, Paginação e Busca

Esta versão prepara o InfraOS para crescimento real de dados. As listagens principais deixam de depender de grandes arrays filtrados no cliente e passam a trabalhar com paginação, filtros por URL e consultas mais objetivas no servidor.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local compilou e passou TypeScript, mas o ambiente encerrou novamente em `Collecting page data` com `EPIPE`, comportamento já observado nas versões anteriores; validar também na Vercel/ambiente real.

Migration nova:

```text
database/20_performance_indexes.sql
```

## V6.16.0 — Dashboard Operacional + Melhor Uso de Tela Larga

Esta versão torna o Dashboard mais útil para operação diária. A primeira leitura agora responde **o que precisa de atenção agora**, com prioridade operacional no topo, atalhos clicáveis para filas relacionadas e melhor aproveitamento do espaço em telas Windows de 1366px, 1440px e 1920px.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local deve ser validado também na Vercel/ambiente real, mantendo a observação das versões anteriores sobre encerramento em `Collecting page data` em alguns ambientes locais.

## V6.15.0 — UX Mobile Operacional: Ações Fixas, Notificações e Configurações

Esta versão melhora o uso do InfraOS no celular como app operacional. Detalhes de O.S. e Intervenção passam a ter ações fixas no rodapé do sheet mobile, a central de notificações fica mais limpa e filtrável, e Configurações deixa de virar uma tela longa demais no celular.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local compilou e passou TypeScript, mas o ambiente encerrou em `Collecting page data` com `EPIPE`, comportamento já observado em versões anteriores; validar também na Vercel/ambiente real.

## V6.14.1 — Intervenções Mobile Compactas + Filtros em Bottom Sheet

Esta versão resolve o excesso de altura da tela de Intervenções no celular. A primeira dobra agora prioriza operação rápida: título, busca, filtros rápidos, botão **Filtrar** e início da lista de intervenções. Os filtros detalhados continuam disponíveis, mas dentro de uma bottom sheet mobile.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local compilou e passou TypeScript, mas o ambiente encerrou em `Collecting page data` por timeout/EPIPE; validar também na Vercel/ambiente real.

## V6.14.0 — Mobile Premium Final

Esta versão revisa a experiência mobile do InfraOS tela por tela, preservando o layout desktop fluido e os recursos existentes de intervenções, lembretes configuráveis, PWA, notificações internas, usuários e auditoria.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local compilou, mas o ambiente encerrou por timeout na etapa seguinte, como já vinha ocorrendo em versões anteriores; validar também na Vercel/ambiente real.

## V6.12.4 — Estabilidade Geral e Correções Finas

Esta versão estabiliza fluxos existentes antes dos próximos recursos. Ela revisa actions, mensagens de feedback, redirects, responsividade básica e pontos que poderiam causar erro falso ao usuário.

Validação executada:

```bash
npm ci --ignore-scripts
npm run typecheck
```

O typecheck foi aprovado. O build local compilou e passou TypeScript, mas o ambiente encerrou em `Collecting page data` com `EPIPE`; as páginas protegidas foram marcadas como `force-dynamic` para reduzir geração estática indevida.

## V6.12.2 — Hotfix Layout Fluido Desktop + Responsividade por Zoom

A V6.12.2 corrige o comportamento observado no Windows/desktop em zoom alterado ou telas largas, onde o painel ficava preso em uma largura máxima e sobravam faixas laterais vazias.

Principais correções:
- `AppShell` removido de `max-w-[1800px]` e `mx-auto` no layout protegido;
- criado layout fluido com `.app-shell`, `.app-shell-layout`, `.app-shell-main`, `.app-main-content` e `.app-content-fluid`;
- main usa `flex-1`, `min-w-0` e `w-full` para ocupar o espaço restante da sidebar;
- dashboard ganhou classes fluidas e grids com colunas `minmax(0, 1fr)`;
- cards superiores do dashboard usam melhor o espaço disponível em desktop;
- gráficos e superfícies receberam proteções contra overflow horizontal;
- padding inferior reservado para bottom nav continua restrito ao mobile;
- sidebar desktop e bottom navigation mobile continuam mutuamente exclusivas;
- sem migration nova.

Validação recomendada:
- desktop: testar em 1366px, 1440px e 1920px;
- zoom: testar 80%, 90%, 100%, 110% e 125%;
- mobile: testar 390px e 430px para confirmar que bottom navigation e safe area continuam corretas.

## V6.12.1 — Hotfix Navegação Responsiva + Login Premium

A V6.12.1 corrige a duplicidade de navegação vista no desktop/Windows e refina novamente a tela de login para uma composição mais premium, simples e objetiva.

Principais correções:
- bottom navigation fica visível somente em telas menores que `lg`;
- desktop/notebook usa apenas a sidebar lateral;
- padding inferior reservado para bottom nav é removido em desktop;
- sidebar desktop recebe classe dedicada `desktop-sidebar`;
- conteúdo mobile mantém safe area para não ficar atrás da barra inferior;
- login redesenhado com fundo premium, card com mais presença, logo centralizado, textos reduzidos e tema como controle discreto;
- formulário de login mantém autenticação e validações existentes;
- sem migration nova.

Validação recomendada:
- conferir desktop em 1366px e 1920px: apenas sidebar lateral, sem barra inferior;
- conferir mobile em 390px e 430px: apenas bottom navigation e menu em sheet;
- conferir login em desktop e mobile.

## V6.12 — Mobile Premium, Menu Único e Login Limpo

A V6.12 corrige a experiência mobile observada em campo. A navegação lateral mobile foi removida do fluxo principal para evitar duas navegações simultâneas. A barra inferior passa a ser a navegação correta no celular e o item **Menu** abre uma folha inferior com as opções completas do usuário.

Principais recursos:
- bottom navigation permanece como navegação principal no mobile;
- botão **Menu** abre um bottom sheet próprio com atalhos administrativos e opção de sair;
- admins veem usuários, técnicos, auditoria e configurações no menu mobile;
- operadores veem apenas itens permitidos pelo perfil;
- logout disponível e claro no mobile;
- topbar mobile sem hambúrguer/sidebar duplicada;
- tela de login deixou de usar hero institucional e passou a ser somente formulário de acesso, simples e premium;
- melhorias de padding e safe area para uso como PWA no celular.

Não há migration nova nesta versão.

Arquivo complementar: `MOBILE_UX_NEXT_STEPS.md` com recomendações para próximos refinamentos mobile.


## V6.11 — Notificações Globais por Usuário e Dispositivo

A V6.11 ajusta as notificações de intervenções para o uso real em equipe. Agora os lembretes processados pela rota `/api/cron/reminders` criam notificação interna para **todos os usuários ativos** e tentam enviar Push/PWA para **todos os dispositivos ativos** desses usuários.

Principais recursos:
- todos os usuários internos ativos recebem lembretes de intervenção na central do InfraOS;
- se o mesmo usuário ativou PWA no Windows e no celular, os dois dispositivos recebem a tentativa de push;
- usuários sem dispositivo PWA ativo continuam recebendo a notificação interna;
- novo banner discreto após login/acesso ao painel orienta a ativar notificações no dispositivo atual;
- o banner não abre o prompt automaticamente: a permissão do navegador só é solicitada após clique em **Ativar**;
- o botão **Agora não** oculta o aviso por 7 dias neste navegador;
- a área **Notificações neste dispositivo** mostra status do navegador, status do dispositivo atual, total de dispositivos ativos, último envio e lista de dispositivos do usuário;
- cada usuário pode desativar apenas os próprios dispositivos;
- logs PWA registram `subscription_id` para diagnosticar entrega por dispositivo.

Migration necessária:

```sql
database/18_global_push_devices.sql
```

Execute essa migration após `database/17_pwa_push_notifications.sql`.


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


## V6.9.1 — Hotfix Push PWA

A versão V6.9.1 corrige e melhora o diagnóstico das notificações tipo app/PWA.

Principais ajustes:
- correção da criptografia `aes128gcm` do Web Push para o fluxo RFC 8291;
- revalidação automática da inscrição quando a chave VAPID pública muda;
- atualização do service worker ao carregar o painel;
- botão **Testar local** para validar se o próprio navegador/Windows/celular consegue exibir notificação via `showNotification()`;
- botão **Enviar teste push** para validar o fluxo servidor → push service → dispositivo;
- UI agora mostra entregas, falhas e ignoradas, sem declarar sucesso apenas porque a notificação interna foi criada;
- área de PWA exibe permissão do navegador, quantidade de dispositivos ativos e último envio PWA registrado;
- logs continuam usando `notification_delivery_logs` com `channel = pwa`.

Não há migration nova nesta versão. Mantenha aplicada a `database/17_pwa_push_notifications.sql` da V6.9.

### Como testar a notificação tipo app

1. Acesse o InfraOS por HTTPS em produção ou `localhost` em desenvolvimento.
2. Entre em `/settings` ou `/notifications`.
3. Na área **Notificações neste dispositivo**, clique em **Ativar notificações**.
4. Clique primeiro em **Testar local**.
   - Se aparecer fora da aba, o Windows/celular/navegador conseguem exibir notificações.
   - Se não aparecer, o bloqueio está no sistema operacional, navegador, permissão do site ou modo Não incomodar.
5. Clique depois em **Enviar teste push**.
   - Esse teste valida o envio real do backend para o dispositivo.
   - A UI deve mostrar `enviada(s)`, `falha(s)` e `ignorada(s)`.
6. Confira o log no banco:

```sql
select
  channel,
  status,
  error_message,
  sent_at,
  created_at
from notification_delivery_logs
where channel = 'pwa'
order by created_at desc
limit 20;
```

### Troubleshooting rápido

Windows/Chrome/Edge:
- confirme que o site está com permissão **Permitir notificações**;
- confirme que o Windows não está em **Não incomodar/Assistente de foco**;
- confira se as notificações do Chrome/Edge estão permitidas em `Configurações > Sistema > Notificações`;
- rode **Testar local** antes do teste push.

Android:
- use Chrome/Edge atualizado;
- confira permissões de notificação do navegador e do site;
- teste com o site aberto via HTTPS.

iPhone/iOS:
- use Safari;
- adicione o InfraOS à Tela de Início;
- abra pelo ícone instalado;
- ative notificações dentro do PWA instalado.

Se o banco mostra `status = sent`, mas nada aparece no sistema, rode **Testar local**. Se o teste local também não aparecer, o problema está fora do backend.


### Teste de envio global por usuário/dispositivo

1. Faça login com o Usuário A no Windows e clique em **Ativar notificações**.
2. Faça login com o mesmo Usuário A no celular e ative também.
3. Faça login com o Usuário B em outro dispositivo e ative.
4. Crie uma intervenção ou force um lembrete pendente no banco.
5. Rode a rota protegida `/api/cron/reminders`.
6. Usuários ativos devem receber notificação interna.
7. Usuários com mais de um dispositivo PWA ativo devem receber uma tentativa de push por dispositivo.

SQL útil para conferir entrega por dispositivo:

```sql
select
  dl.channel,
  dl.status,
  dl.user_id,
  dl.subscription_id,
  ps.user_agent,
  dl.error_message,
  dl.sent_at,
  dl.created_at
from notification_delivery_logs dl
left join push_subscriptions ps on ps.id = dl.subscription_id
order by dl.created_at desc
limit 30;
```

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
10. aplique `database/18_global_push_devices.sql`
11. aplique o seed adequado ao seu cenário

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


## V6.10 — Mobile First e Login Premium

A V6.10 não exige migration nova. Ela melhora a experiência mobile e a tela de login:

- navegação inferior fixa no mobile;
- topbar compacta em telas pequenas;
- login com visual mais premium no desktop e mais leve no celular;
- cards de O.S. e intervenções mais legíveis no mobile;
- filtros com chips horizontais roláveis;
- central de notificações com cards em carrossel no mobile;
- drawers com comportamento visual de bottom sheet e safe area para iPhone/Android/PWA.

### Como os lembretes de intervenção estão configurados

Na configuração atual, ao criar ou editar uma intervenção programada, o InfraOS sincroniza automaticamente dois lembretes:

```text
one_day_before = 1 dia antes, às 08:00
same_day       = no dia da intervenção, às 08:00
```

O fuso usado é `America/Sao_Paulo`. A rota `/api/cron/reminders` processa os lembretes que já venceram e, no Vercel, o `vercel.json` está configurado para rodar todos os dias às `11:00 UTC`, equivalente a `08:00` BRT.

A base já possui os tipos `two_hours_before` e `thirty_minutes_before`, mas eles estão apenas preparados para versão futura e ainda não são gerados automaticamente.

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

### iPhone/iOS: ativação correta

No iPhone/iPad, não trate a ativação igual ao Windows/Android. A tela **Notificações neste dispositivo** agora detecta iOS e informa se o InfraOS está aberto como navegador normal ou como PWA instalado.

Fluxo recomendado para teste no iPhone:

1. Remova o ícone antigo do InfraOS da Tela de Início, se ele foi adicionado antes desta versão.
2. Abra o InfraOS no Safari usando a URL em HTTPS.
3. Toque em **Compartilhar**.
4. Toque em **Adicionar à Tela de Início**.
5. Abra o InfraOS pelo ícone criado.
6. Faça login.
7. Acesse **Configurações** ou **Notificações**.
8. Verifique o painel **Diagnóstico do dispositivo**.
9. Ative notificações, use **Testar local** e depois **Enviar teste push**.

Se o diagnóstico mostrar **iOS / Navegador normal**, o botão de ativar push fica bloqueado e o sistema exibe a orientação de instalação na Tela de Início.

Se **Testar local** falhar, o problema está no iOS/permissão/PWA instalado. Se **Testar local** funcionar e **Enviar teste push** falhar, confira `notification_delivery_logs` e as chaves VAPID.

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



## V6.17.0 — Performance, Paginação e Busca

A versão V6.17.0 prepara o InfraOS para crescimento real de dados, reduzindo carregamento de listas inteiras no cliente e movendo filtros/pesquisas para consultas paginadas no servidor.

### O que mudou

- **Ordens**: preservada e refinada a paginação server-side existente, com busca ampliada para número da O.S., cliente, descrição, endereço/localidade, técnico, responsável interno, status e prioridade.
- **Intervenções**: listagem agora usa paginação server-side com `limit/offset`, total de registros, página atual, próxima/anterior e seletor de quantidade por página.
- **Notificações**: central completa passou a carregar a fila por página/filtro, evitando buscar todo o histórico de uma vez. O popover continua limitado aos itens recentes.
- **Usuários**: gestão administrativa passou a usar busca/filtros no banco, paginação e resumo separado da página atual.
- **Auditoria**: eventos agora são paginados no servidor, com busca por O.S./intervenção, entidade, ação, usuário, descrição e filtros por período, entidade, ação e usuário.
- **URLs com contexto**: filtros importantes permanecem na URL para atualizar a página, compartilhar links, voltar/avançar no navegador e abrir detalhes preservando o contexto.
- **Componente reutilizável**: criado `PaginationFooter` para padronizar paginação desktop/mobile.

### Migration de performance

Execute após `database/19_configurable_reminders.sql`:

```sql
\i database/20_performance_indexes.sql
```

No Neon/Supabase SQL Editor, cole e execute o conteúdo do arquivo:

```text
database/20_performance_indexes.sql
```

A migration cria índices para filtros operacionais, datas/prazos, status, responsáveis, notificações, lembretes, auditoria, usuários e busca textual com `pg_trgm`.

### Testes recomendados

1. Aplicar `database/20_performance_indexes.sql` em um banco de teste ou homologação.
2. Rodar `npm ci --ignore-scripts`.
3. Rodar `npm run typecheck`.
4. Abrir **Ordens**, pesquisar por número, cliente, descrição, localidade, técnico e status.
5. Validar paginação de Ordens com filtros ativos e abrir drawer mantendo URL/contexto.
6. Abrir **Intervenções**, testar busca, chips rápidos, filtros avançados e paginação.
7. Abrir **Usuários** como admin, filtrar por status, perfil, presença e trocar quantidade por página.
8. Abrir **Auditoria**, combinar período + usuário + entidade + ação + busca textual e paginar.
9. Abrir **Notificações**, alternar entre Todas, Intervenções, Ordens, Sistema e Lidas, usando paginação.
10. Testar no mobile se os controles não ocupam espaço excessivo e se a lista não renderiza itens demais.


## V6.13.0 — Lembretes Configuráveis

A versão V6.13.0 transforma os lembretes de intervenções em uma configuração flexível. Ao criar ou editar uma intervenção, o operador pode selecionar:

- 1 dia antes;
- No dia;
- 6 horas antes;
- 2 horas antes;
- 30 minutos antes;
- Personalizado, com data/hora específica.

Os lembretes de dia anterior e do próprio dia usam o horário diário configurado na intervenção. Em **Configurações > Lembretes de intervenções**, o administrador pode definir os padrões aplicados a novas intervenções.

### Migration obrigatória

Execute depois da V6.12.4:

```sql
database/19_configurable_reminders.sql
```

### Teste recomendado

1. Aplique a migration `database/19_configurable_reminders.sql`.
2. Acesse **Configurações > Lembretes de intervenções** e defina os padrões.
3. Crie uma intervenção com `1 dia antes`, `No dia` e `2 horas antes`.
4. Abra o detalhe da intervenção e confirme a seção **Lembretes**.
5. Edite data/horário da intervenção e confirme que lembretes pendentes foram recalculados.
6. Rode `/api/cron/reminders?secret=SEU_CRON_SECRET` para validar o processamento.

Observação: lembretes já processados permanecem preservados; lembretes pendentes podem ser recalculados/cancelados conforme a edição da intervenção.
