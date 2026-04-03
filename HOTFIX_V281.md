# Hotfix v2.8.1

## O que foi corrigido
- Loop de redirecionamento entre `/login` e `/dashboard`
- Limpeza automática do cookie `infraos_auth` quando a sessão estiver inválida

## Arquivo alterado
- `middleware.ts`

## O que fazer depois de atualizar
1. Substitua os arquivos do projeto pela versão v2.8.1
2. Pare o servidor atual
3. Rode `npm run dev` novamente
4. Abra `http://localhost:3000/login`

Normalmente não é mais necessário limpar cookies manualmente, porque o hotfix já remove o cookie inválido.
