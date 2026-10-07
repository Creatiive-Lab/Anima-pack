# Anima Pack

Coleção de animações da Creative Lab, desenvolvida por Israel Miguel. Cada animação fica em uma pasta independente.

| ID | Animação | Demonstração |
|---|---|---|
| 001 | Moldura CreativeZone | [▶ Ver animação ao vivo](https://htmlpreview.github.io/?https://github.com/Inosuke-Company/Anima-pack/blob/main/animations/creativezone-frame/index.html) |

Clique em **Ver animação ao vivo** para abrir a demonstração pelo HTML Preview. A página carrega o HTML público deste repositório e o exibe no navegador, sem download. Como alternativa offline, baixe a pasta e abra `index.html`.

[Documentação da moldura](animations/creativezone-frame/README.md).

Para novas animações: use `animations/<nome>/` e acrescente uma entrada aqui e na página inicial.

## Padrão obrigatório para cada nova arte

Toda animação deve ter sua própria pasta em `animations/<nome-da-arte>/`, contendo:

- `index.html`: demonstração funcional da arte, com animação e controles, adequada para computador e celular.
- Arquivo da animação e recursos necessários, mantidos dentro da mesma pasta.
- `README.md`: identificação da arte, instruções de uso e integração.
- `animation-manifest.json`: nome, identificador e caminho da demonstração.

A demonstração deve permitir visualizar a animação sem instalar ferramentas. Sempre que possível, manter o HTML autossuficiente para também funcionar ao ser baixado e aberto diretamente no navegador. Referências a recursos externos à página devem usar caminhos relativos.

O `index.html` da raiz é o catálogo da coleção e deve apontar para o `index.html` de cada arte. Acrescente cada nova animação ao catálogo e à tabela deste documento. Preserve as demonstrações das artes existentes.

A moldura CreativeZone é a primeira implementação desse padrão:
`animations/creativezone-frame/index.html`.

## Visualização na web

Os links **Ver animação ao vivo** usam o serviço externo HTML Preview para renderizar os arquivos públicos da branch `main`. Esse serviço não é o GitHub Pages, que permanece desativado. A disponibilidade da prévia depende do serviço e do acesso ao repositório.

Para cada nova arte, o link de demonstração no README deve usar uma URL de página publicada ou o formato `https://htmlpreview.github.io/?https://github.com/Inosuke-Company/Anima-pack/blob/main/animations/<nome-da-arte>/index.html`. Não use um link relativo para o HTML nessa coluna, pois o GitHub abrirá o código. Os links relativos dentro das próprias páginas continuam adequados para hospedagem estática.
