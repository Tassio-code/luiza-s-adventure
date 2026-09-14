# Luiza's Adventure

Quero transformar o projeto atual em um jogo 2D top-down completo, jogável e profissional.

IMPORTANTE: este não deve ser tratado como uma página web com algumas animações. Quero um jogo 2D de verdade, com arquitetura organizada, sistema de combate, inimigos, armas, munição, vida, exploração, progressão, customização de personagem, mapa, 5 fases, bosses e uma recompensa narrativa no final.

A experiência será um presente de aniversário personalizado para uma pessoa chamada Luiza.

==================================================

1. CONCEITO PRINCIPAL

==================================================

O jogo será um TOP-DOWN SHOOTER 2D.

A inspiração de gameplay é a sensação de jogos de tiro rápidos como DOOM, porém em visão superior/top-down.

IMPORTANTE:

NÃO copiar DOOM.

NÃO utilizar personagens, inimigos, mapas, armas, sprites, sons, músicas, logos ou qualquer asset protegido de DOOM.

Quero apenas inspiração na sensação de combate, ritmo e gerenciamento de recursos.

Toda a identidade visual, personagens, inimigos, mapas e arte devem ser originais.

A estrutura principal será:

TELA INICIAL

↓

CRIAÇÃO DO AVATAR

↓

MAPA PRINCIPAL

↓

FASE 1

↓

FRAGMENTO 1

↓

FASE 2

↓

FRAGMENTO 2

↓

FASE 3

↓

FRAGMENTO 3

↓

FASE 4

↓

FRAGMENTO 4

↓

FASE 5 / BOSS FINAL

↓

FRAGMENTO 5

↓

5 FRAGMENTOS REUNIDOS

↓

MENSAGEM FINAL

↓

FOGOS DE ARTIFÍCIO

==================================================

2. DIREÇÃO ARTÍSTICA

==================================================

Quero ILUSTRAÇÃO 2D ESTILIZADA.

A estética deve parecer um jogo indie premium.

Características:

- personagens estilizados;

- expressões simples;

- animações suaves;

- cenários desenhados;

- iluminação cinematográfica;

- sombras;

- partículas;

- profundidade por camadas;

- efeitos ambientais;

- identidade própria para cada mundo.

Evitar:

- aparência de jogo gerado automaticamente;

- UI genérica;

- excesso de gradientes;

- excesso de neon;

- estética cyberpunk;

- visual de dashboard;

- excesso de glassmorphism;

- elementos aleatórios;

- assets inconsistentes.

O jogo precisa parecer uma experiência feita manualmente e com muito cuidado.

==================================================

3. CUSTOMIZAÇÃO DO AVATAR — SISTEMA CRÍTICO

==================================================

ESTA É UMA DAS PARTES MAIS IMPORTANTES DO PROJETO.

A jogadora deverá criar seu próprio avatar antes de começar a aventura.

A customização NÃO pode ser apenas visual ou decorativa.

O avatar criado precisa ser o MESMO personagem utilizado durante TODAS as cinco fases.

Não quero que o jogo crie um personagem diferente ao entrar em cada fase.

O personagem criado deve permanecer exatamente igual durante toda a experiência.

==================================================

4. ESTRUTURA DO AVATAR

==================================================

O avatar deve ser composto por CAMADAS independentes.

Estrutura recomendada:

AVATAR

├── sombra

├── corpo/pele

├── pernas

├── roupa inferior

├── tronco

├── roupa superior

├── braços

├── olhos

├── sobrancelhas

├── boca

├── cabelo traseiro

├── cabelo frontal

├── acessórios

└── detalhes

A arquitetura deve permitir alterar cada parte sem destruir as outras.

Não faça uma única imagem contendo todo o personagem.

Utilize composição por camadas/spritesheets/Canvas ou uma solução equivalente adequada ao projeto.

==================================================

5. OPÇÕES DO AVATAR

==================================================

Permitir personalização de:

PELE:

- vários tons de pele;

- seleção visual clara;

- nenhuma opção deve causar erro de renderização.

CABELO:

- vários penteados;

- cabelo curto;

- cabelo longo;

- cabelo preso;

- cabelo ondulado;

- cabelo cacheado;

- outros estilos.

COR DO CABELO:

- preto;

- castanho;

- castanho claro;

