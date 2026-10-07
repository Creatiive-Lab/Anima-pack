# Anima Pack

Coleção de animações da Creative Lab, desenvolvida por Israel Miguel. Cada animação fica em uma pasta independente.

| ID | Animação | Demonstração |
|---|---|---|
| 001 | Moldura CreativeZone | [Abrir HTML](animations/creativezone-frame/index.html) |

Baixe o repositório e abra `index.html` no navegador. O visualizador de código do GitHub não executa HTML. A demonstração da moldura também funciona sozinha, offline.

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

Os arquivos estão preparados para hospedagem estática, incluindo GitHub Pages. Quando a coleção estiver hospedada, cada arte será acessível pelo caminho `animations/<nome-da-arte>/`. A página de código do GitHub não executa a demonstração; salvar os arquivos no repositório, por si só, não ativa a hospedagem.
