# Os Cinco Fragmentos

## Desenvolvimento local

```bash
bun install
bun run dev
```

## Publicação no GitHub Pages

1. Envie o projeto para um repositório cuja branch principal seja `main`.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Envie uma alteração para `main` ou execute manualmente o fluxo **Deploy to GitHub Pages**.

O fluxo calcula automaticamente o caminho-base pelo nome do repositório, gera o site estático em `dist/client`, cria o fallback necessário e publica essa pasta. Repositórios no formato `usuario.github.io` também são detectados automaticamente e usam a raiz do domínio.

Se a publicação já falhou antes, confirme também em **Settings → Actions → General** que as ações estão permitidas para o repositório.

Para testar o build de produção localmente:

```bash
bun run build
```
