# Changelog

## V6.18.0 — Motor de Notificações Inteligentes

- Criada a área **Configurações > Notificações inteligentes** para criar, editar, ativar e desativar regras de alerta.
- Regras agora possuem nome, descrição, tipo de evento, entidade, condições JSON, severidade, destinatários, canais, template, ação, cooldown e status ativo/inativo.
- Adicionados níveis de severidade: informativa, atenção, importante e crítica.
- Central de Notificações passou a exibir severidade, entidade, filtros por severidade, filtros por entidade e agrupamentos inteligentes.
- Adicionadas preferências por usuário: receber notificações internas, receber Push PWA, silenciar informativas, manter críticas ativas, pausar até horário e horário silencioso simples.
- Adicionado cooldown por regra para evitar notificações repetidas da mesma entidade na mesma janela.
- Adicionados logs de execução das regras com match, sem match, notificação criada, cooldown/preferência e erro.
- Adicionadas ações rápidas para notificações inteligentes: abrir destino, adiar 1h e silenciar regra.
- `/api/cron/reminders` agora processa lembretes de intervenção e também executa o motor de regras inteligentes.
- Dashboard operacional passou a exibir regras de notificação com falha nas últimas 24h.
- Criada migration `database/21_notification_rules.sql` com novas tabelas, colunas e índices de suporte.

## V6.17.0 — Performance, Paginação e Busca

- Intervenções passaram a usar paginação server-side com total, página atual, próxima/anterior e seletor de quantidade por página.
- Busca de Intervenções foi movida para o banco, cobrindo título, localidade, tipo, origem, status, mensagem original e observações.
- Usuários internos passaram a usar paginação server-side, busca por nome/e-mail/perfil e filtros por status, perfil e presença no banco.
- Auditoria passou a usar paginação server-side, filtros por período, usuário, entidade, ação e busca textual por O.S., intervenção, entidade, ação, usuário e descrição.
- Central de Notificações agora pagina a fila por filtro: Todas, Intervenções, Ordens, Sistema e Lidas.
- Busca de Ordens foi ampliada para técnico principal, equipe de apoio, responsável interno, status, prioridade, cliente, descrição, endereço e número da O.S.
- Criado componente reutilizável `PaginationFooter` para padronizar paginação desktop e mobile.
- Filtros importantes permanecem na URL, preservando contexto ao atualizar, compartilhar link, voltar/avançar ou abrir detalhes.
- Dashboard mantém consultas limitadas/agregadas e recebeu cache key atualizada para a versão.
- Criada migration `database/20_performance_indexes.sql` com índices para filtros, prazos, busca textual, notificações, auditoria, usuários e atividades.

## V6.16.0 — Dashboard Operacional + Melhor Uso de Tela Larga

- Criada/fortalecida a seção superior **Prioridade operacional** no Dashboard, respondendo rapidamente o que precisa de atenção agora.
- Adicionados cards clicáveis para O.S. atrasadas, O.S. vencendo hoje, O.S. sem atualização, intervenções de hoje, intervenções de amanhã, notificações críticas e lembretes pendentes.
- Dashboard mobile prioriza alertas, ações rápidas e filas compactas antes de elementos mais analíticos.
- Gráficos ficam ocultos no mobile para reduzir rolagem e evitar informação decorativa antes das prioridades.
- Criadas filas compactas mobile para O.S. atrasadas, vencendo hoje e sem atualização.
- Dashboard desktop recebeu grids mais fluidos para usar melhor 1366px, 1440px e 1920px sem concentrar tudo no centro.
- Cards superiores, prioridades e colunas laterais receberam `min-w-0`, `w-full` e distribuição responsiva para reduzir espaços mortos e overflow.
- Containers de Dashboard, Ordens, Intervenções, Notificações e Configurações foram reforçados como fluidos.
- Topbar desktop recebeu proteções de largura e truncamento para zoom 80%, 90%, 100%, 110% e 125%.
- Preferência existente de cards compactos do dashboard passa a afetar também blocos de prioridade/ações rápidas.
- Sem migration nova.

## V6.15.0 — UX Mobile Operacional: Ações Fixas, Notificações e Configurações

- Adicionado rodapé fixo de ações principais no detalhe mobile da O.S., com Editar, Status/Reabrir e Mais, sem esconder conteúdo atrás da bottom navigation.
- Adicionado rodapé fixo de ações principais no detalhe mobile da Intervenção, com Editar, Maps e Concluir/Status.
- Detalhes de O.S. receberam cabeçalho operacional com número, status, prioridade, cliente, endereço, prazo e responsável em destaque.
- Detalhe de Intervenção reorganizado com resumo operacional, pontos/Maps, lembretes configuráveis, mensagem original recolhível e metadados separados.
- Central de Notificações ganhou chips mobile para Todas, Intervenções, Ordens, Sistema e Lidas.
- Diagnóstico PWA/iOS foi recolhido na seção **Status do dispositivo**, evitando dominar a primeira dobra mobile.
- Configurações reorganizadas em acordeões: Perfil, Aparência, Notificações, PWA / Dispositivo, Lembretes, Segurança e Sistema.
- Menu mobile em bottom sheet preservado com grupos Operação, Gestão e Sistema, respeitando permissões por perfil.
- Ajustes de acessibilidade, toque, safe area, contraste e padding inferior para uso como app no celular.
- Sem migration nova.

