---
name: skill-de-animacao
description: Use ao planejar, criar, revisar ou exportar animações 2D de personagens, equipamentos modulares e efeitos em pincel para jogos, incluindo spritesheets, landmarks, rigs, máscaras e validação visual.
---

# Skill de animação

Esta skill reúne as regras de animação 2D, efeitos em pincel, anatomia e equipamento modular, padrões de personagens, continuidade do Estúdio Defenda e Ataque e o fluxo de inspeção/suavização de spritesheets. Use-a como referência única ao produzir assets ou orientar outra IA.

## 1. Objetivo e estilo do projeto

Criar animações e peças 2D que leiam com clareza em jogo e pareçam uma única ilustração orgânica, mesmo quando tecnicamente compostas de sprites, camadas, máscaras, ossos ou malhas.

Direção visual: RPG/roguelike medieval de fantasia, desenho à mão, contorno de tinta escura, cores chapadas e pinceladas macias. Evitar acabamento plástico, genérico ou excessivamente realista. Manter formas legíveis em escala pequena.

Personagem de referência: Mago-base, cabelo escuro e rosto humano normal sem capuz/capa encantado; com o capuz/capa encantado, rosto escurecido e olhos brancos luminosos. Criaturas existentes ou previstas incluem slimes elementais, ents e dragões.

Contexto técnico: o jogo usa Godot; respeitar a versão indicada no projeto real. O editor interno é citado nos materiais como `tools/estudio/index.html`, com uma aba Biblioteca para revisar animação e efeitos; confirmar que esse caminho existe antes de usá-lo. Nunca assumir que um template ou uma skill prova que um recurso está implementado.

## 2. Princípios de trabalho

- Preservar os originais. Criar cópias ou trabalhar em branch; não sobrescrever animação aprovada sem autorização explícita.
- Inspecionar referências e assets reais antes de determinar dimensão, escala, pivô, landmarks ou deformação.
- Distinguir claramente conceito, template, protótipo, asset revisado e asset de produção.
- Não inventar partes ocultas pela perspectiva, coordenadas anatômicas, caminhos, capacidades do editor ou integração de engine.
- Identificar o arquétipo antes de escolher rig ou retargeting. Não forçar um rig humanoide em anatomia incompatível.
- Tratar números desta skill como metas de referência. Ajustar FPS, quadros e tolerâncias ao estilo e à leitura do jogo, registrando qualquer desvio intencional.
- Em tarefas do repositório, conferir a branch e a estrutura atuais. O fluxo de projeto acordado é `main` estável, `develop` para integração e branches temáticas com Pull Requests.

## 3. Vocabulário

- **Corpo-base:** referência anatômica preservada, sem equipamento externo.
- **Skin:** variação visual do personagem, como rosto, cabelo, cores, materiais ou vestimenta-base.
- **Equipamento:** peça vestível ou empunhada, como capacete, peitoral, luva, bota, capa, cajado ou arma.
- **Slot:** categoria de equipamento; um item pode ocupar mais de um slot se isso estiver declarado.
- **Região corporal:** área anatômica identificável e potencialmente coberta.
- **Máscara de cobertura:** dado que oculta apenas os pixels do corpo encobertos pela peça.
- **Landmark/âncora:** ponto identificado para posicionar, girar ou deformar uma peça.
- **Pivô:** ponto em torno do qual uma peça gira.
- **Rig:** hierarquia de ossos, articulações e transformações.
- **Malha:** vértices deformáveis que acompanham o movimento.
- **Correção desenhada:** ajuste manual ou quadro adicional para resolver uma pose que a transformação não reproduz bem.
- **Sorting/draw order:** ordem de desenho das camadas, variável por direção e pose.
- **Retargeting:** adaptação de movimento a outro rig e proporções; requer revisão visual.

## 4. Fluxo de produção

### 4.1 Definir o pedido

Antes de editar, registrar: personagem e arquétipo, ação, direção, equipamento/arma, material, plataforma ou engine alvo, assets de origem e estado esperado da entrega. Localizar animações já existentes e identificar quais vistas e quadros serão afetados.

### 4.2 Preparar referência e corpo