- loiro;

- ruivo;

- outras variações coerentes.

OLHOS:

- diferentes formatos;

- diferentes cores.

SOBRANCELHAS:

- diferentes estilos.

BOCA:

- diferentes estilos sutis.

ROUPAS:

- camisetas;

- blusas;

- jaquetas;

- calças;

- shorts;

- saias;

- outras opções.

CORES DAS ROUPAS:

Permitir alterar as cores quando aplicável.

ACESSÓRIOS:

- óculos;

- chapéus;

- laços;

- acessórios de cabelo;

- mochilas;

- outros.

==================================================

6. PREVIEW EM TEMPO REAL

==================================================

Na tela de criação do avatar, o personagem deve aparecer grande no centro.

Toda alteração deve aparecer imediatamente.

Exemplo:

trocar cabelo

→ cabelo muda imediatamente.

trocar olhos

→ olhos mudam imediatamente.

trocar roupa

→ roupa muda imediatamente.

trocar cor

→ cor muda imediatamente.

Não deve ser necessário recarregar a página.

Não deve existir atraso perceptível.

==================================================

7. REGRAS IMPORTANTES DA CUSTOMIZAÇÃO

==================================================

Ao trocar uma característica:

NÃO resetar outras características.

Exemplo:

Se a jogadora escolher:

cabelo preto

+

olhos verdes

+

roupa vermelha

e depois trocar apenas o cabelo para loiro:

O resultado deve ser:

cabelo loiro

+

olhos verdes

+

roupa vermelha.

NUNCA:

cabelo loiro

+

olhos padrão

+

roupa padrão.

Cada categoria deve possuir estado independente.

==================================================

8. COMPATIBILIDADE ENTRE CAMADAS

==================================================

Todas as peças do avatar precisam ter:

- mesma escala;

- mesmo centro;

- mesma posição;

- mesmo sistema de coordenadas;

- mesma proporção;

- mesma orientação.

Não pode acontecer:

cabelo deslocado;

olhos fora do rosto;

roupa atravessando o corpo;

acessório flutuando;

braço desaparecendo;

roupa ficando atrás da camada errada.

Criar um sistema central de ordenação de camadas.

Exemplo:

BACK_HAIR

BODY

CLOTHES

ARMS

FACE

EYES

FRONT_HAIR

ACCESSORIES

WEAPON

A ordem deve ser controlada centralmente.

==================================================

9. AVATAR DURANTE O JOGO

==================================================

O avatar criado deve ser utilizado durante todas as fases.

Quando o jogador estiver andando:

o cabelo deve acompanhar o personagem.

Quando correr:

usar animação de movimento.

Quando mirar:

o corpo/braços/arma devem reagir corretamente.

Quando atirar:

mostrar animação de tiro.

Quando sofrer dano:

mostrar feedback visual.

Quando morrer:

mostrar animação de derrota.

Quando completar uma fase:

mostrar animação de vitória.

==================================================

10. ARMAS E AVATAR

==================================================

A arma deve ser uma camada independente do personagem.

Não criar uma imagem diferente do avatar para cada arma.

Estrutura:

AVATAR

+

WEAPON

Assim:

fase 1 → pistola

fase 2 → duas pistolas

fase 3 → fuzil

fase 4 → espingarda

fase 5 → metralhadora

A troca da arma NÃO pode alterar:

- cabelo;

- olhos;

- pele;

- roupa;

- acessórios.

==================================================

11. PERSISTÊNCIA DO AVATAR

==================================================

Salvar a configuração do avatar usando localStorage.

Salvar:

- tom de pele;

- cabelo;

- cor do cabelo;

- olhos;

- sobrancelhas;

- boca;

- roupa;

- cor da roupa;

- acessórios.

Ao fechar e reabrir o jogo:

o avatar deve continuar exatamente como foi criado.

==================================================

12. VALIDAÇÃO DA CUSTOMIZAÇÃO

==================================================

Antes de considerar o sistema concluído, testar TODAS as combinações possíveis ou uma matriz representativa de combinações.

Testar:

- cada cabelo;

- cada cor;

- cada olho;

- cada roupa;

- cada acessório;

- troca rápida entre opções;

- combinação de várias categorias;

- salvar;

- recarregar;

- entrar na fase;

- sair da fase;

