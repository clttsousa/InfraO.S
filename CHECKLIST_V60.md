# Checklist V6.0 — Blindagem de Produção

## 1. Rate limit de login
- fazer 5 tentativas inválidas consecutivas com o mesmo e-mail/IP
- confirmar resposta 429 após atingir o limite
- validar cabeçalho `Retry-After`
- após sucesso de login, confirmar limpeza do bucket
- se a tabela `auth_login_attempts` estiver ausente ou o banco falhar, validar log `[infraos][auth-rate-limit] fallback em memória ativado`

## 2. Server Actions com proteção de origem
- abrir a aplicação normalmente e testar criação/edição de O.S., usuários e técnicos
- confirmar fluxo normal sem impacto em operação legítima
- validar que requisição com origem inválida é bloqueada com mensagem de segurança

## 3. Sanitização de links externos
- tentar salvar `javascript:alert(1)` em `locationLink` e confirmar bloqueio
- tentar salvar `data:text/html,...` e confirmar bloqueio
- salvar URL `https://maps.app.goo.gl/...` e confirmar persistência
- confirmar que links inválidos antigos não aparecem como âncora clicável no detalhe

## 4. Pool de banco
- navegar por dashboard, ordens, usuários e técnicos
- confirmar ausência de erros de conexão recreando pool a cada chamada
- acompanhar logs de produção após deploy para garantir estabilidade

## 5. Feedback via query string
- acessar rotas com `?error=%E0%A4%A` e confirmar que a tela não quebra
- conferir exibição segura da mensagem sanitizada

## 6. DELETE de view salva
- enviar id inválido para exclusão de filtro salvo
- confirmar retorno tratado com mensagem amigável
- confirmar ausência de erro bruto do PostgreSQL no fluxo