Para um humanoide, buscar vistas frente, costas, perfil esquerdo e perfil direito. Uma vista 3/4 é complementar e não substitui as quatro vistas quando o jogo precisa delas. Manter altura, escala, proporções, pose neutra, iluminação e acabamento compatíveis; preferir perspectiva ortográfica ou próxima dela.

Para a primeira referência do Mago-base, usar corpo sem cajado, capa/capuz e armadura; manter apenas o short de referência se essa for a decisão artística aprovada. Não reconstruir o personagem a partir do template vetorial: usar a imagem de referência aprovada.

Registrar resolução de cada referência, caixa delimitadora, altura/largura, origem das coordenadas e revisão aprovada. Não misturar pixels e coordenadas normalizadas sem conversão documentada.

### 4.3 Inspecionar anatomia e rig

Marcar landmarks por vista: topo/centro da cabeça, base do pescoço, ombros, cotovelos, punhos, mãos, centro do tórax, cintura, quadril, joelhos, tornozelos, calcanhares e pontas/apoios dos pés. Marcar também contornos das regiões corporais e limites de sobreposição.

A IA pode sugerir pontos e contornos, mas deve sinalizar incertezas e permitir revisão humana sobre a imagem real. Não estimar o lado oculto com falsa precisão. Uma única imagem 2D não contém toda a profundidade; combinar vistas e quadros quando necessário.

Usar coordenadas normalizadas entre 0 e 1 ou pixels, sempre com dimensões da imagem. Documentar hierarquia e pivôs apenas depois de calibrar sobre os sprites reais.

### 4.4 Planejar a animação

Definir resultado, arquétipo, fases e poses-chave. Para ações fortes, considerar antecipação, ação/contato, recuperação e follow-through. Criar extremos primeiro e intermediários depois; usar casca de cebola quando disponível.

Planejar silhueta, distribuição de peso, apoio, arcos e posição de objetos empunhados. Manter equipamento legível fora da silhueta quando isso fizer sentido. Evitar ações secundárias que disputem atenção com a ação principal.

### 4.5 Compor equipamentos

Antes de encaixar uma peça, determinar: slot(s), regiões efetivamente cobertas e visíveis, âncoras/pivôs, máscara, ordem de desenho por direção, perfil de deformação, compatibilidade com outros slots e correções por animação.

Pipeline: carregar corpo-base e skin; carregar assets da direção; posicionar pelas âncoras; mascarar somente as áreas cobertas; desenhar na ordem certa; compor detalhes frontais; revisar frestas, interseções, silhueta e movimento. Ao trocar equipamento, remover a peça e máscara anteriores antes de aplicar as novas.

O corpo-base nunca é apagado ou alterado permanentemente ao vestir uma peça. Um item que cobre parcialmente uma região usa máscara parcial. Slot incompatível substitui o item anterior; combinações só coexistem quando declaradas.

### 4.6 Exportar e registrar

Organizar quadros individuais ou spritesheet em grade documentada. Registrar direção, ação, número de quadros, colunas/linhas, largura/altura por quadro, margens, FPS, pivô, transparência, loop/once, eventos por quadro e versão. Exportar para o formato do projeto/engine apenas depois de verificar a configuração real.

Nomes sugeridos: `mago_idle_front.png`, `mago_walk_front.png`, `mago_walk_back.png`, `mago_walk_left.png`, `mago_walk_right.png`, `mago_attack_staff_left.png`, `mago_cast_projectile_front.png`.

## 5. Regras de corpo, roupa e equipamento

### 5.1 Cobertura e continuidade

Uma armadura não é ajustada apenas redimensionando até parecer correta. Para cada item, anotar slots, regiões cobertas, partes visíveis, âncoras, pivôs, máscara, sorting, compatibilidade e comportamento por animação.

O resultado não deve parecer recortado ou montado: esconder junções com sobreposição controlada; estender a peça traseira sob a frontal; evitar bordas coincidentes, contornos duplicados, frestas transparentes e interseções de pele/roupa/placa. Revisar ombro, cotovelo, punho, pescoço, quadril, joelho e tornozelo em movimento.

Exemplos:
- **Peitoral:** normalmente cobre tórax; usar âncoras na base do pescoço, ombros e cintura. Mascarar apenas o torso que atravessaria a peça.
- **Capacete:** acompanha a cabeça como peça predominantemente rígida; não ocultar pescoço/rosto exposto sem motivo visual.
- **Bota:** ancorar em tornozelo, calcanhar e ponta; preservar o volume e validar contato com o chão.
- **Cajado/arma:** transformação rígida alinhada ao ponto de empunhadura; validar mão, ângulo e interseções em animações.