- voltar ao mapa;

- iniciar outra fase.

Verificar se:

- nenhuma camada desaparece;

- nenhuma camada fica deslocada;

- nenhuma textura fica quebrada;

- nenhuma imagem fica distorcida;

- nenhuma opção reseta outra;

- nenhuma opção gera erro no console.

==================================================

13. MAPA PRINCIPAL

==================================================

Depois da criação do avatar, abrir o mapa principal.

O mapa terá cinco regiões:

1. FLORESTA

2. CIDADE

3. NEVE

4. DESERTO

5. CASTELO

Cada região deve ser visualmente diferente.

A fase 1 começa desbloqueada.

As demais inicialmente bloqueadas.

Ao completar uma fase:

desbloquear a próxima.

==================================================

14. INTERAÇÃO COM O MAPA

==================================================

Ao clicar em uma região:

abrir uma tela/modal com:

NOME DA FASE

DESCRIÇÃO

ARMA

INIMIGOS

FRAGMENTO

PROGRESSO

BOTÃO:

INICIAR FASE

Se estiver bloqueada:

FASE BLOQUEADA

Complete a fase anterior para desbloquear este local.

==================================================

15. FASE 1 — FLORESTA

==================================================

Ambiente:

floresta escura e misteriosa.

Elementos:

- árvores;

- grama;

- pedras;

- riachos;

- troncos;

- folhas;

- neblina;

- partículas;

- luz atravessando as árvores.

INIMIGOS:

ORCS.

A fase deve possuir uma pequena horda de orcs.

ARMAMENTO:

PISTOLA.

A pistola deve possuir munição limitada.

O objetivo é explorar a floresta, sobreviver aos inimigos e encontrar o fragmento.

No final:

pequeno inimigo chefe ou encontro especial.

==================================================

16. FASE 2 — CIDADE

==================================================

Ambiente:

cidade abandonada.

INIMIGOS:

ZUMBIS.

Arma:

DUAS PISTOLAS.

As duas pistolas devem funcionar de maneira independente ou simultânea.

Criar sensação de combate mais rápida.

Elementos:

- ruas;

- carros;

- prédios;

- lojas abandonadas;

- postes;

- becos;

- placas;

- janelas;

- iluminação urbana.

==================================================

17. FASE 3 — NEVE

==================================================

Ambiente:

cidade/montanha congelada.

INIMIGOS:

ZUMBIS DE GELO.

Arma:

FUZIL.

Criar inimigos visualmente diferentes.

Elementos:

- neve;

- gelo;

- montanhas;

- árvores congeladas;

- nevasca;

- cavernas;

- cristais.

==================================================

18. FASE 4 — DESERTO

==================================================

Ambiente:

deserto com ruínas.

INIMIGOS:

ESQUELETOS.

Arma:

ESPINGARDA.

A espingarda deve ter:

- dano alto;

- alcance limitado;

- dispersão;

- pouca munição.

Elementos:

- dunas;

- ruínas;

- templos;

- pedras;

- cactos;

- areia;

- tempestade de areia.

==================================================

19. FASE 5 — CASTELO

==================================================

Ambiente:

castelo sombrio.

INIMIGOS:

VAMPIROS.

Arma:

METRALHADORA.

A fase deve ser a mais intensa.

Elementos:

- castelo;

- lua;

- névoa;

- tochas;

- ruínas;

- árvores mortas;

- corvos;

- partículas;

- iluminação vermelha.

==================================================

20. BOSS FINAL

==================================================

No final da fase 5 haverá um BOSS:

UM SENHOR DOS VAMPIROS.

O boss deve possuir:

- barra de vida;

- ataques;

- padrões de ataque;

- animações;

- momentos de vulnerabilidade;

- efeitos;

- sons.

A luta deve ser acessível.

Não criar dificuldade frustrante.

Depois de derrotá-lo:

BOSS DERROTADO

E o quinto fragmento aparece.

==================================================

21. SISTEMA DE COMBATE

==================================================

Implementar:

- mira;

- tiro;

- projéteis;

- dano;

- inimigos;

- colisão;

- hit detection;

- knockback quando apropriado;

- morte;

- respawn;

- efeitos de impacto.

O jogador deve conseguir mirar usando mouse no desktop.

No mobile, utilizar sistema de mira adequado para toque.

