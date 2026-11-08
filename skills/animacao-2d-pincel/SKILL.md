---
name: "animacao-2d-pincel"
description: "Use ao criar, revisar ou melhorar animações 2D de personagens e efeitos visuais em pincelada (sprites, spritesheets, partículas, fogo, brilho, fumaça, impacto) para jogos."
---

# Animação 2D de personagens e efeitos em pincel

Estilo: desenho à mão, contorno de tinta escura, cores chapadas, efeitos em pinceladas macias. Animações leves e suaves, **sempre em movimento** e **nunca serrilhadas**. Base: 12 princípios da animação (Thomas & Johnston), processo pose-chave + intervalos (Williams) e física simplificada dos efeitos (Gilland, *Elemental Magic*; Maressa, *Essential Effects*).

## Regras de ouro (sempre conferir)
1. **Sempre em movimento:** nada congelado. Idle respira; fogo ondula; brilho cintila.
2. **Firme no lugar:** o movimento acontece dentro do desenho; a âncora (pé, base da chama, centro do projétil) não desliza. Meta: deriva da base < 2% da largura do quadro.
3. **Sem serrilhado:** borda com 1–2 px de transição de alfa; desenhar em 2× e reduzir com suavização alta. Meta: bordas duras < 25% da borda.
4. **Nenhum fundo branco:** sem papel, xadrez desenhado, franja clara ou buracos de papel dentro do desenho. Conferir em fundo escuro.
5. **Loop sem emenda:** salto último→primeiro quadro ≤ 1,6× o salto médio entre quadros.
6. **Efeito apoia, não compete:** efeito de ambiente discreto; destaque para a ação principal.

## Personagens — os 12 princípios na prática
- **Comprimir e esticar** mantendo o volume (o que estica de um lado encolhe do outro).
- **Antecipação** de 2–3 quadros no sentido contrário antes de toda ação forte (bote, disparo, pulo).
- **Encenação:** silhueta legível; objetos segurados fora da silhueta.
- **Pose a pose** para o corpo (extremos primeiro, depois intervalos) + **direto** para partes soltas (manto, gotas, fogo).
- **Continuação/sobreposição:** partes leves (capuz, barra do manto, cauda) atrasam 1–2 quadros.
- **Aceleração/desaceleração:** mais quadros perto dos extremos; nada começa ou para em velocidade máxima (exceto impacto proposital).
- **Arcos** em mãos, cabeça, saltos e projéteis curvos; linha reta só para golpe seco ou raio.
- **Ação secundária** (respirar, balanço do cajado, brilho do cristal) sem competir.
- **Timing:** pesado = lento, leve/ansioso = rápido. Desenho à mão 6–12 fps; partículas de pincel 24 fps.
- **Exagero** suficiente para ler pequeno na tela; **volume** (sombra no chão, luz de um lado, sem lados gêmeos); **apelo** (formas simples e redondas).

## Efeitos — física simplificada
- Ciclo de energia: **antecipação → ação/pico → dissipação**. Nada surge ou some de uma vez.
- **Inércia e atrito:** partículas saem rápidas e freiam (arrasto). **Gravidade:** respingos e lascas caem em arco; fumaça, brasas e pó mágico sobem.
- **Trajetória curva** com turbulência; a cauda segue a trajetória.
- **Escala ↔ tempo:** pequeno = rápido (0,3–0,6 s); grande = lento.
- **Forma conforme a direção de arte:** mundo fofo → formas redondas; perigo → pontas, mas arredondadas na ponta. Contorno de tinta nas formas principais. Espaços vazios deixam a silhueta mais interessante.
- **Camadas:** núcleo quase branco → cor principal → borda escura/contorno → secundárias (brasas, faíscas, poeira) → brilho somado (lighter/add). Paleta de 3–4 tons por efeito.

## Receitas
| Efeito | Forma | Movimento | Tempo |
|---|---|---|---|
| Fumaça pequena | bolhas redondas | sobe devagar, cresce, some por transparência | 0,6–1,2 s |
| Fumaça de impacto | anel de nuvens no chão | estoura para os lados e freia | 0,3–0,5 s |
| Brilho / pó mágico | estrela de 4 pontas + pontos redondos | cresce rápido, gira de leve, some | 0,2–0,8 s |
| Raio | linha quebrada, espessura irregular, pontas arredondadas | aparece inteiro, pisca 2–3× | 0,1–0,3 s |
| Fogo | línguas pontudas em camadas (vermelho › laranja › amarelo › branco) | ondula no lugar, pontas se soltam e sobem | loop 1–1,5 s |
| Líquido | coroa de gotas com contorno | leque para cima, cai com gravidade | 0,3–0,6 s |

## Processo
1. Referência e vários esboços de forma → escolher o que combina com a arte do jogo.
2. Quadro-guia: cor, contorno, transparência.
3. Poses-chave, depois intervalos; conferir com casca de cebola (anterior em vermelho, próximo em verde).
4. Exportar spritesheet + JSON (quadros, colunas, largura/altura do quadro, fps, pivo_px, loop ou faixas acender/loop/apagar, unico para rajadas).
5. Conferir: serrilhado, firmeza, emenda, ritmo (gráfico de velocidade do centro sem picos isolados), fundo branco, volume. No projeto Defenda e Ataque, a **Linha de produção** e a tela do personagem do Estúdio (`app/`) conferem tudo isso sozinhas; sem tela, use `node app/cli/estudio.js conferir folha.png LQ AQ quadros`. A aba **Biblioteca** antiga fica em `app/ferramentas/biblioteca.html`.
6. Recortes de referência com fundo preto: alinhar todos os quadros pelo mesmo ponto de apoio e travar a base antes de exportar.

## Técnicas que funcionam
- Partículas com trajetória pré-calculada e nascimento em horários fixos do loop → loop perfeito.
- Fitas de pincel que afinam na ponta, com fiozinhos de cerda; contorno em duas passadas (uma firme, uma tremida e transparente).
- Rajada única: tudo nasce nos primeiros ~0,12 s e o tempo total é maior que a vida das partículas.
- Transição entre quadros desenhados: misturar o quadro atual com o próximo (crossfade) e manter o fps baixo para efeitos de ambiente.
- Som de efeito contínuo: emendar variações com crossfade de potência constante e fechar o fim no começo.
## Arquivos de apoio (nesta pasta)
- `regras-animacao-efeitos.md`: regras completas do projeto (12 princípios, física dos efeitos, receitas, números de referência).
- `suavizar_bordas.py`: mede e corrige serrilhado de spritesheets (`python suavizar_bordas.py medir folha.png LQ AQ colunas quadros` / `corrigir entrada.png saida.png LQ AQ colunas quadros`).

## Uso junto com outras skills
- **character-equipment-replacement**: ao animar personagens com roupas, capa ou cajado, siga também as regras de slots, máscaras, âncoras, sorting e deformação por material daquela skill. Ela decide *o que* cobre *o quê*; esta skill decide *como* se move (timing, arcos, antecipação, continuação) e *como* fica o traço (pincel macio, sem serrilhado, sem fundo branco).
- Em caso de conflito: segurança e integridade do projeto primeiro; depois a direção de arte desta skill; registre a divergência.
