# Correção do npm install - v2.8.3.1

## O que foi corrigido

O `package-lock.json` anterior continha URLs de um registry interno, o que podia causar erro de `ETIMEDOUT` ao rodar `npm install` fora do ambiente em que o lock foi gerado.

Nesta versão:
- o `package-lock.json` foi removido
- foi adicionado um `.npmrc` apontando para o registry público do npm

## Como instalar no Windows

```bash
rmdir /s /q node_modules
npm cache clean --force
npm install
npm run dev
```

## Se ainda aparecer registry incorreto

Verifique:

```bash
npm config get registry
```

Se não retornar `https://registry.npmjs.org/`, rode:

```bash
npm config set registry https://registry.npmjs.org/
```