==================================================

22. MUNIÇÃO

==================================================

A munição deve ser ESCASSA.

Não quero munição infinita.

A jogadora deverá explorar o mapa para encontrar:

- caixas de munição;

- munição individual;

- suprimentos.

A quantidade de munição deve ser controlada.

Isso cria tensão e exploração.

Não quero que seja possível simplesmente ficar atirando sem pensar.

==================================================

23. VIDA

==================================================

A vida também será um recurso limitado.

Criar:

- barra de vida;

- kits médicos;

- itens de cura;

- dano;

- invulnerabilidade temporária após receber dano;

- morte.

A vida não deve regenerar automaticamente.

Kits médicos devem ser encontrados no mapa.

==================================================

24. EXPLORAÇÃO

==================================================

Não quero que o mapa seja apenas uma arena vazia.

Cada fase deve possuir:

- caminhos;

- pequenas áreas;

- corredores;

- espaços secretos;

- caixas;

- munição;

- vida;

- obstáculos;

- áreas opcionais.

Explorar deve valer a pena.

==================================================

25. FRAGMENTOS

==================================================

Ao completar cada fase:

mostrar uma pequena animação.

O jogador encontra um fragmento.

Exemplo:

FRAGMENTO OBTIDO

1/5

O fragmento deve ser salvo imediatamente.

Depois retornar ao mapa.

==================================================

26. PROGRESSO

==================================================

No mapa mostrar:

FRAGMENTOS

[■] [□] [□] [□] [□]

Depois:

[■] [■] [□] [□] [□]

Até:

[■] [■] [■] [■] [■]

Quando todos forem coletados:

executar uma animação especial.

Os cinco fragmentos se unem.

Liberar:

ABRIR MENSAGEM.

==================================================

27. MENSAGEM FINAL

==================================================

Ao abrir:

escurecer o mapa.

Mostrar os cinco fragmentos.

Eles se unem.

Depois a mensagem aparece.

Utilizar o texto pessoal fornecido no projeto.

Não modificar o significado da mensagem.

Apresentar como uma experiência narrativa.

==================================================

28. FOGOS DE ARTIFÍCIO

==================================================

Depois da mensagem:

mostrar:

FELIZ ANIVERSÁRIO, LUIZA.

Depois:

QUE SEUS SONHOS SE TORNEM REALIDADE.

Então começar uma grande sequência de fogos de artifício.

Os fogos devem ser proceduralmente gerados.

Não quero apenas imagens ou GIFs.

Criar:

- foguete subindo;

- trajetória;

- explosão;

- partículas;

- gravidade;

- diferentes tipos de explosão;

- partículas secundárias;

- fumaça;

- brilho;

- variação de tamanho;

- profundidade;

- pequenas partículas residuais.

O efeito deve parecer profissional.

==================================================

29. ARQUITETURA

==================================================

Separar sistemas:

GameEngine

Player

AvatarCustomization

AvatarRenderer

WeaponSystem

EnemySystem

BossSystem

Physics

Collision

ProjectileSystem

ParticleSystem

Camera

InputManager

MobileControls

LevelManager

MapManager

FragmentSystem

SaveSystem

AudioManager

UIManager

SceneManager

DialogueSystem

EndingSystem

Não colocar tudo em um único arquivo.

Manter responsabilidades separadas.

==================================================

30. ESTADOS DO JOGO

==================================================

Utilizar estados claros:

MENU

CHARACTER_CREATION

WORLD_MAP

LEVEL

PAUSE

BOSS

FRAGMENT_REWARD

MESSAGE

ENDING

Todas as transições devem passar pelo SceneManager/GameManager.

Não duplicar lógica de transição.

==================================================

31. SAVE SYSTEM

==================================================

Salvar:

avatar;

fases concluídas;

fragmentos;

configurações;

volume;

progresso;

mensagem desbloqueada.

O jogo deve continuar exatamente de onde parou.

==================================================

32. MOBILE

==================================================

O jogo deve funcionar em:

desktop;

notebook;

tablet;

celular.

Desktop:

mouse para mirar;

teclado para movimentar.

Mobile:

joystick virtual;

botão de tiro;

botão de interação;

botão de troca de arma quando necessário.

Os controles precisam ser realmente utilizáveis.

==================================================

