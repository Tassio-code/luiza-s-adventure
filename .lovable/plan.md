# Jogo móvel sempre horizontal

## Alterações
- Trocar a orientação instalada do jogo de vertical para horizontal.
- Aplicar o bloqueio de orientação horizontal em toda a experiência, não apenas durante as fases.
- Exibir uma tela simples para girar o celular quando o navegador impedir o bloqueio automático.
- Remover o modo vertical dos controles da fase e manter apenas a disposição horizontal.
- Ajustar criador, mapa e sequências finais para aproveitarem telas celulares horizontais sem cortes.

## Validação
- Conferir o fluxo em uma resolução de celular horizontal.
- Verificar compilação e ausência de sobreposições nos controles.

## Detalhes técnicos
- Usar a Screen Orientation API quando disponível, com fallback visual para navegadores que não permitem travar a tela.
- Usar altura dinâmica da tela e áreas seguras para celulares com recortes.