### 5.2 Deformação por material

Não aplicar a mesma deformação a todos os materiais.

| Material | Comportamento esperado |
|---|---|
| Corpo/pele | flexão anatômica, mantendo proporções e volume legíveis |
| Tecido justo | acompanha o corpo com deformação moderada |
| Túnica/tecido solto | malha ou cadeia de ossos com balanço secundário |
| Capa/manto | flexível, com atraso e inércia; validar atravessamentos |
| Couro rígido | baixa deformação e volume estável |
| Placas metálicas | deformação mínima; preferir rotação/translação e segmentação |
| Ombreira | pivô no ombro sem amassar a placa |
| Capacete/botas | preservar volume e acompanhar articulação adequada |

Para armadura rígida, priorizar pivôs, translação/rotação, placas segmentadas em juntas naturais e correções desenhadas. Usar malha de baixa deformação apenas quando necessário. Não usar escala como solução geral: ela produz pulsação e perda de volume. Corrigir primeiro âncoras, pivôs, perspectiva, máscara e sorting.

### 5.3 Ordem de desenho

Uma ordem inicial pode ser: capa/acessórios traseiros; membros distantes; corpo e roupa-base; peças do tronco; membros próximos; mãos e arma; partes frontais da capa; efeitos. Ajustar por direção e pose. Capa pode ser separada em partes traseira/frontal, mas a composição final deve esconder as emendas.

## 6. Princípios de animação de personagens

Aplicar os 12 princípios como ferramentas, não como checklist mecânico em toda ação:

1. **Comprimir e esticar:** manter volume; slime achata ao pousar e alonga ao saltar. No Mago, deformação corporal sutil.
2. **Antecipação:** preparar ações fortes com deslocamento contrário; 2–3 quadros são um ponto de partida.
3. **Encenação:** silhueta e intenção legíveis; evitar que arma/objeto desapareça dentro do corpo.
4. **Pose a pose e ação direta:** extremos primeiro para corpo; ação direta funciona para partes soltas, gotas e fogo.
5. **Continuação e sobreposição:** elementos leves chegam depois; atraso de 1–2 quadros é referência inicial.
6. **Aceleração e desaceleração:** espaçamento comunica início/parada; mais poses perto de extremos, salvo impacto deliberadamente seco.
7. **Arcos:** mãos, cabeça, cajado, saltos e projéteis seguem arcos quando a ação não pede linha reta.
8. **Ação secundária:** respiração, balanço e brilho complementam sem competir.
9. **Timing:** peso e intenção definem velocidade; animação desenhada à mão costuma começar em 6–12 FPS, partículas em pincel em 24 FPS.
10. **Exagero:** suficiente para leitura em tela pequena, sem quebrar o modelo.
11. **Volume/desenho sólido:** preservar forma, sombra e iluminação; evitar simetria automática em poses.
12. **Apelo:** formas simples, expressivas e coerentes com a direção de arte.

## 7. Arquétipos e repertório de ações

Escolher apenas movimentos compatíveis com anatomia e gameplay. Esta tabela é repertório de referência; não exige criar todas as animações para todo personagem.