33. BUGS E VALIDAÇÃO — EXTREMAMENTE IMPORTANTE

==================================================

Não considere o projeto concluído apenas porque a tela aparece.

Faça testes reais.

TESTAR:

- criação do avatar;

- todas as opções de cabelo;

- todas as cores;

- olhos;

- pele;

- roupas;

- acessórios;

- combinação de itens;

- salvar avatar;

- recarregar página;

- iniciar fase;

- avatar dentro da fase;

- troca de armas;

- tiro;

- colisão;

- inimigos;

- dano;

- morte;

- respawn;

- munição;

- vida;

- itens;

- fragmentos;

- retorno ao mapa;

- desbloqueio de fases;

- boss;

- mensagem;

- fogos.

==================================================

34. TESTE ESPECÍFICO DE AVATAR

==================================================

Faça testes específicos para garantir que:

1. O avatar criado é o mesmo em todas as fases.

2. Nenhuma fase cria um avatar padrão.

3. Nenhuma troca de arma altera a aparência.

4. Nenhuma troca de roupa altera cabelo/olhos/pele.

5. Nenhuma troca de cabelo reseta roupa.

6. Nenhuma troca de cor reseta outras categorias.

7. O avatar permanece salvo após recarregar.

8. O avatar permanece salvo após fechar e abrir novamente.

9. O avatar é corretamente renderizado em todas as animações.

10. O avatar funciona com todas as armas.

11. O avatar funciona em desktop.

12. O avatar funciona em mobile.

13. Nenhuma camada fica fora de posição.

14. Nenhuma camada desaparece.

15. Nenhuma camada fica atrás da camada errada.

16. Não existem erros no console durante a customização.

==================================================

35. TESTE DE REGRESSÃO

==================================================

Sempre que alterar o sistema de avatar:

testar novamente:

- criação;

- salvamento;

- carregamento;

- fase 1;

- fase 2;

- fase 3;

- fase 4;

- fase 5.

Sempre que alterar armas:

testar todas as armas.

Sempre que alterar o sistema de fases:

testar todas as fases.

Evitar corrigir um bug criando outro.

==================================================

36. PERFORMANCE

==================================================

O jogo deve ser otimizado.

Evitar:

- vazamento de memória;

- partículas infinitas;

- objetos não destruídos;

- loops desnecessários;

- renderização excessiva;

- assets gigantes;

- criação excessiva de objetos por frame.

Utilizar pooling quando necessário.

Limpar entidades mortas.

Limpar projéteis fora da área.

Limpar partículas expiradas.

==================================================

37. QUALIDADE FINAL

==================================================

Não quero um protótipo.

Quero um jogo curto, mas extremamente polido.

Prioridades:

1. ESTABILIDADE

2. AUSÊNCIA DE BUGS

3. CUSTOMIZAÇÃO DO AVATAR

4. GAMEPLAY

5. CONTROLES

6. PERFORMANCE

7. ARTE

8. ÁUDIO

9. NARRATIVA

10. FINAL

Se tiver que escolher entre adicionar mais funcionalidades ou corrigir uma funcionalidade existente:

CORRIJA PRIMEIRO.

Não adicionar funcionalidades apenas para deixar o projeto maior.

==================================================

38. PRINCÍPIO FINAL

==================================================

O jogo inteiro deve parecer que foi criado especificamente para Luiza.

O avatar dela deve ser o centro da experiência.

Ela deve criar sua personagem.

Ela deve explorar.

Ela deve lutar.

Ela deve encontrar os cinco fragmentos.

Ela deve desbloquear a mensagem.

E então descobrir que toda aquela aventura existia para entregar algo pessoal.

Quero que o resultado final seja algo que ela realmente lembre.

Não quero apenas:

"um site bonito".

Quero:

"um pequeno jogo feito especialmente para mim."

Antes de finalizar, faça uma revisão completa do código, gameplay, UI, responsividade, customização, progressão, áudio e performance.

Não deixe TODOs.

Não deixe placeholders.

Não deixe funcionalidades parcialmente implementadas.

Não considere uma função concluída apenas porque ela funciona no caso mais simples.

Teste também casos extremos e combinações inesperadas.

O objetivo é entregar um projeto funcional, consistente, polido e profissional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1ec2087-c992-4818-ba5b-c375bea8a1c1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