## V6.14.1 — Intervenções Mobile Compactas + Filtros em Bottom Sheet

- Tela de **Intervenções** reorganizada no mobile para mostrar título, busca compacta, chips rápidos, botão **Filtrar** e início da lista muito mais cedo.
- Filtros avançados no mobile movidos para bottom sheet com Tipo, Localidade, Status, Origem, Responsável, De e Até.
- Criados chips rápidos horizontais roláveis: Todas, Hoje, Amanhã, Esta semana, Atrasadas, Concluídas e Canceladas, com contadores quando disponíveis.
- Cards grandes de resumo foram substituídos no mobile por chips/cards pequenos horizontais para Hoje, Amanhã, Semana, Atrasadas e Concluídas.
- Cards mobile de intervenção ficaram mais compactos, mantendo título, localidade, data/horário, status, pontos, origem e resumo de lembretes pendentes.
- Botão **Nova intervenção** continua como ação flutuante no mobile, sem ocupar uma linha grande antes da lista.
- Filtros aplicados agora aparecem em chips pequenos com remoção individual quando simples.
- Desktop preservado com cards de resumo e filtros abertos.
- Sem migration nova.

## V6.14.0 — Mobile Premium Final

- Refinada a bottom navigation mobile com melhor safe area, altura, estado ativo e área de toque.
- Reorganizado o menu mobile em grupos: Operação, Gestão e Sistema.
- Topbar mobile simplificada, sem ações duplicadas e sem poluição visual.
- Dashboard mobile ganhou bloco **Prioridade operacional** com atalhos para O.S. atrasadas, intervenções de hoje e pendências.
- Cards superiores do dashboard agora se comportam como carrossel horizontal no mobile.
- Cards de O.S. e intervenções receberam ajustes de hierarquia, compactação e leitura.
- Filtros de ordens foram refinados para uso no celular, com comportamento sticky e chips roláveis.
- Detalhes/drawers em mobile ficaram mais próximos de sheet de app, com padding/altura/raio ajustados.
- Mensagem original da intervenção ficou recolhível/expansível para não dominar a tela.
- Seção de lembretes configuráveis recebeu ajustes de toque e legibilidade no mobile.
- Central de notificações agora agrupa itens por Intervenções, Ordens/alertas e Movimentações.
- Popover de notificações foi ajustado para comportamento melhor em celular.
- Login mobile, inputs, botões e form actions receberam refinamento final de toque e espaçamento.
- Sem migration nova.

## V6.13.0 — Lembretes Configuráveis

- Adicionada configuração individual de lembretes em intervenções.
- Incluídas opções: 1 dia antes, no dia, 6 horas antes, 2 horas antes, 30 minutos antes e personalizado.
- Adicionado horário diário configurável para lembretes de dia anterior/no dia.
- Adicionada seção de lembretes no detalhe da intervenção com status pendente/processado/falhou/cancelado.
- Adicionada configuração global de padrões em Configurações > Lembretes de intervenções.
- Atualizado cron `/api/cron/reminders` para processar todos os tipos configuráveis.
- Criada migration `database/19_configurable_reminders.sql`.


## v6.12.4
- adicionada camada de estabilidade para server actions com helper `lib/action-errors.ts`;
- corrigido tratamento de `NEXT_REDIRECT` nas actions de Intervenções, evitando falso erro após criar/editar/mudar status;
- corrigido fluxo de filtros salvos em Ordens para não capturar redirect de sucesso como erro;
- mensagens técnicas de banco/SQL/stack trace são sanitizadas antes de aparecer para o usuário;
- feedbacks vindos da URL agora usam `decodeSearchParamMessage` nas telas principais e detalhes;
- `FormStateGuard` passou a reduzir submit duplicado por duplo clique;
- toasts flutuantes respeitam a bottom navigation no mobile;
- páginas protegidas e dependentes de sessão foram marcadas como `force-dynamic` para reduzir tentativa de geração estática indevida;
- `tsconfig.json` ajustado para TypeScript 6.0;
- sem migration nova.

## v6.12.3
- criado utilitário client-side de diagnóstico de ambiente para identificar iOS/iPadOS, Android, Windows/Desktop, modo PWA instalado, Service Worker, Push API, Notification API e `showNotification`;
- fluxo especial para iPhone/iPad: quando o InfraOS estiver aberto no Safari/navegador normal, o sistema não oferece ativação direta de push e mostra orientação para adicionar à Tela de Início;
- ativação PWA no iOS fica disponível somente quando o app estiver aberto pelo ícone instalado/standalone;
- a área **Notificações neste dispositivo** ganhou painel de diagnóstico com plataforma, modo de abertura, contexto seguro, Service Worker, Push API, permissão, subscription e último status PWA;
- banner pós-login agora exibe instrução específica para iOS fora do PWA e mantém ocultação temporária via `localStorage`;
- `manifest.webmanifest` recebeu ícones PNG e metadados mais compatíveis com Home Screen/iOS, mantendo SVGs como fallback;
- `app/layout.tsx` recebeu metadados `apple-mobile-web-app-*`, apple touch icon e `viewport-fit=cover`;
- `public/sw.js` atualizado para versão interna 6.12.3, preservando foco em push notification sem cache offline agressivo;
- README atualizado com troubleshooting e passo a passo de teste no iPhone;
- sem migration nova.