| Arquétipo | Locomoção/estados | Ações | Equipamento/rig |
|---|---|---|---|
| Humanoide bípede | idle/respiração, walk, run, início/parada, turn, diagonais se suportadas, hit, knockback, jump/land, death | desarmado, leve/pesado, bloqueio, esquiva, armas curtas/longas, duas mãos, magia (preparar, lançar, canalizar, interromper, recuperar) | rig humanoide, slots por região |
| Mago com cajado | idle/walk/run segurando cajado | ajuste de empunhadura, golpe com ponta/base, conjuração rápida/carregada, lançamento, canalização e recuperação | ponto de empunhadura; validar mão e sorting |
| Armadura pesada | idle contido, walk pesado, run limitado ou pesado | ataques com antecipação/recuperação, bloqueio, hit coerente com massa, esquiva limitada, death com peso | placas rígidas, preservação de volume; peso visual não altera automaticamente velocidade de jogo |
| Capa/manto | idle com oscilação, walk/run, giro, salto/queda | reação secundária em conjuração e acomodação ao parar/morrer | malha ou ossos secundários; checar interseções |
| Slime amorfo | idle pulsante, deslizar/saltar, compressão, expansão e aterrissagem | pancada, projeção/cuspe, hit, dissolução | squash/stretch; carapaça rígida ancorada, nunca gelatina |
| Quadrúpede | idle/respiração, walk, trot/run/gallop, turn | mordida, garra, investida, hit, jump/land, death | cadeias próprias de patas, coluna, pescoço e cabeça |
| Ent | idle lento, passos pesados | golpe de braço/galho, golpe no chão, antecipação longa, hit e queda | tronco/galhos/folhas; casca rígida preserva estrutura |
| Dragão | idle em solo, walk, decolagem, voo, curva, pairar, pouso | mordida, garra, cauda, sopro, hit em solo/voo, death/queda | rig próprio para asas, coluna, pescoço, cauda e patas |

Slimes elementais podem compartilhar timing, mantendo silhuetas, partículas e reações próprias. Em slime de terra que cospe, sincronizar preparação, emissão, projétil e recuperação. Skin temática não é automaticamente slot de armadura.

## 8. Regras para spritesheets e ciclos

Para humanoides com quatro direções, usar `front`, `back`, `left` e `right`. Não espelhar automaticamente: assimetria, arma em mão específica, detalhes e iluminação podem denunciar o espelhamento. Validar antes.

Oito quadros por direção é o alvo inicial acordado para a caminhada do Mago-base, não regra universal. Usar fundo transparente, escala/célula consistente, ciclo contínuo e apoio alinhado. Definir FPS depois de avaliar leitura. Registrar se a animação é loop ou ação única.

Fases úteis para uma caminhada humanoide de oito poses: contato, descida, passagem, subida, segundo contato, segunda descida, segunda passagem e subida. As fases são guia de planejamento, não substituem revisão do ciclo, anatomia e peso.

Para outras animações, planejar antecipação → ação/contato → recuperação/follow-through. Efeitos e partes secundárias podem ser desenhados diretamente, mantendo a âncora estável.

## 9. Animação de efeitos em pincel

### 9.1 Regras e física simplificada

- Todo efeito tem fonte/direção e ciclo de energia: antecipação → pico/ação → dissipação.
- Partículas costumam nascer rápidas e desacelerar por arrasto. Respingos e lascas caem em arcos; fumaça, brasas e pó mágico tendem a subir.
- Usar trajetórias curvas com turbulência quando apropriado; a cauda acompanha a trajetória.
- Efeitos pequenos tendem a ser rápidos (aprox. 0,3–0,6 s); efeitos maiores podem durar mais. Ajustar pelo propósito e pela leitura.
- Formas macias/arredondadas combinam com fantasia leve; tensão pode usar pontas arredondadas. Contorno de tinta nas formas principais e espaços vazios ajudam a silhueta.
- Composição típica: núcleo claro, cor principal, contorno/borda escura, partículas secundárias e brilho aditivo quando houver suporte. Usar 3–4 tons como ponto de partida; evitar degradê genérico sem pincelada.
- Efeito ambiental não deve competir com a ação. Nada fica congelado durante uma animação que deveria estar viva; não inventar movimento numa arte que foi solicitada como pose estática.

### 9.2 Receitas de referência

| Tipo | Forma e movimento | Duração/ritmo inicial |
|---|---|---|
| Fumaça pequena | bolhas arredondadas sobem, crescem e desaparecem gradualmente | 0,6–1,2 s |
| Fumaça de impacto | anel de nuvens se expande do chão e freia | 0,3–0,5 s |
| Brilho/pó mágico | estrela de quatro pontas e pontos; cresce, gira pouco, some | 0,2–0,8 s |
| Raio | linha quebrada de espessura irregular e pontas arredondadas; pisca 2–3 vezes | 0,1–0,3 s |
| Fogo | línguas em camadas vermelho/laranja/amarelo/branco, ondulam e soltam brasas | loop de 1–1,5 s |
| Líquido/splash | coroa de gotas contornadas; sobe em leque e cai por gravidade | 0,3–0,6 s |

### 9.3 Técnicas

