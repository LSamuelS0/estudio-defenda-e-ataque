---
name: "animacao-2d-pincel"
description: "Use ao criar, revisar ou melhorar personagens, animações, sprites, spritesheets, equipamentos (roupas, armaduras, armas, capas), rig/landmarks e efeitos 2D em pincelada (fogo, brilho, fumaça, impacto, partículas) para jogos, em especial o Defenda e Ataque."
---

# Arte, animação e equipamentos 2D em pincel — skill única do Defenda e Ataque

Skill única do projeto (junta a antiga `animacao-2d-pincel`, as regras de animação e efeitos e a `character-equipment-replacement`). É um documento vivo: toda lição nova entra na seção 14 e, se virar regra, sobe para a seção certa.

Base: 12 princípios da animação (Thomas & Johnston, *The Illusion of Life*), pose-chave + intervalos (Williams, *Animator's Survival Kit*), física simplificada dos efeitos (Gilland, *Elemental Magic*; Maressa, *Essential Effects*) e substituição modular de equipamentos por região do corpo.

## 1. Missão e estilo
- RPG/roguelike medieval de fantasia 2D, **desenhado à mão**, contorno de tinta escura, cores chapadas, efeitos em pinceladas macias. Nada plástico, realista demais ou genérico.
- Animações leves e suaves, **sempre em movimento**, **nunca serrilhadas**, **nunca com fundo branco**.
- O personagem tem que parecer **uma ilustração única e contínua**: ninguém pode perceber que foi montado com peças, máscaras ou ossos.
- Personagem inicial: Mago — rosto humano normal sem o capuz; com o capuz encantado, rosto escuro e olhos brancos; cajado com cristal. Criaturas: slimes elementais hoje; ents e dragões no futuro.

## 2. Regras de ouro (conferir sempre) e números
| Regra | Meta medida |
|---|---|
| Sempre em movimento (idle respira, fogo ondula, brilho cintila) | nenhum quadro repetido |
| Firme no lugar: a âncora (pé, base da chama, centro do projétil) não desliza | deriva < 2% da largura do quadro |
| Sem serrilhado: borda com 1–2 px de transição de alfa; desenhar em 2× e reduzir com suavização alta | bordas duras < 25% da borda |
| Nenhum fundo branco: sem papel, xadrez desenhado, franja clara, **frestas de papel** entre partes (cajado/manto, braço/corpo) | franja clara < 2%; zero manchas brancas soltas |
| **Sem sombra no chão no sprite**: a sombra é desenhada pelo jogo | nenhum cinza solto sob os pés |
| Loop sem emenda | salto último→primeiro ≤ 1,6× o salto médio |
| Ritmo sem tranco: nenhum pico isolado (aceleração/desaceleração suave é permitida) | nenhum salto ≥ 2,5× a média dos dois vizinhos |
| Volume estável | personagem < 15% de variação de área; efeito contínuo < 45% |
| Efeito apoia, não compete | efeito de ambiente discreto; brilho no chão ±5% no máximo |

Conferir sempre em **fundo escuro e em fundo claro** (o claro denuncia franja branca, o escuro denuncia frestas de papel).

## 3. Personagens — os 12 princípios na prática
| Princípio | Como aplicar |
|---|---|
| Comprimir e esticar | Slime achata ao pousar e estica ao saltar **mantendo o volume**. No mago, só sutil (manto, capuz). |
| Antecipação | 2–3 quadros no sentido contrário antes de toda ação forte: slime encolhe antes do bote; mago recua o cajado antes do disparo. |
| Encenação | Silhueta legível em toda pose; objeto segurado (cajado) fora da silhueta. |
| Pose a pose + direto | Extremos primeiro, depois intervalos; partes soltas (manto, gota, fogo) "direto" para ficarem orgânicas. |
| Continuação e sobreposição | Capuz, barra do manto, cauda, gotas atrasam 1–2 quadros em relação ao corpo. |
| Aceleração/desaceleração | Mais quadros perto dos extremos; nada começa/para em velocidade máxima, exceto impacto proposital. |
| Arcos | Mãos, cabeça, cajado, saltos e projéteis curvos seguem arcos; linha reta só para golpe seco ou raio. |
| Ação secundária | Respiração, balanço do cajado, brilho do cristal — nunca mais forte que a ação principal. |
| Timing | Pesado = lento; leve/ansioso = rápido (ver seção 4). |
| Exagero | O suficiente para ler pequeno na tela com muitos slimes, sem quebrar o modelo. |
| Volume | Sombra no chão, luz de um lado, nada de lados gêmeos (simetria perfeita). |
| Apelo | Formas simples e redondas, rosto expressivo, contorno de tinta. |

## 4. Quadros, fps e ritmo (decisões de 08/11/2026)
- **Padrão do projeto: 30 quadros por ciclo** (o mais fluido nos testes). 6 quadros ficam rápidos e travados; 12 é o mínimo aceitável.
- Caminhada: ciclo de ~1 s. Quadros **desenhados** (poses-chave): 6–8 por ciclo (contato, passagem, extremos); o resto são **intervalos**.
- Intervalos automáticos (Estúdio: fluxo óptico) só entre poses parecidas; onde a pose muda muito (perna que cruza, cajado que gira), **desenhar o quadro**. Nunca mistura simples (crossfade) em personagem: dá contorno duplo.
- Idle (respiração): 30 quadros em ~3 s, loop perfeito, pé fixo.
- Caminhada no jogo é guiada pela distância: o JSON traz `distancia_ciclo_px` (padrão 120) e o jogo avança 1 quadro a cada `distancia_ciclo_px / quadros` (120/30 = 4 px).
- Partículas e efeitos de pincel: 24–30 fps. Efeito de ambiente desenhado: fps baixo + crossfade entre quadros desenhados (efeito pode, personagem não).

### 4.1 Animação procedural por etapas (regra do Lucas)
- Divida o ciclo em **etapas iguais**: 30 quadros = **5 etapas de 6**. Ex.: 1–6 mão vai à frente; 7–12 volta ao meio; 13–18 vai para trás; 19–24 volta; 25–30 descansa.
- Cada etapa tem **pose de chegada (chave)**; dentro dela o movimento acelera e freia (slow in / slow out).
- **Cada quadro parte do quadro anterior** e soma só o pedaço novo do movimento. Dentro de uma etapa a parte anda sempre no mesmo sentido — **nunca volta** (a mão não pode ir e voltar de repente). O Estúdio confere isso (`conferirTrilha`).
- **Camadas, nesta ordem**: mão → peça rígida presa nela (cajado anda e gira junto, sem entortar) → braço (deformação suave: punho ~85%, cotovelo ~45% do movimento) → roupa com **atraso** de 1–2 quadros (continuação).
- O gesto roda **por cima do idle** (o corpo continua respirando), então nada fica congelado na etapa de descanso.
- Escolha o gesto pelo **sentimento**: calmo (pequeno, lento), confiante (ergue o cajado), cansado (o cajado pesa). Estúdio: aba Adição → "Gesto por etapas" (`animarSegmentos`, gestos em `GESTOS`).
- Ao tirar a peça rígida do lugar, o buraco por dentro do corpo é tapado com a cor do vizinho; a haste inteira (inclusive contorno de tinta) sai junto — **não pode sobrar pedaço do cajado no lugar antigo**.

## 5. Efeitos — física simplificada
- Ciclo de energia: **antecipação → ação/pico → dissipação**. Nada surge ou some de uma vez.
- Inércia e atrito: partículas saem rápidas e freiam. Gravidade: respingos e lascas caem em arco; fumaça, brasas e pó mágico sobem.
- Trajetória curva com turbulência; a cauda segue a trajetória.
- Escala ↔ tempo: pequeno = rápido (0,3–0,6 s); grande = lento. Brilho curto, leitura imediata (estrela de 4 pontas).
- Forma: mundo fofo → redondo; perigo → pontas, mas arredondadas. Contorno de tinta nas formas principais; espaços vazios dentro da forma.
- Camadas: núcleo quase branco → cor principal → borda escura → secundárias (brasas, faíscas, poeira) → brilho somado (add). Paleta de 3–4 tons + brilho; nada de degradê sem pincelada.

| Efeito | Forma | Movimento | Tempo |
|---|---|---|---|
| Fumaça pequena | bolhas redondas que se abrem | sobe devagar, cresce, some por transparência | 0,6–1,2 s |
| Fumaça de impacto | anel de nuvens no chão | estoura para os lados e freia | 0,3–0,5 s |
| Brilho / pó mágico | estrela de 4 pontas + pontos redondos | cresce rápido, gira de leve, some | 0,2–0,8 s |
| Raio | linha quebrada, espessura irregular, pontas arredondadas | aparece inteiro, pisca 2–3× | 0,1–0,3 s |
| Fogo | línguas pontudas em camadas (vermelho › laranja › amarelo › branco) | ondula no lugar, pontas se soltam e sobem | loop 1–1,5 s |
| Líquido | coroa de gotas com contorno | leque para cima, cai com gravidade | 0,3–0,6 s |

Técnicas que funcionam: partículas com trajetória pré-calculada e nascimento em horários fixos (loop perfeito); fitas de pincel que afinam na ponta com fiozinhos de cerda; contorno em duas passadas (firme + tremida transparente); rajada única com tudo nascendo nos primeiros ~0,12 s; som contínuo com crossfade de potência constante.

## 6. Corpo-base, vistas e rig
- **Vistas mínimas**: frente, costas, perfil esquerdo, perfil direito — mesma altura, escala, proporção, iluminação e pose neutra comparável. 3/4 complementa, não substitui.
- **Não espelhar automaticamente** se houver assimetria, arma numa mão, detalhe lateral ou luz de um lado.
- **Landmarks** (por vista e por quadro): topo e centro da cabeça, base do pescoço, ombros, cotovelos, punhos, mão da arma, centro do peito, cintura, quadril, joelhos, tornozelos, apoios dos pés. Hierarquia: Raiz → Quadril → Cintura → Tronco → Pescoço → Cabeça; Tronco → Ombro → Cotovelo → Punho → Mão; Quadril → Joelho → Tornozelo → Pé.
- Guia de proporção do corpo-base humano: cabeça 15%, tronco 30%, braços 25%, pernas 30% (personagens chibi/encapuzados têm cabeça maior — medir no desenho real).
- Coordenadas em pixels do quadro (ou normalizadas 0–1), **sempre com a resolução de referência**. Não misturar sistemas.
- A IA/Estúdio pode **propor** landmarks pela silhueta; uma pessoa **revisa**. Cotovelos e punhos quase sempre precisam de correção. Nunca inventar anatomia escondida pela perspectiva.
- **Prancha conceitual não é spritesheet** e mapa esquemático não é coordenada calibrada.

## 7. Equipamentos (roupas, armaduras, armas, capas)
### 7.1 Antes de encaixar uma peça, definir
slot · regiões cobertas · regiões que continuam visíveis · âncoras/pivôs · o que do corpo fica oculto · ordem de desenho em cada direção · comportamento em cada animação · compatibilidade com peças vizinhas.

Slots humanoides: `head`, `neck`, `shoulders`, `chest`, `back`, `upper_arms`, `forearms`, `hands`, `waist`, `legs`, `feet`, `main_hand`, `off_hand`, `accessories`. Criaturas: `pele`, `carapaca`, `ornamento`, `accessories`. Item em mais de um slot: declarar.

### 7.2 Contrato do item (ver `equipment_resource.schema.json`)
`id`, `name`, `slot`, `compatible_archetypes`, `coverage_regions`, `anchors` (âncora + ponto de mira), `draw_order` por direção, `body_mask`/ocultar corpo, `deformation_profile`, `directional_assets` (frente/costas/esquerda/direita), ajustes por direção (ponto de pega, ângulo, escala, frente/atrás), `animation_overrides`, `validation_status` (`draft` → `needs_review` → `validated` → `production`).

### 7.3 Ocultar, não apagar
O corpo-base nunca é editado. Pipeline: corpo + skin → itens dos slots → assets da direção → transformação pelas âncoras → máscara só onde cobre → desenhar na ordem → detalhes da frente → validar. Trocar item no mesmo slot remove o anterior e a máscara dele.

**Nunca equipar um slot que já está pintado no desenho do personagem** (ex.: o mago v2 já tem capuz, manto, calça, botas e cajado no próprio desenho): o resultado é peça duplicada — dois cajados, um na frente do outro. Roupa trocável exige o **corpo-base** com folhas próprias. O Estúdio marca esses slots (`slotsNoDesenho`) e não equipa por padrão.

### 7.4 Junções invisíveis
Sobreposição escondida nas junções; peça de trás passa por baixo da da frente; sem bordas coincidentes, contorno duplicado, frestas transparentes ou interseções de pele/roupa/armadura. Revisar ombro, cotovelo, punho, pescoço, quadril, joelho, tornozelo — **em movimento**.

### 7.5 Deformação por material
| Peça | Regra |
|---|---|
| Corpo | flexível, dentro do desenho |
| Tecido justo | moderada, acompanha o corpo |
| Túnica/roupa solta | ossos secundários, balanço |
| Capa/manto | flexível com atraso (continuação) |
| Couro rígido / placas | baixa deformação, preservar volume, preferir girar e mover |
| Ombreira | gira pela âncora do ombro sem amassar |
| Capacete | rígido, acompanha a cabeça |
| Botas | preservar volume, acompanhar tornozelo e pé, contato com o chão |
| Cajado/arma | **rígido**, alinhado ao ponto de pega |

Não usar escala como solução universal (pulsa e muda volume): corrigir primeiro âncora, pivô, perspectiva, ordem e máscara.

### 7.6 Ordem de desenho (configurável por direção e animação)
capa traseira e acessórios distantes → membros do lado distante → corpo e roupa-base → peças do tronco → membros do lado próximo → mãos e item empunhado → capa frontal e detalhes → efeitos.

## 8. Arquétipos e animações
Identificar o arquétipo antes de escolher animações; nunca forçar rig humanoide em criatura.

| Arquétipo | Locomoção | Ataques/ações | Equipamento |
|---|---|---|---|
| Humanoide | idle, walk, run, turn, hit, death | desarmado, armas, magia | slots humanoides |
| Mago com cajado | idle segurando cajado, walk/run | golpe com cajado, preparação, conjuração (1 ou 2 mãos), lançamento, canalização, recuperação | cajado, veste, capa |
| Armadura pesada | idle reduzido, walk pesado, run limitado | antecipação e recuperação marcadas | placas rígidas |
| Capa/manto | walk/run com atraso do tecido, giro com inércia | conjuração com reação do tecido | tecido |
| Slime | pulsar, squash/stretch, impulso, pouso | pancada, cuspe (preparação → emissão → projétil → recuperação) | carapaça rígida ancorada, skin |
| Quadrúpede | walk, trot/gallop, turn | mordida, garra, investida | slots próprios |
| Ent | passos pesados, idle de galhos | galho, golpe no chão (antecipação longa) | casca, folhas |
| Dragão | walk, decolagem, voo, pouso | mordida, garra, cauda, sopro | rig próprio |

Referência inicial de quadros (ajustar ao peso e ao estilo): idle 30 (~3 s) · caminhada 30/ciclo · corrida 30/ciclo · gesto 30 (5 etapas de 6) · ataque 7–8 desenhados · conjuração 10 · magia em área 12 · impacto 4 · morte 8.

## 9. Direções, arquivos e formato para o Godot
- Direções: `frente`, `costas`, `esquerda`, `direita` (no Godot). Nomes: `<personagem>_<animacao>_<direcao>.png` + `<personagem>_<animacao>.json`.
- JSON: `quadros`, `colunas`, `largura_quadro`, `altura_quadro`, `pivo_px` (no pé), `escala_jogo`, `fps`/`fps_ref`, `duracao_s` (idle), `quadros_desenhados`, `distancia_ciclo_px` (andar), `direcoes.<dir>.arquivo` e `ponta_cajado_px` por quadro (ponto de saída do projétil).
- Todas as direções com **o mesmo tamanho de quadro e o mesmo pivô**.

## 10. Processo (pose a pose, do esboço ao jogo)
1. Definir ação, arquétipo, direção, arma e equipamento; planejar fases (antecipação, ação, contato, recuperação, continuação).
2. Referência e esboços; quadro-guia (cor, contorno, transparência).
3. Poses-chave com silhueta e peso claros; depois intervalos (desenhados ou automáticos conferidos) com arcos e espaçamento.
4. Folha por direção em fundo liso → **Linha de produção do Estúdio** (tira fundo, separa, alinha pelo pé, mesma escala, suaviza, intervalos, idle, conferência).
5. Rig revisado; equipamentos com máscara, âncora e ordem; testar em movimento nas 4 direções.
6. Conferir (seção 11) → enviar para o jogo (guarda `.bak`) → testar no Godot → registrar no Roteiro.

## 11. Conferência e testes
Automática (Estúdio/CLI): serrilhado, firmeza do pé, emenda do loop, sempre em movimento, ritmo, fundo branco, volume.

Visual (sempre, por pessoa): fundo escuro e claro; casca de cebola (anterior vermelho, próximo verde); trajetória em arcos; olhos e cristal intactos; nenhuma fresta branca entre cajado e manto/capuz; nenhum item duplicado; tamanho real do jogo.

Equipamento: pose neutra nas 4 direções, idle e walk, ação que mexe a articulação mais próxima, extremos, combinação com vizinhos, remover/trocar, máscara, ordem e silhueta. Específicos: peitoral (torção, braços), ombreira (ombro), luva (cotovelo/punho), calça (joelho), botas (tornozelo, contato), capacete (giro da cabeça), capa (andar, correr, girar, saltar, conjurar), cajado (andar, atacar, conjurar, trocar direção).

Checklist de entrega: originais preservados · nomes e pastas certos · metadados no JSON · limitações anotadas · importação no Godot testada ou marcada como pendente.

## 12. Estúdio Defenda e Ataque (repositório `LSamuelS0/estudio-defenda-e-ataque`)
- Aplicativo Windows em `app/` (Personagens, tela do personagem com Visualização/Rig/Equipamentos/Adição/Inventário, Linha de produção, Ferramentas antigas).
- Sem tela (outras IAs, automação):
  - `node app/cli/estudio.js produzir <receita.json>` (opções: `quadrosPorFolha`, `alturaCorpo`, `escalaJogo`, `quadrosCiclo` 12/24/30, `duracaoCiclo`, `distanciaCiclo`, `quadrosIdle`, `duracaoIdle`, `corDestaque`)
  - `node app/cli/estudio.js conferir folha.png LQ AQ quadros`
  - `node app/cli/estudio.js suavizar entrada.png saida.png LQ AQ quadros` (ou `python suavizar_bordas.py`, nesta pasta)
  - `node app/testes/rodar.js`
- Personagens do usuário: Documentos › Estúdio Defenda e Ataque › personagens. Roteiro do que vai para o jogo: `docs/ROTEIRO_PARA_O_JOGO.md`.

## 13. Comportamento obrigatório da IA
Antes: identificar personagem e arquétipo; ver vistas, sprites e animações reais; identificar slot e região; ver rig, máscara, âncora e ordem; **declarar o que falta**; propor o menor conjunto de mudanças; preservar originais (cópia/branch, `.bak`); produzir resultado verificável; testar quadros e direções afetados; documentar o que é conceito, protótipo e produção.

Nunca: alegar precisão anatômica sem revisar landmarks; dizer que equipamento acompanha animação sem testar; deformar armadura rígida como tecido; ocultar região inteira se a cobertura é parcial; desenhar item sobre o corpo sem máscara; equipar slot já pintado no desenho; misturar escalas; reaproveitar animação humanoide em criatura sem adaptar; declarar integração com o Godot sem importar e rodar; entregar arte com branco solto.

Conflito entre regras: segurança e integridade do projeto primeiro; depois a direção de arte desta skill; registrar a divergência.

## 14. Lições aprendidas (atualizar sempre)
- 08/11 — **Frestas de papel**: o branco preso entre cajado e capuz/manto não encosta na borda da folha, então não sai como "fundo". Tirar manchas brancas internas, exceto olhos (pequenos, pouco alongados, na faixa do rosto) e miolo de brilho (cercado de cor, ex.: cristal). Conferir em fundo escuro.
- 08/11 — **Olhos somem** se o recorte trata todo branco fechado como papel; o brilho em volta dos olhos engana a regra de "anel escuro".
- 08/11 — **Cajado duplicado**: equipar um cajado num mago que já tem cajado desenhado. Regra 7.3.
- 08/11 — **6 quadros por ciclo** ficaram rápidos e travados; padrão agora é 24 por ciclo (seção 4).
- 08/11 — Intervalo automático com mistura simples cria "fantasma"; onde os dois desenhos discordam, usar só o desenho mais perto no tempo.
- 08/11 — **30 quadros** escolhidos como padrão depois de comparar 6/12/24/30 em vídeo.
- 08/11 — **Sombra no chão** saiu do sprite (fica para o jogo); a sombra de frente era cinza médio sob os pés e precisou de critério próprio.
- 08/11 — **Franja clara na borda**: pixel claro e cinza na faixa de 2 px da borda é papel; recebe a cor do miolo (o contorno de tinta) ou some.
- 08/11 — **Gesto procedural**: medir "ritmo" pelo pico isolado, não pelo maior salto — slow in/out é desejado.
- 08/11 — Nome do app com acento no cabeçalho HTTP quebrou o Electron (User-Agent): manter textos técnicos (cabeçalhos, nomes de executável) sem acento.

## 15. Arquivos de apoio (nesta pasta)
- `equipment_resource.schema.json`: contrato de dados de um equipamento.
- `suavizar_bordas.py`: mede e corrige serrilhado (`medir folha.png LQ AQ colunas quadros` / `corrigir entrada.png saida.png LQ AQ colunas quadros`).