## v6.12.2
- removido `max-w-[1800px]`/`mx-auto` do AppShell protegido para o painel ocupar toda a largura útil do desktop;
- criado layout fluido com `.app-shell`, `.app-shell-layout`, `.app-shell-main`, `.app-main-content`, `.app-content-fluid` e `.dashboard-grid-fluid`;
- corrigidas faixas laterais vazias em telas largas e com zoom reduzido no Windows/desktop;
- conteúdo principal agora usa `flex-1`, `w-full` e `min-w-0`, mantendo a sidebar com largura fixa controlada;
- dashboard ajustado para distribuir cards e gráficos melhor em 1366px, 1440px, 1920px e zoom 80% a 125%;
- topbar, gráficos e superfícies receberam proteções contra overflow horizontal;
- preservado comportamento mobile: bottom navigation apenas no mobile, sidebar apenas no desktop e padding inferior apenas em telas pequenas;
- sem migration nova.

## v6.12.1
- corrigida a bottom navigation aparecendo indevidamente no Windows/desktop junto com a sidebar lateral;
- adicionada proteção CSS para esconder `.mobile-bottom-nav` e overlay de menu mobile em telas `lg` ou maiores;
- removido padding inferior reservado para navegação mobile em desktop;
- sidebar desktop recebeu classe dedicada para reforçar o comportamento responsivo;
- tela de login refeita com composição mais premium, fundo com gradiente sutil, card mais presente, logo centralizado e textos reduzidos;
- controle de tema no login ficou discreto e não domina mais o card;
- mantidas autenticação, PWA, intervenções, notificações, dashboard e demais módulos;
- sem migration nova.

## v6.12.0
- correção da navegação mobile para remover a duplicidade entre sidebar lateral e bottom navigation
- novo menu mobile em bottom sheet com opções completas, respeitando permissões do usuário
- inclusão de logout visível no mobile
- topbar mobile simplificada sem botão de menu lateral redundante
- login redesenhado para ser apenas a tela de acesso, mais simples, premium e responsivo
- ajustes de safe area, espaçamento e hierarquia para uso em Android, iPhone e PWA
- pacote sem migration nova

# V6.11.0 — Notificações Globais por Usuário e Dispositivo

- A rotina `/api/cron/reminders` passa a criar notificações internas de intervenção para todos os usuários internos ativos, respeitando usuários inativos.
- O envio PWA agora percorre todos os dispositivos ativos vinculados a cada usuário notificado. Se um usuário ativou no Windows e no celular, ambos recebem a tentativa de push.
- Mantida a regra do navegador: cada dispositivo precisa ser autorizado pelo próprio usuário uma vez.
- Adicionado banner discreto após login/acesso ao painel para orientar a ativação de notificações no dispositivo atual.
- O banner não solicita permissão automaticamente; o prompt do navegador só abre após clique em **Ativar**.
- O botão **Agora não** oculta o aviso por 7 dias no navegador via `localStorage`.
- A área **Notificações neste dispositivo** diferencia dispositivo atual ativo/inativo, permissão do navegador, total de dispositivos ativos, último envio PWA e lista de dispositivos.
- Usuários podem desativar seus próprios dispositivos individualmente, sem afetar outros usuários.
- Adicionada migration `database/18_global_push_devices.sql` para registrar `subscription_id` nos logs de entrega PWA.
- Logs de entrega PWA ficam mais claros para diagnóstico por usuário/dispositivo.
- README atualizado com fluxo de teste global, diagnóstico SQL e explicação de ativação por dispositivo.

# V6.10.0 — Mobile First e Login Premium

- Adicionada navegação inferior fixa no mobile com atalhos para Início, Ordens, Intervenções, Alertas e Menu.
- O shell protegido agora reserva espaço inferior com `env(safe-area-inset-bottom)`, evitando que o conteúdo fique escondido atrás da navegação no iPhone/Android.
- Topbar mobile simplificada, com título menor, ações compactas e remoção de botões pesados em telas pequenas.
- Página de login redesenhada com painel editorial no desktop, card mais leve no mobile e hierarquia visual mais clara.
- A central de notificações agora usa carrossel horizontal de cards no mobile, evitando grid empilhado alto demais.
- Cards mobile de O.S. foram compactados para priorizar número, cliente, prazo, alertas e responsáveis sem sensação de tabela espremida.
- Filtros de O.S. ganharam tratamento mobile com chips horizontais roláveis e áreas de toque maiores.
- Intervenções programadas receberam ação flutuante no mobile para **Nova intervenção**, cards mais compactos e modal ajustado para telas pequenas.
- Drawers de detalhes receberam comportamento visual mais próximo de bottom sheet no mobile, com bordas arredondadas, drag handle e respeito ao safe area.
- Sem migration nova; alterações focadas em UX/UI, responsividade e shell mobile.

# V6.9.1 — Hotfix Push PWA