- Fazer referência, estudos de forma e um quadro-guia de cor/contorno/transparência.
- Desenhar poses-chave e intervalos; onion skin pode usar quadro anterior em vermelho e próximo em verde.
- Partículas com trajetória e horários de nascimento pré-calculados facilitam loops previsíveis.
- Fitas de pincel afinam na ponta; contorno pode combinar uma passada firme com outra leve/transparente.
- Para rajada, concentrar nascimentos no início (cerca de 0,12 s é referência) e permitir dissipação posterior.
- Crossfade entre quadros só quando melhorar a continuidade e não borrar/duplicar a pincelada.
- Áudio contínuo pode usar variações com crossfade de potência constante, fechando o fim no começo quando for loop.

## 10. Metadados de equipamento e animação

Cada recurso modular deve registrar ao menos identificador/nome, slot(s), arquétipos compatíveis, regiões cobertas, âncoras, perfil de deformação e estado de validação. Quando aplicável, adicionar draw order, máscara corporal, assets por direção, exceções de animação e regras de oclusão.

Contrato JSON de referência (adapte ao modelo real do editor; não alegue integração só por criar o arquivo):

```json
{
  "id": "peitoral_couro_01",
  "name": "Peitoral de couro",
  "slot": "chest",
  "compatible_archetypes": ["humanoid_biped"],
  "coverage_regions": ["upper_torso", "chest_front", "chest_back"],
  "anchors": ["neck_base", "shoulder_left", "shoulder_right", "waist_center"],
  "draw_order": "torso_outer",
  "body_mask": "mask_peitoral",
  "deformation_profile": "rigid_low_deform",
  "directional_assets": {
    "front": "peitoral_front.png",
    "back": "peitoral_back.png",
    "left": "peitoral_left.png",
    "right": "peitoral_right.png"
  },
  "animation_overrides": [],
  "occlusion_rules": [],
  "validation_status": "draft"
}
```

Perfis aceitos no schema recebido: `flexible`, `moderate`, `rigid_low_deform`, `rigid_preserve_volume`, `cloth_secondary_motion`, `custom`. Estados: `draft`, `needs_review`, `validated`, `production`. Direções opcionais: `front`, `back`, `left`, `right`; o objeto de direções não aceita outras chaves. `animation_overrides` e `occlusion_rules` são listas de strings. O schema original exige `id`, `name`, `slot`, `coverage_regions`, `anchors`, `deformation_profile` e `validation_status`; propriedades extras no recurso principal são permitidas.

Metadados de animação/spritesheet: ação, direção, quadro(s), colunas, largura e altura da célula, FPS, pivô em pixels, margens, loop ou faixas como acender/loop/apagar, `single` para rajada única, eventos por quadro e versão. Usar nomenclatura consistente em vez de inferir parâmetros pelo nome do arquivo.

## 11. Revisão quantitativa e visual

São metas heurísticas dos materiais, não garantias automáticas de qualidade:

- Deriva do apoio (pé, base da chama ou centro de projétil) menor que 2% da largura do quadro.
- Fração de borda dura menor que 25% da borda examinada.
- Salto do último para o primeiro quadro menor ou igual a 1,6× o deslocamento médio entre quadros.
- Pulso de escala de efeito contínuo abaixo de 45% como alvo inicial.
- Pulso da luz no chão em torno de, no máximo, ±5% como referência.
- Borda macia com transição de alfa de cerca de 1–2 px; desenhar em 2× e reduzir com suavização pode ajudar.

Revisar no tamanho real do jogo e sobre fundos claros e escuros. Procurar fundo branco/papel, xadrez desenhado, franja clara, buracos dentro da arte, mudança de volume, deslize dos pés, saltos de loop, serrilhado e perda de silhueta. Métricas não substituem revisão visual.

## 12. Suavização de bordas em spritesheets

O helper original `suavizar_bordas.py` usa NumPy, Pillow e SciPy. Para medir, considera visível alfa acima de 8, detecta borda visível adjacente a transparência e calcula, em média por quadro, a fração desses pixels com alfa acima de 235. Para corrigir, alisa o alfa com desfoque Gaussiano leve (`sigma=0.85`) e curva smoothstep; limita a alteração a degraus de alfa maior que 0,9 adjacentes a alfa menor que 0,05 e uma vizinhança de até dois pixels. A região macia/interior deve permanecer inalterada; pixels que ganham alfa recebem a cor opaca mais próxima para reduzir franjas.

