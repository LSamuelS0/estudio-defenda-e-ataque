# Regras de animação 2D e efeitos em pincel — Defenda e Ataque

Base: os 12 princípios da animação (Thomas & Johnston, *The Illusion of Life*), o processo de pose-chave e intervalos (Williams, *Animator's Survival Kit*) e os princípios físicos dos efeitos (Gilland, *Elemental Magic*; Maressa, *Essential Effects*), estudados nos dois TCCs enviados pelo Lucas. Valem para todos os projetos.

## A. Regras de ouro (sempre)
1. **Sempre em movimento.** Nada fica congelado: o idle respira, o fogo ondula, o brilho cintila. Um efeito parado lê como erro.
2. **Firme no lugar.** O movimento acontece dentro do desenho; a âncora (pé do personagem, base da chama, centro do projétil) não desliza. Deriva da base menor que 2% da largura do quadro.
3. **Sem serrilhado.** Pinceladas macias, borda com 1–2 px de transição de alfa. Desenhar em 2× e reduzir com suavização alta. Bordas duras abaixo de 25% da borda.
4. **Nenhum fundo branco.** Nada de papel, xadrez desenhado ou franja clara (regra já existente).
5. **Loop sem emenda.** O último quadro leva ao primeiro com o mesmo salto dos outros (até 1,6× o salto médio).
6. **Efeito apoia, não compete.** Efeito de ambiente (fogueira, aura, poeira) fica discreto; o destaque é da ação principal.

## B. Princípios aplicados aos personagens
| Princípio | Como aplicar no jogo |
|---|---|
| Comprimir e esticar | Slime achata ao pousar e estica ao saltar, **mantendo o volume** (estica de um lado, encolhe do outro). No mago, só sutil (manto, capuz). |
| Antecipação | Antes de cada ação forte, um movimento contrário curto: o slime se encolhe antes do bote; o mago recua o cajado antes do disparo (2–3 quadros). |
| Encenação | Silhueta clara em toda pose; objetos segurados (cajado) ficam fora da silhueta. |
| Pose a pose + direto | Desenhar primeiro os extremos (poses-chave), depois as passagens; partes soltas (manto, gota, fogo) podem ser feitas "direto" para ficarem orgânicas. |
| Continuação e sobreposição | Partes leves chegam depois: capuz, barra do manto, gotas, cauda de fogo atrasam 1–2 quadros em relação ao corpo. |
| Aceleração e desaceleração | Mais quadros perto dos extremos, menos no meio. Nada começa ou para em velocidade máxima, exceto impactos de propósito. |
| Arcos | Mãos, cabeça, cajado, saltos e projéteis com curva seguem arcos; linha reta só para golpe seco ou raio. |
| Ação secundária | Respiração no idle, balanço do cajado, brilho do cristal. Nunca mais forte que a ação principal. |
| Tempo (timing) | O ritmo mostra peso e humor: pesado = mais lento; ágil = mais rápido. Personagem desenhado: 6–12 fps; partículas de pincel: 24 fps. |
| Exagero | Exagerar o suficiente para ler numa tela pequena e com muitos slimes, sem quebrar o modelo. |
| Desenho volumétrico | Sombra no chão, luz de um lado, nada de lados gêmeos (simetria perfeita) nas poses. |
| Apelo | Formas simples e redondas, rosto expressivo, contorno de tinta. |

## C. Princípios dos efeitos (física simplificada)
- **Energia e força:** todo efeito tem fonte e direção; a energia nasce, chega ao pico e se dissipa (**antecipação → ação → dissipação**). Nada surge ou some de uma vez.
- **Inércia e atrito:** partículas saem rápidas e freiam (arrasto); fumaça perde velocidade e se espalha.
- **Gravidade:** respingos e lascas caem em arco; fumaça, brasas e pó mágico sobem.
- **Trajetória:** caminhos curvos com turbulência; o rastro (cauda) segue a trajetória.
- **Escala e tempo:** efeito pequeno é rápido (0,3–0,6 s); efeito grande é mais lento. Brilho é curto e precisa de leitura imediata (a cruz/estrela de 4 pontas).
- **Forma conforme a direção de arte do jogo:** formas arredondadas e macias (mundo fofo e mágico); tensão e perigo com formas mais pontudas, mas com pontas arredondadas. Contorno de tinta escura nas formas principais, como nos personagens.
- **Camadas:** núcleo claro → corpo → borda escura/contorno → partículas secundárias (brasas, faíscas, poeira) → brilho somado. Espaços vazios dentro da forma deixam a silhueta mais interessante.
- **Paleta:** 3–4 tons por efeito (miolo quase branco, cor principal, borda escura) + brilho; nada de degradê sem pincelada.

## D. Receitas por tipo de efeito
| Efeito | Forma | Movimento | Tempo |
|---|---|---|---|
| Fumaça pequena | bolhas redondas que se abrem | sobe devagar, cresce, some por transparência | 0,6–1,2 s |
| Fumaça de impacto | anel de nuvens a partir do chão | estoura rápido para os lados e freia | 0,3–0,5 s |
| Brilho / pó mágico | estrela de 4 pontas + pontos redondos | cresce rápido, gira de leve, some | 0,2–0,8 s |
| Raio | linha quebrada, espessura irregular, pontas arredondadas | aparece inteiro, pisca 2–3 vezes | 0,1–0,3 s |
| Fogo | línguas pontudas em camadas (vermelho › laranja › amarelo › branco) | ondula no lugar, pontas se soltam e sobem | loop 1–1,5 s |
| Líquido (splash) | coroa de gotas com contorno | sobe em leque, cai com gravidade | 0,3–0,6 s |

## E. Processo de trabalho
1. **Referência e esboço** (sketches) → escolher a forma que conversa com a arte do jogo.
2. **Quadro-guia** (style frame): cor, contorno, transparência.
3. **Poses-chave**, depois intervalos; checar com **casca de cebola** (anterior/próximo).
4. **Conferir na Biblioteca do Estúdio** (`tools/estudio/index.html` → Biblioteca): serrilhado, firmeza, emenda, ritmo, fundo branco, volume.
5. **Exportar** pelo Estúdio (2× com suavização) para `efeitos/` ou `slimes/`, testar no jogo e ajustar o tempo.

## F. Números de referência
- Deriva da âncora: < 2% da largura do quadro.
- Bordas duras: < 25% da borda.
- Emenda do loop: salto ≤ 1,6× o salto médio.
- Pulso de tamanho de efeito contínuo: < 45%.
- Fps: desenho à mão 6–12; partículas de pincel 24.
- Brilho de luz no chão: pulso de no máximo ±5%.
