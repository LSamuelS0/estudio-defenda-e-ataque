# Auditoria técnica inicial — 05/11/2026

## Veredito
O projeto é uma boa base de protótipo e vale a pena evoluir. **Não recomendo recomeçar do zero.** Já existem ferramentas especializadas, renderização em canvas, controles de animação, edição de equipamento, efeitos e exportação. O próximo passo é transformar módulos isolados em um aplicativo integrado, com dados compartilhados e interface consistente.

Auditoria estática: arquivos, caminhos e estruturas foram inspecionados; os blocos JavaScript inline passaram na verificação sintática com Node.js. Ainda não é um teste completo de interação no navegador.

## Inventário
- `index.html`: painel inicial e navegação.
- `mago.html`: animador de sprites do personagem.
- `slimes.html`: editor/animador de slimes elementais.
- `efeitos.html`: gerador de efeitos em pincel.
- `movimento.html`: estudo de ciclos de movimento.
- `biblioteca.html`: visualização e análise de animações.
- `movimento/`: 8 PNGs e 2 JSON do mago em quatro direções.

## Pontos fortes
- **Mago:** trilhas/chaves, poses, interpolação, duração, repetição, FPS, equipamento, peças personalizadas, ossos/canais, efeitos e exportação PNG/JSON. Há persistência local via `localStorage`.
- **Slimes:** ações e elementos distintos, renderização em canvas com camadas/efeitos, controles de velocidade/FPS e exportação PNG/JSON/ZIP.
- **Efeitos:** geradores de fogo, água, ar, terra, arcano, fogueira e pó mágico, com paletas, fundos e exportação.
- **Biblioteca/movimento:** palco, gráficos, reprodução, fundos, pivô, caixa do quadro, casca de cebola e ciclos do mago.

## Lacunas e riscos

### Prioridade alta
1. **HTMLs muito concentrados:** `mago.html` e `slimes.html` misturam estrutura, estilo, lógica, dados e renderização. Isso dificulta manutenção.
2. **Módulos isolados:** ainda não há camada central clara para personagem, equipamento, animações, partículas e biblioteca compartilharem dados.
3. **Salvamento desigual:** o mago persiste parte do estado no `localStorage`; os demais módulos não apresentam o mesmo fluxo de projeto/sessão.
4. **Execução por `file://`:** `movimento.html` usa `fetch()` para ler JSON e PNGs locais. Navegadores podem bloquear essas leituras quando a página é aberta diretamente do disco. O servidor local incluído nesta versão resolve esse caso.

### Prioridade média
5. **Status do personagem:** falta painel integrado para atributos, slots, peças equipadas, animação e efeitos ativos.
6. **Equipamento modular:** padronizar slot, camada, ponto de encaixe, ordem de desenho, escala, rotação, espelhamento, offsets por direção/pose e compatibilidade.
7. **Partículas:** os geradores atuais são especializados; falta interface comum para emissores, partículas, curvas, forças, duração, cor, tamanho e opacidade.
8. **Formato de projeto:** precisamos de arquivo portátil que reúna personagem, equipamentos, animações, efeitos e referências, sem depender apenas do armazenamento do navegador.

## Verificações
- 6 páginas HTML.
- 8 imagens PNG e 2 JSON na pasta `movimento/`.
- Todos os blocos JavaScript inline passaram em `node --check`.
- Nenhum ID HTML duplicado foi encontrado nas páginas analisadas.
- Algumas fontes/bibliotecas vêm de CDN e podem exigir internet.

## Decisão
Preservar os seis módulos e evoluir por etapas, validando cada mudança. Primeiro: base comum e fluxo de projeto. Depois: personagem, status e equipamento modular. Por fim: partículas, biblioteca e exportação.

**Nenhum módulo original foi apagado ou substituído nesta etapa.**