- Corrigida a criptografia `aes128gcm` da implementação local de Web Push para o fluxo RFC 8291, evitando o cenário em que o push service aceita a requisição, mas o navegador não consegue descriptografar/exibir a notificação.
- A ativação de notificações agora verifica se a subscription do navegador foi criada com a chave VAPID pública atual; se a chave mudou, a subscription antiga é removida e uma nova é criada.
- O service worker passa a ser atualizado no carregamento do painel e mantém foco exclusivo em Push Notification, sem cache offline agressivo.
- A área **Notificações neste dispositivo** agora mostra permissão do navegador, quantidade de dispositivos ativos e último envio PWA registrado.
- Adicionado botão **Testar local** para validar `ServiceWorkerRegistration.showNotification()` diretamente no dispositivo.
- Renomeado/ajustado o teste servidor para **Enviar teste push**, exibindo enviadas, falhas e ignoradas.
- O botão de teste não declara sucesso quando apenas a notificação interna foi criada; o retorno agora expõe detalhes reais do envio PWA.
- Logs de entrega PWA foram enriquecidos no retorno da API, mantendo `notification_delivery_logs` como fonte de diagnóstico.
- README atualizado com troubleshooting para Windows, Android, iPhone/iOS, permissões do navegador e SQL de diagnóstico.
- Sem migration nova; a versão continua usando `database/17_pwa_push_notifications.sql`.

# V6.9.0 — Notificação tipo app / PWA

- Configurado o InfraOS como PWA com `public/manifest.webmanifest`, ícones básicos e metadata de instalação.
- Criado `public/sw.js` com foco exclusivo em Push Notification e clique em notificação, sem cache agressivo/offline que possa deixar telas desatualizadas.
- Adicionada área **Notificações neste dispositivo** na central `/notifications` e em Configurações.
- Criadas APIs autenticadas para status, inscrição, desativação e teste de push: `/api/push/status`, `/api/push/subscribe`, `/api/push/unsubscribe` e `/api/push/test`.
- Criada migration `database/17_pwa_push_notifications.sql` com as tabelas `push_subscriptions` e `notification_delivery_logs`.
- A rotina `/api/cron/reminders` agora envia push PWA para dispositivos autorizados após criar notificações internas.
- Entregas internas e PWA passam a ter logs por canal, status, usuário, data e erro quando houver falha.
- Subscriptions inválidas retornando `404` ou `410` são desativadas automaticamente.
- Criada implementação local de Web Push/VAPID sem adicionar dependência externa obrigatória.
- Adicionado script `npm run generate:vapid` para gerar chaves compatíveis.
- `.env.example` atualizado com `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.
- README atualizado com guia de configuração PWA, variáveis de ambiente, teste e limitações de navegador.

# V6.8.0 — Lembretes Internos e Notificações no Painel

- Criada a migration `database/16_reminders_notifications.sql` com as tabelas `reminders` e `app_notifications`.
- Ao criar, editar ou alterar status de uma intervenção, o InfraOS agora sincroniza lembretes automáticos.
- Lembretes padrão gerados: `one_day_before` às 08:00 e `same_day` às 08:00 no fuso operacional `America/Sao_Paulo`.
- Estrutura de banco preparada para `two_hours_before` e `thirty_minutes_before` em versões futuras.
- Criada a rota protegida `/api/cron/reminders` para processar lembretes pendentes.
- A rota cron valida `CRON_SECRET` por `Authorization: Bearer`, `x-cron-secret` ou query `?secret=` para teste controlado.
- Adicionado `vercel.json` com cron diário `0 11 * * *`, equivalente a 08:00 BRT.
- Lembretes processados criam notificações internas persistidas para o responsável pela intervenção ou, se não houver responsável, para usuários ativos.
- Notificações de intervenções atrasadas são criadas de forma idempotente para evitar duplicidade.
- O sino de notificações agora inclui lembretes de intervenções e permite marcar todas como lidas.
- A página `/notifications` ganhou card de Intervenções e ação para marcar notificações internas como lidas.
- O dashboard recebeu o bloco **Intervenções próximas**, mostrando hoje, amanhã e atrasadas com link direto para o detalhe.
- Eventos de notificação continuam usando realtime/SSE para atualizar o sino, dashboard e painel sem recarregar a página.
- Criado `.env.example` com `CRON_SECRET` e variáveis principais.
- README atualizado com instruções de migration, cron e teste manual protegido.

# V6.7.0 — Intervenções Programadas

- Criado o novo módulo `/intervencoes` para registrar e acompanhar intervenções programadas recebidas por WhatsApp, e-mail, telefone ou cadastro interno.
- Adicionado item **Intervenções** no menu lateral seguindo o padrão visual do InfraOS.
- Implementada listagem com cards de resumo para Hoje, Amanhã, Esta semana, Atrasadas e Concluídas.
- Incluídos filtros rápidos e filtros avançados por busca, tipo, localidade, status, origem, responsável e período.
- Criado fluxo de cadastro com campo de mensagem original, parser local por regex e campos editáveis para título, tipo, localidade, data, horários, status, origem, responsável e observações.
- O parser identifica datas no formato `DD/MM/YYYY`, faixa de horário, links do Google Maps e pontos como `POSTE 01`, `POSTE 02` etc., sem depender de IA/API externa.
- Adicionada estrutura de múltiplos pontos/localizações com label e link do Maps, incluindo botão **Abrir no Maps** no detalhe.
- Criado drawer lateral de detalhes no desktop e comportamento responsivo no mobile, com edição, alteração de status e confirmação para conclusão/cancelamento.
- Incluídas as tabelas `infra_events` e `infra_event_points` na migration `database/15_interventions.sql`.
- Auditoria forte foi ampliada para registrar ações de intervenção como criação, edição, mudança de status, conclusão e cancelamento.
- Adicionados endpoints `/api/interventions` e `/api/interventions/[id]` para atualização incremental da lista e do drawer.
- Typecheck concluído com sucesso e build compilado corretamente no ambiente de validação.

# V6.4.1 — Hotfix Auditoria em Produção

- Corrigido erro ao abrir `/audit` em produção quando o Postgres retorna `created_at` como objeto `Date` em vez de string ISO.
- Normalizada a data dos eventos de auditoria antes de calcular os eventos do dia e renderizar a lista.
- Adicionado fallback seguro para a tela de auditoria quando a migration `database/14_audit_events.sql` ainda não foi aplicada no banco de produção.
- A tela de auditoria e a auditoria dentro do drawer da O.S. deixam de quebrar a aplicação caso a tabela `audit_events` ainda não exista.

# V6.4.0 — Paginação Server-side e Performance da Fila

- Adicionada paginação server-side na tela `/orders`, evitando carregar/renderizar toda a base de O.S. de uma vez.
- Incluídos controles de navegação por página com links numerados, anterior/próxima e resumo `Mostrando X–Y de Z O.S.`.
- Adicionada seleção de densidade da listagem com 25, 50 ou 100 ordens por página.
- O tamanho da página agora é preservado nos filtros, atalhos rápidos, paginação e visões salvas.
- Busca, filtros, ordenação e exportação continuam respeitando a visão atual.
- A API `/api/orders` agora retorna dados paginados com `page`, `pageSize`, `total`, `totalPages` e resumo de alertas.
- A página solicitada é normalizada quando fica fora do intervalo, evitando tela vazia ao reduzir filtros.
- Cards rápidos de atrasadas, vencendo hoje e sem atualização passaram a usar contagens do banco para a visão filtrada, não apenas a página atual.
- Adicionados estilos específicos para paginação no visual Dark Graphite.

# V6.3.0 — Dark Graphite Visual Pass

- Aplicada nova paleta dark-first com base preta/grafite: `#050505`, `#080808`, `#101010`, `#161616` e `#1c1c1c`.
- Reduzido o aspecto azul/slate do dark mode anterior, deixando o visual mais técnico, sóbrio e premium.
- Refinados cards, tabelas, sidebar, topbar, drawer, filtros, formulários, login, skeletons, empty states, notificações e badges para o dark mode.
- Ajustadas cores de status no dark: azul para andamento, âmbar para atenção, vermelho para atraso/erro e verde para finalizado/sucesso.
- Removido excesso de sombras, brilhos e gradientes no modo escuro, priorizando leitura e operação.
- Tema padrão inicial passa a abrir em modo escuro quando o usuário ainda não possui preferência salva.

