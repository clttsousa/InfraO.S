# InfraOS V6.12 — Mobile Premium, Menu Único e Login Limpo

## Objetivo
Corrigir a experiência mobile onde a sidebar lateral e a bottom navigation apareciam juntas, além de simplificar a tela de login no Windows e no celular.

## Implementado
- A bottom navigation passa a ser a navegação principal no mobile.
- O botão de hambúrguer/topbar que abria a sidebar mobile foi removido.
- O item **Menu** da bottom navigation agora abre um bottom sheet com todas as opções permitidas ao usuário.
- Admins têm acesso mobile a Nova O.S., Técnicos, Usuários, Relatórios, Auditoria, Configurações e Meu acesso.
- Operadores veem somente as opções permitidas pelo perfil.
- Logout visível no menu mobile.
- Tela de login simplificada: sem hero institucional lateral, com formulário centralizado e visual premium.
- Ajustes de safe area, espaçamento e hierarquia para Android/iPhone/PWA.

## Migration
Não há migration nova nesta versão.

## Como testar
1. Abrir o sistema em tela mobile.
2. Confirmar que só aparece a bottom navigation fixa no rodapé.
3. Tocar em **Menu** e validar as opções administrativas conforme o perfil.
4. Validar que o botão **Sair do InfraOS** encerra a sessão.
5. Abrir `/login` em desktop e mobile e confirmar que a página mostra apenas o login, sem painel/hero lateral.
6. Navegar por Ordens, Intervenções, Notificações e Configurações para confirmar que a bottom nav não conflita com os conteúdos.

## Observação
As notificações continuam configuradas como na V6.11: todos os usuários ativos recebem notificação interna, e todos os dispositivos PWA ativos de cada usuário recebem tentativa de push.