Executar sempre em uma cópia e fornecer largura/altura corretas do quadro, número de colunas e número de quadros. Conferir a imagem corrigida em fundo escuro e claro e comparar com o original. Não usar a saída sem inspeção: o processamento pode não ser adequado para pixel art deliberada, bordas estilizadas, frames incompletos ou spritesheets com layout diferente.

Comando do script de origem:

```text
python suavizar_bordas.py medir folha.png largura_quadro altura_quadro colunas quadros
python suavizar_bordas.py corrigir entrada.png saida.png largura_quadro altura_quadro colunas quadros
```

As medidas são em pixels. O modo `medir` imprime uma porcentagem; `corrigir` salva PNG RGBA otimizado. Verificar dependências antes: `numpy`, `Pillow` e `scipy`.

## 13. Testes obrigatórios antes de aprovar

### Animação
- Silhueta, timing e intenção legíveis em escala de jogo.
- Proporções e volume estáveis; apoio não desliza involuntariamente.
- Articulações sem quebras, frestas ou interseções.
- Loop sem salto, quando houver loop.
- Transparência e bordas revisadas em diferentes fundos.
- Direções, arma e efeitos sincronizados e compatíveis.

### Equipamentos
- Slot e cobertura definidos; máscara parcial/correta.
- Âncoras, pivôs e draw order conferidos em todas as direções relevantes.
- Peça vizinha, remoção/substituição e compatibilidade de slots conferidas.
- Armadura mantém volume; tecido e capa acompanham o corpo sem atravessar.
- Testar pose neutra, idle, walk, run se existir e a ação que mais move a articulação coberta.
- Testes focais: peitoral em torção e braços elevados; ombreira em rotação; luvas em cotovelo/punho; pernas em caminhada/corrida; botas no apoio/aterrissagem; capacete em giro; capa em caminhada, giro, salto e conjuração; arma em caminhada, ataque, conjuração e troca de direção.

### Entrega
- Originais preservados; nomes e metadados consistentes.
- Resolução, quadros, FPS, pivô e validação registrados.
- Importação/reprodução na versão real do engine verificada ou marcada como pendente.
- Limitações e dados não calibrados informados.

## 14. Estados de qualidade e comunicação

Usar termos sem ambiguidade:
- **Conceito:** estudo visual, ainda sem medidas ou uso em jogo.
- **Template:** estrutura editável vazia/esquemática.
- **Protótipo:** recurso testável, mas ainda não validado em todas as condições.
- **Revisado:** passou pelas verificações visuais e de dados acordadas.
- **Produção:** foi importado e testado no projeto/engine alvo, com limitações documentadas.

Antes de terminar, informar o que mudou, quais critérios foram conferidos, quais testes não foram executados e o que permanece conceitual ou pendente. Nunca dizer que está no GitHub/engine sem verificar o destino.

## 15. Continuidade do Estúdio

- Repositório de referência: `LSamuelS0/estudio-defenda-e-ataque` (privado).
- A organização combinada usa `main` como versão estável e `develop` para integração; confira a branch antes de afirmar onde está um arquivo. A biblioteca de skills e os PRs originais #1 e #2 foram integrados em `develop`.
- A skill unificada é a referência canônica para novos prompts. O catálogo fica em `skills/README.md`; skills novas devem ter sua própria pasta e `SKILL.md`.
- Os materiais citam `tools/estudio/index.html` e a aba Biblioteca, mas confirme que o código está disponível no checkout antes de depender dele. Se o aplicativo não estiver no repositório, documente a lacuna em vez de inventar comportamento.
- O projeto de jogo usa Godot; a versão de engine é a que estiver declarada no projeto inspecionado.
- A conversa compartilhada menciona um menu desenhado à mão sem trazer detalhes suficientes no trecho disponível. Não inferir aparência ou comportamento do menu sem referência adicional.

## 16. Regra final

O corpo pode flexionar; o tecido acompanha; a armadura rígida preserva volume; máscaras escondem somente o que está coberto; animações e efeitos comunicam peso e intenção. A montagem técnica não deve quebrar a identidade do personagem nem ficar visível ao jogador.

