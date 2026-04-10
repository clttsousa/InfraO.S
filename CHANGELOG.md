# Changelog

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
