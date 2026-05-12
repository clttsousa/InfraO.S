# InfraOS V6.12.1 — Hotfix Navegação Responsiva + Login Premium

## Objetivo
Corrigir a duplicidade de navegação no desktop e elevar o acabamento visual da tela de login sem alterar regras de negócio.

## Correções aplicadas
- Bottom navigation passa a ser visível apenas em mobile/tablet menor que `lg`.
- Em desktop/Windows/notebook, somente a sidebar lateral permanece visível.
- Overlay do menu mobile é bloqueado em desktop.
- `main` recebeu classe `app-main-content` para controlar padding inferior com segurança.
- Em desktop, o padding inferior reservado para a bottom nav é removido.
- Em mobile, o padding com `env(safe-area-inset-bottom)` permanece para evitar conteúdo atrás da bottom nav.
- Login foi redesenhado com fundo premium, grid sutil, glow discreto, card mais presente e hierarquia simplificada.
- Botão de tema no login ficou compacto e secundário.
- Textos decorativos do login foram reduzidos para manter foco no acesso.

## Compatibilidade
Sem migration nova.

Não foram alteradas as regras de:
- autenticação;
- intervenções;
- lembretes;
- notificações internas;
- PWA/push;
- usuários;
- auditoria;
- dashboard.

## Validação recomendada
1. Desktop 1366px/1920px: verificar se não existe bottom navigation no rodapé.
2. Mobile 390px/430px: verificar se a bottom navigation aparece e a sidebar não aparece.
3. Menu mobile: conferir opções administrativas e logout.
4. Login desktop/mobile: conferir alinhamento, legibilidade e funcionamento do formulário.