# Changelog

## V6.17.0 — Performance, Paginação e Busca

- Intervenções passaram a usar paginação server-side com total, página atual, próxima/anterior e seletor de quantidade por página.
- Busca de Intervenções foi movida para o banco, cobrindo título, localidade, tipo, origem, status, mensagem original e observações.
- Usuários internos passaram a usar paginação server-side, busca por nome/e-mail/perfil e filtros por status, perfil e presença no banco.
- Auditoria passou a usar paginação server-side, filtros por período, usuário, entidade, ação e busca textual por O.S., intervenção, entidade, ação, usuário e descrição.
- Central de Notificações agora pagina a fila por filtro: Todas, Intervenções, Ordens, Sistema e Lidas.
- Busca de Ordens foi ampliada para técnico principal, equipe de apoio, responsável interno, status, prioridade, cliente, descrição, endereço e número da O.S.
- Criado componente reutilizável `PaginationFooter` para padronizar paginação desktop e mobile.
- Filtros importantes permanecem na URL, preservando contexto ao atualizar, compartilhar link, voltar/avançar ou abrir detalhes.
- Dashboard mantém consultas limitadas/agregadas e recebeu cache key atualizada para a versão.
- Criada migration `database/20_performance_indexes.sql` com índices para filtros, prazos, busca textual, notificações, auditoria, usuários e atividades.

## V6.13.0 — Lembretes Configuráveis

- Adicionada configuração individual de lembretes em intervenções.
- Incluídas opções: 1 dia antes, no dia, 6 horas antes, 2 horas antes, 30 minutos antes e personalizado.
- Adicionado horário diário configurável para lembretes de dia anterior/no dia.
- Adicionada seção de lembretes no detalhe da intervenção com status pendente/processado/falhou/cancelado.
- Adicionada configuração global de padrões em Configurações > Lembretes de intervenções.
- Atualizado cron `/api/cron/reminders` para processar todos os tipos configuráveis.
- Criada migration `database/19_configurable_reminders.sql`.


