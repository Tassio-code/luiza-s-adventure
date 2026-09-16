# Compatibilidade com GitHub Pages

## Objetivo
Preparar o jogo atual para gerar arquivos estáticos e funcionar tanto na raiz quanto em um subdiretório do GitHub Pages, sem alterar design, conteúdo, áudio ou jogabilidade.

## Alterações estritamente necessárias
1. Atualizar somente o pacote de configuração do build para uma versão que realmente suporte a geração estática do projeto atual.
2. Configurar o build para:
   - gerar HTML estático da única tela do jogo;
   - usar o modo próprio para GitHub Pages;
   - calcular automaticamente o caminho-base pelo nome do repositório no GitHub Actions;
   - continuar usando `/` no desenvolvimento local e em hospedagens na raiz.
3. Trocar caminhos públicos absolutos por caminhos que respeitem o caminho-base, somente em referências a sprites, músicas, efeitos, ícones, manifesto e foto final.
4. Ajustar o manifesto instalável para usar caminhos relativos dentro do repositório publicado.
5. Adicionar um fluxo do GitHub Actions que instala dependências, gera `.output/public` e publica essa pasta no GitHub Pages.
6. Documentar no README os comandos de build e a configuração única necessária no GitHub.

## Validação
- Executar verificação de tipos e testes existentes.
- Executar o build de produção simulando um repositório em subdiretório.
- Conferir que `index.html`, `404.html`, `.nojekyll`, scripts, CSS e todos os arquivos do jogo foram incluídos.
- Servir o resultado sob um caminho como `/nome-do-repositorio/` e abrir o jogo com Playwright.
- Confirmar no navegador que não há erros de carregamento nem respostas 404 para assets.

## Arquivos previstos
- `package.json` e `bun.lock`: suporte confiável ao build estático.
- `vite.config.ts`: preset do GitHub Pages, prerender e caminho-base automático.
- `src/game/assets.ts`, `src/game/audio.ts`, `src/game/music.ts`: caminhos públicos compatíveis com subdiretório.
- `src/routes/__root.tsx` e, se confirmado pela auditoria, `src/components/game/FinalSequence.tsx`: ícones, manifesto, navegação de erro e foto final.
- `public/manifest.webmanifest`: URLs relativas.
- `.github/workflows/deploy-pages.yml`: publicação automática.
- `README.md`: instruções objetivas de publicação.

Nenhuma fase, personagem, chefe, animação, música, efeito, regra, aparência ou funcionalidade do jogo será modificada.
