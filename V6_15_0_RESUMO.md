# V6.15.0 — UX Mobile Operacional: Ações Fixas, Notificações e Configurações

## Objetivo

Melhorar a experiência mobile do InfraOS nas telas operacionais mais usadas no dia a dia: detalhe de O.S., detalhe de Intervenção, Notificações, Configurações e Menu mobile.

A versão mantém login, desktop, bottom navigation, intervenções, lembretes configuráveis, notificações, PWA, dashboard, usuários, auditoria e cron sem migration nova.

## Principais mudanças

### 1. Ações fixas no detalhe da O.S.

No mobile, o detalhe da O.S. agora possui uma barra fixa de ações no rodapé do sheet:

- Editar;
- Status ou Reabrir, conforme o estado da O.S.;
- Mais, direcionando para observação rápida.

O conteúdo recebeu padding inferior para não ficar escondido atrás da barra fixa nem atrás da bottom navigation.

### 2. Ações fixas no detalhe da Intervenção

No mobile, o detalhe da Intervenção ganhou barra fixa com:

- Editar;
- Maps, quando houver pelo menos um ponto com link;
- Concluir ou Status, conforme o estado da intervenção.

Os botões secundários continuam disponíveis no desktop e nas seções internas.

### 3. Hierarquia operacional nos detalhes

A O.S. ganhou cabeçalho com número, status, prioridade, cliente, endereço, prazo e responsável.

A Intervenção ganhou resumo com título, status, tipo, origem, localidade, data, horário, quantidade de pontos e responsável.

Também foram reorganizados:

- pontos/Maps;
- lembretes configuráveis;
- mensagem original e observações em seção recolhível;
- metadados separados.

### 4. Notificações mobile mais limpas

A central de Notificações agora tem chips:

- Todas;
- Intervenções;
- Ordens;
- Sistema;
- Lidas.

Os alertas são agrupados por categoria quando possível.

O diagnóstico PWA/iOS foi movido para a seção recolhível **Status do dispositivo**.

### 5. Configurações em acordeões

A tela de Configurações foi reorganizada em seções colapsáveis:

- Perfil;
- Aparência;
- Notificações;
- PWA / Dispositivo;
- Lembretes;
- Segurança;
- Sistema.

No mobile, isso reduz o comprimento da tela e facilita encontrar ajustes específicos.

### 6. Menu mobile

O menu mobile em bottom sheet foi preservado e mantém os grupos:

- Operação;
- Gestão;
- Sistema.

As opções continuam respeitando permissões por perfil. A ação **Sair do InfraOS** fica integrada à área de Sistema no menu mobile.

## Validação executada

```bash
npm ci --ignore-scripts
npm run typecheck
```

Resultado: typecheck aprovado.

Também foi executado:

```bash
npm run build
```

O build compilou e passou TypeScript, mas o ambiente local encerrou na etapa `Collecting page data` com `EPIPE`, comportamento já observado em versões anteriores deste projeto. Recomenda-se validar novamente na Vercel/ambiente real.

## Banco de dados

Sem migration nova.
