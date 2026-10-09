# 003 · Assinatura Miguel · Creative ZONE

Assinatura horizontal reconstruída como composição multicamadas para o fórum Creative ZONE. A versão 2.0 usa um **atlas WebP transparente** e um roteiro de animação em **JSON**, executado pela Web Animations API no navegador.

## Demonstração permanente

- [▶ RawGitHack · branch main](https://raw.githack.com/Creatiive-Lab/Anima-pack/main/animations/miguel-signature/index.html)
- [▶ HTML Preview](https://htmlpreview.github.io/?https://github.com/Creatiive-Lab/Anima-pack/blob/main/animations/miguel-signature/index.html)

O primeiro endereço acompanha a versão publicada na `main`. Para uso offline, baixe esta pasta e abra `index.html` por um servidor HTTP local; navegadores podem bloquear `fetch()` de JSON quando o arquivo é aberto diretamente por `file://`.

## Arquitetura

`animation.json` é a fonte de verdade. Ele define canvas, atlas, recortes, ordem Z, parallax, blend mode, duração, delay, easing e keyframes de cada elemento. `player.js` lê o JSON e instancia as animações via Web Animations API.

### Camadas independentes

- Estrutura metálica.
- Terminal CZ esquerdo.
- Terminal/engrenagem direito.
- Barra superior.
- Quatro regiões independentes do menu: VIP, Anuncie, Downloads e Destaques.
- Logo Miguel.
- CreativeZone.
- Coroa.
- Personagem esquerdo.
- Personagem direito.
- Energia esquerda, central e direita.
- Partículas, scanlines e sweep luminoso procedurais.

Cada camada possui timing e comportamento próprios. Os personagens flutuam com amplitudes diferentes; os terminais oscilam em direções opostas; menu, coroa, logotipo e subtítulo têm ciclos independentes; as três zonas de energia usam frequências diferentes; o ponteiro adiciona parallax separado por elemento.

## Arquivos

- `index.html` — demonstração e controles.
- `styles.css` — layout e efeitos procedurais.
- `player.js` — engine JSON → Web Animations API.
- `animation.json` — roteiro avançado da animação.
- `animation-manifest.json` — metadados do Anima Pack.
- `assets/atlas.webp` — atlas transparente com os elementos reconstruídos.

## Integração

A forma mais simples é incorporar o `index.html` em um `iframe` responsivo. Para integração nativa no fórum, use `player.js`, `animation.json` e o atlas dentro do componente de assinatura. O canvas lógico é `2172 × 724` (3:1); o player escala mantendo a proporção.

A animação respeita `prefers-reduced-motion`, pausa quando a aba fica oculta e oferece controle de velocidade/camadas na demo.