## v6.12.3
- criado utilitário client-side de diagnóstico de ambiente para identificar iOS/iPadOS, Android, Windows/Desktop, modo PWA instalado, Service Worker, Push API, Notification API e `showNotification`;
- fluxo especial para iPhone/iPad: quando o InfraOS estiver aberto no Safari/navegador normal, o sistema não oferece ativação direta de push e mostra orientação para adicionar à Tela de Início;
- ativação PWA no iOS fica disponível somente quando o app estiver aberto pelo ícone instalado/standalone;
- a área **Notificações neste dispositivo** ganhou painel de diagnóstico com plataforma, modo de abertura, contexto seguro, Service Worker, Push API, permissão, subscription e último status PWA;
- banner pós-login agora exibe instrução específica para iOS fora do PWA e mantém ocultação temporária via `localStorage`;
- `manifest.webmanifest` recebeu ícones PNG e metadados mais compatíveis com Home Screen/iOS, mantendo SVGs como fallback;
- `app/layout.tsx` recebeu metadados `apple-mobile-web-app-*`, apple touch icon e `viewport-fit=cover`;
- `public/sw.js` atualizado para versão interna 6.12.3, preservando foco em push notification sem cache offline agressivo;
- README atualizado com troubleshooting e passo a passo de teste no iPhone;
- sem migration nova.

## v5.2.2
- hotfix de tipagem em `lib/server-data/shared.ts`, garantindo que `mapOrderDetail` retorne `auditEvents: []` por padrão para satisfazer o tipo `ServiceOrderDetail`

## v5.2.1
- hotfix de tipagem em `components/audit/audit-event-list.tsx` com anotação explícita de retorno em `formatJsonValue` para corrigir o build do Next.js/TypeScript

## v5.2.0
- aplicação da v4.7 com UI de auditoria dentro do detalhe da O.S. e nova tela administrativa global de auditoria
- detalhe da O.S. agora separa Observações, Timeline e Auditoria em navegação própria, mantendo a trilha operacional distinta da rastreabilidade estruturada
- nova página `/audit` com filtros por O.S., usuário, tipo de ação e período para leitura gerencial das mudanças
- leitura de auditoria enriquecida com autor, campo alterado, valor anterior, valor novo, data e hora exatas
- detalhe da ordem agora carrega eventos estruturados de auditoria junto do restante do contexto

## v5.1.9
- aplicação da v4.6 com base de auditoria forte separada da timeline operacional
- criação da migration `database/14_audit_events.sql` com tabela própria para eventos de auditoria estruturados
- inclusão da camada central `lib/audit.ts` para gravação reutilizável de auditoria por entidade
- ações críticas de ordens agora registram auditoria estruturada para mudança de status, prazo, técnico responsável, equipe de apoio, finalização, reabertura e cancelamento
- base de leitura de auditoria preparada em `lib/server-data/audit.ts` para futuras telas e consultas gerenciais

## v5.1.8
- aplicação da v4.5 com sincronização realtime nas telas principais usando SSE e provider central
- ordens agora reagem a eventos de atualização, recarregando a fila filtrada e o drawer aberto sem F5
- dashboard e central de notificações passaram a atualizar automaticamente quando a operação muda
- presença de usuários agora pode atualizar a área administrativa sem ação manual através de bridge de realtime
- contador e popover de notificações do topo agora recebem atualização imediata por eventos do sistema

## v5.1.6
- aplicação da v4.3 na tela de usuários com leitura mais clara de presença, último login e última atividade
- inclusão de filtro por presença, mantendo conta e perfil separados para análise mais precisa da equipe
- ordenação por atividade recente na listagem de usuários, priorizando quem esteve ativo por último
- badges de presença refinados para online, ausente e offline, com destaque visual mais forte para online
- cards mobile e tabela desktop reorganizados para facilitar a leitura rápida de data, hora e status operacional

## v5.1.5
- aplicação da v4.2 com base de presença real dos usuários internos
- inclusão da coluna `last_seen_at` e script de migração para distinguir último login de última atividade
- heartbeat automático nas áreas protegidas para atualizar presença por foco, navegação, atividade e intervalos regulares
- endpoint dedicado de presença para registrar atividade sem depender de refresh manual
- usuários agora passam a ter status derivado de presença (`Online`, `Ausente`, `Offline`) com base no `last_seen_at`
- tela de usuários preparada para exibir último login, última atividade e presença atual com segurança

## v5.1.4
- aplicação da v3.9.1 na tela de ordens com drawer abrindo e fechando instantaneamente no client, sem depender do rerender completo da página
- sincronização da seleção com `selected=id` e `action=` na URL via history state para manter contexto sem travar a UX
- carregamento sob demanda do detalhe por API dedicada, com cache em memória e skeleton enquanto a O.S. é buscada
- painel de detalhe e overlay de ações rápidas agora operam localmente, incluindo fechamento imediato por clique fora, botão e tecla Esc
- página de ordens deixa de consultar o detalhe completo no render principal, reduzindo o peso de abrir e fechar a lateral
- ajuste do `tsconfig` para `ignoreDeprecations: "5.0"`, evitando o valor inválido que bloqueava o comando de typecheck

## v5.1.3
- aplicação da v3.9 na tela de ordens com abertura do detalhe apenas por seleção da O.S.
- linha inteira e cards mobile agora funcionam como ponto principal de entrada, com hover mais claro e destaque visual forte da seleção
- detalhe removido da lateral fixa e transformado em drawer lateral no desktop e tela cheia no mobile
- fechamento do detalhe por clique fora, tecla Esc e botão dedicado, preservando filtros e contexto da URL com `selected=id`
- tabela simplificada com menos poluição visual, concentrando ações principais dentro do detalhe
- modal de ações rápidas agora também fecha por clique fora e Esc sem perder a ordem selecionada

