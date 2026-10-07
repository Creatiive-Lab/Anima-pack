# 002 · Beta ZONE · Founder Edition

Moldura quadrada e limitada da **Creative ZONE**, criada para identificar os primeiros membros que entraram na comunidade durante a fase Beta. O centro e o exterior permanecem transparentes para integração direta sobre o avatar.

## Ver a animação

[▶ Ver animação ao vivo](https://raw.githack.com/Creatiive-Lab/Anima-pack/main/animations/beta-zone-frame/index.html)

A demonstração é servida por um endereço estável ligado à branch `main` e permite carregar uma foto local, alternar o fundo, testar a moldura em 180 px e 96 px, pausar, reiniciar e mudar a velocidade. A foto escolhida nunca é enviada para um servidor.

## Animações implementadas

- **Estrutura principal:** respiração luminosa e varredura de energia pelas placas da moldura.
- **Cristais e fragmentos:** flutuação suave, brilho variável e partículas vermelhas/douradas.
- **CZ superior:** flutuação sutil e pulso especial durante o ciclo de destaque.
- **Ícones laterais:** software, automação, IA, infraestrutura, negócios, comunidade e games acendem em sequência.
- **BETA ZONE:** pulso de brilho e faixa metálica atravessando o título.
- **Founder Edition:** flutuação curta, brilho dourado e reflexo periódico no selo.
- **Mascote oficial:** movimento de respiração quase imperceptível e reflexo de luz passando pela região superior do personagem.
- **Partículas:** centelhas independentes com tempos diferentes para criar profundidade.

O ciclo de destaque principal dura aproximadamente **7,2 segundos**. Os movimentos de idle usam durações diferentes para evitar uma aparência mecânica e repetitiva.

## Camadas

A arte raster principal foi separada nas três camadas que precisam preservar exatamente o desenho original:

- `assets/base-frame.webp` — estrutura metálica quadrada.
- `assets/mascot.webp` — mascote oficial da Creative ZONE.
- `assets/cz-emblem.webp` — emblema CZ superior.

Os demais elementos são camadas independentes desenhadas diretamente em HTML/CSS/SVG: sete ícones temáticos, título BETA ZONE, selo Founder Edition, cristais, órbita, energia e partículas. Isso permite animar cada peça individualmente sem dependências externas.

A demonstração é feita com HTML/CSS/JavaScript puro, sem bibliotecas ou CDNs. O navegador aplica `prefers-reduced-motion` e os controles permitem que o usuário inicie a animação explicitamente.

## Integração no fórum

A implementação de demonstração usa camadas absolutas sobre o avatar. Para produção, mantenha o contêiner em `position: relative`, o avatar atrás das camadas e `pointer-events: none` nos elementos decorativos. Como cada asset está separado, o fórum pode reduzir ou desativar animações específicas sem trocar a arte completa.

> Esta é uma edição de acesso antecipado. A distribuição da moldura deve permanecer restrita às regras definidas pela Creative ZONE para membros Beta/Founder.