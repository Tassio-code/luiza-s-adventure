# Transições musicais e encerramento sincronizado

## Objetivo
Suavizar as trocas entre a música das fases e a música do mapa, sem adicionar uma faixa de vitória, e manter a música final até seu término natural.

## Alterações
1. Adicionar transição gradual de volume ao trocar entre músicas, evitando cortes secos ao pausar, sair da fase ou retornar ao mapa.
2. Ao conquistar o quinto fragmento, reduzir suavemente a música da última fase antes de iniciar a música do pergaminho.
3. Manter a música do pergaminho tocando durante toda a carta e na tela “Feliz Aniversário”.
4. Depois da leitura, deixar “Feliz Aniversário” parado na tela até a música terminar; somente então mostrar a opção de voltar ao mapa.
5. Preservar músicas, efeitos, fases, combate e demais elementos atuais.

## Validação
- Conferir as transições fase → mapa, fase → pausa → fase e última fase → pergaminho.
- Confirmar que a música final não reinicia ao mudar da carta para “Feliz Aniversário”.
- Confirmar que não é possível voltar ao mapa antes do fim da música.
- Executar os testes e a verificação de tipos existentes.