## v5.1.2
- aplicação da v3.8 visual na tela de ordens com header mais curto e foco maior na tabela
- faixa de filtros compactada com busca principal no topo, atalhos rápidos e refinamento avançado mais enxuto
- cards de status reduzidos para ocupar menos altura sem perder leitura operacional
- bloco de filtros ativos simplificado com chips menores e ação de limpeza mais discreta
- visões salvas transformadas em painel recolhível para liberar espaço acima da listagem
- ajustes finos de espaçamento, textos e densidade visual para reduzir a sensação de dashboard pesado

## v5.1.1
- correção de fuso horário nos campos de data/hora das O.S., interpretando `datetime-local` como horário operacional do Brasil (`America/Sao_Paulo`)
- ajuste de criação e edição para salvar prazo e abertura sem deslocamento de horas
- formatação e preenchimento dos campos de data/hora alinhados ao mesmo fuso em toda a interface
- notificações “vence hoje” agora não duplicam ordens que já estão atrasadas
- sino de notificações com silenciamento local por alerta já aberto, evitando alarme repetido até haver nova mudança na ordem
- atualização automática leve da central de notificações a cada 20 segundos e ao voltar para a aba/janela
- endpoint `app/api/notifications/summary/route.ts` para autoatualização da central sem F5

## v5.1.0
- suporte a múltiplos técnicos por O.S., mantendo um responsável principal e técnicos de apoio
- migration `database/12_support_technicians.sql` para a nova relação entre ordens e equipe de apoio
- criação e edição de O.S. agora permitem marcar técnicos de apoio
- listagem, detalhe e dashboard passam a mostrar resumo de equipe quando houver mais de um técnico na ordem
- filtro por técnico passa a considerar participação como responsável ou apoio
- contagens por técnico e relatórios ajustados para considerar ordens com apoio

## v5.0.3 - login simplificado
- remove o painel lateral informativo da tela de login
- centraliza o cartão de acesso para uma entrada mais limpa
- mantém o fundo visual e a identidade sem excesso de informação

# Changelog

## V6.17.0 — Performance, Paginação e Busca

- Intervenções passaram a usar paginação server-side com total, página atual, próxima/anterior e seletor de quantidade por página.
- Busca de Intervenções foi movida para o banco, cobrindo título, localidade, tipo, origem, status, mensagem original e observações.
- Usuários internos passaram a usar paginação server-side, busca por nome/e-mail/perfil e filtros por status, perfil e presença no banco.
- Auditoria passou a usar paginação server-side, filtros por período, usuário, entidade, ação e busca textual por O.S., intervenção, entidade, ação, usuário e descrição.
- Central de Notificações agora pagina a fila por filtro: Todas, Intervenções, Ordens, Sistema e Lidas.
- Busca de Ordens foi ampliada para técnico principal, equipe de apoio, responsável interno, status, prioridade, cliente, descrição, endereço e número da O.S.
- Criado componente reutilizável `PaginationFooter` para padronizar paginação desktop e mobile.
- Filtros importantes permanecem na URL, preservando contexto ao atualizar, compartilhar link, voltar/avançar ou abrir detalhes.
- Dashboard mantém consultas limitadas/agregadas e recebeu cache key atualizada para a versão.
- Criada migration `database/20_performance_indexes.sql` com índices para filtros, prazos, busca textual, notificações, auditoria, usuários e atividades.

## V6.13.0 — Lembretes Configuráveis

- Adicionada configuração individual de lembretes em intervenções.
- Incluídas opções: 1 dia antes, no dia, 6 horas antes, 2 horas antes, 30 minutos antes e personalizado.
- Adicionado horário diário configurável para lembretes de dia anterior/no dia.
- Adicionada seção de lembretes no detalhe da intervenção com status pendente/processado/falhou/cancelado.
- Adicionada configuração global de padrões em Configurações > Lembretes de intervenções.
- Atualizado cron `/api/cron/reminders` para processar todos os tipos configuráveis.
- Criada migration `database/19_configurable_reminders.sql`.


## v6.12.3
- criado utilitário client-side de diagnóstico de ambiente para identificar iOS/iPadOS, Android, Windows/Desktop, modo PWA instalado, Service Worker, Push API, Notification API e `showNotification`;
- fluxo especial para iPhone/iPad: quando o InfraOS estiver aberto no Safari/navegador normal, o sistema não oferece ativação direta de push e mostra orientação para adicionar à Tela de Início;
- ativação PWA no iOS fica disponível somente quando o app estiver aberto pelo ícone instalado/standalone;
- a área **Notificações neste dispositivo** ganhou painel de diagnóstico com plataforma, modo de abertura, contexto seguro, Service Worker, Push API, permissão, subscription e último status PWA;
- banner pós-login agora exibe instrução específica para iOS fora do PWA e mantém ocultação temporária via `localStorage`;
- `manifest.webmanifest` recebeu ícones PNG e metadados mais compatíveis com Home Screen/iOS, mantendo SVGs como fallback;
- `app/layout.tsx` recebeu metadados `apple-mobile-web-app-*`, apple touch icon e `viewport-fit=cover`;
- `public/sw.js` atualizado para versão interna 6.12.3, preservando foco em push notification sem cache offline agressivo;
- README atualizado com troubleshooting e passo a passo de teste no iPhone;
- sem migration nova.

## v5.2.0
- aplicação da v4.7 com UI de auditoria dentro do detalhe da O.S. e nova tela administrativa global de auditoria
- detalhe da O.S. agora separa Observações, Timeline e Auditoria em navegação própria, mantendo a trilha operacional distinta da rastreabilidade estruturada
- nova página `/audit` com filtros por O.S., usuário, tipo de ação e período para leitura gerencial das mudanças
- leitura de auditoria enriquecida com autor, campo alterado, valor anterior, valor novo, data e hora exatas
- detalhe da ordem agora carrega eventos estruturados de auditoria junto do restante do contexto

## v5.1.5
- aplicação da v4.2 com base de presença real dos usuários internos
- inclusão da coluna `last_seen_at` e script de migração para distinguir último login de última atividade
- heartbeat automático nas áreas protegidas para atualizar presença por foco, navegação, atividade e intervalos regulares
- endpoint dedicado de presença para registrar atividade sem depender de refresh manual
- usuários agora passam a ter status derivado de presença (`Online`, `Ausente`, `Offline`) com base no `last_seen_at`
- tela de usuários preparada para exibir último login, última atividade e presença atual com segurança

## v5.0.2
- refatoração completa da página de login com visual mais moderno, menos ruído e melhor hierarquia visual
- novo hero de acesso com animações sutis, preview operacional e cards de destaque mais objetivos
- formulário de login simplificado com copy mais direta, campos refinados e suporte melhor a foco/feedback
- remoção de textos longos e informações redundantes na entrada do sistema
- melhoria das animações de fundo e polimento visual da tela de autenticação

## v5.0.1
- correção do bloco de filtros da fila de O.S.
- filtros avançados agora começam fechados e só abrem quando há refinamento aplicado ou quando o usuário solicitar
- substituição do seletor de período por campos de data nativos mais estáveis
- limpeza de excesso visual em ordens, dashboard, usuários, técnicos, perfil, notificações, topo e sidebar
- remoção de blocos e textos redundantes para deixar o painel mais objetivo

## v5.0.0
- consolidação premium com aplicação das frentes v4.3, v4.4, v4.6, v4.8 e pente fino final
- formulários premium com seções visuais, descrições de campo, guard de alterações não salvas e foco automático em campos principais
- refino da área administrativa de usuários com filtros mais claros, estatísticas, estados vazios melhores e UX mais segura nas ações sensíveis
- timeline interativa da O.S. redesenhada com cartões por evento, ícones por ação e leitura cronológica mais rica
- central de notificações operacional adicionada em `/notifications` com resumo vivo derivado da operação atual
- sino de notificações no topo e navegação dedicada para alertas, vencimentos do dia, filas sem atualização e atividades recentes
- revisão de consistência de componentes, tsconfig para toolchain atual e atualização visual das telas mais críticas
- pacote sem migration nova; notificações nesta versão são derivadas dos dados atuais do sistema

## v4.2.0
- pacote consolidado com as frentes v3.8, v3.9, v4.0 e v4.2
- microanimações seguras em cards, botões, inputs, tabelas, empty states e loaders
- suporte explícito a `prefers-reduced-motion`
- shimmer visual nos skeletons e refinamento de transições globais
- filtros da tela de ordens com atalhos rápidos, seção avançada recolhível e contagem de filtros ativos
- destaque visual de linha selecionada e de itens atualizados recentemente na listagem de O.S.
- paginação e leitura da fila refinadas com resumo de intervalo e alertas operacionais
- dashboard com cards premium, contadores animados, spark bars e faixa de foco operacional
- gráficos refinados com legenda mais rica, animação de entrada e leitura visual melhor
- feedbacks e mensagens do sistema com visual mais claro e títulos contextuais
- botões de envio com estado pendente em formulários principais e ações críticas

## v3.7.0
- substituição do middleware legado por `proxy.ts`
- novo endpoint `/api/health` para verificação pós-deploy
- refatoração da camada `lib/data.ts` em módulos menores de servidor
- filtros ativos mais claros na tela de ordens
- visões salvas por usuário com migration dedicada
- dashboard com cards clicáveis para drill-down operacional
- documentação e checklist de produção atualizados

## v3.2.0
- branding aplicado com `BrandLogo` na sidebar, topbar, login e configurações
- favicon próprio via `app/icon.svg`
- tela de login redesenhada com painel visual e copy mais institucional
- refinamento de superfícies, cards, estados vazios e acabamento visual geral
- ajustes de identidade para deixar o sistema com mais cara de produto final

## v3.1.0
- aplicadas as etapas v2.9, v3.0 e v3.1 no mesmo pacote
- dependências fixadas em versões exatas
- login sem credenciais padrão visíveis na tela
- logout com tratamento de falha e cookie encerrado de forma mais segura
- rate limit de login persistente no banco com fallback local
- command palette com listener duplicado removido
- revalidação por tag para dashboard e relatórios
- listagem de O.S. com cards em telas menores e tabela no desktop
- resumo operacional no topo da página de ordens
- filtros e busca na página de usuários
- troca rápida de perfil com confirmação
- configurações administrativas funcionais com persistência local no navegador
- documentação, seeds e migrations revisadas para pré-produção
