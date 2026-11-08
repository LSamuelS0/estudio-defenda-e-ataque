---
name: character-equipment-replacement
description: Padrões para mapear anatomia 2D, substituir roupas e armaduras por região corporal e adaptar equipamentos às animações de personagens e criaturas.
---

# Skill — Substituição Inteligente de Roupas, Armaduras e Equipamentos 2D

## 1. Missão e princípio central

Atue como especialista técnico-artístico em personagens 2D de fantasia. Oriente a criação, análise, adaptação, substituição e validação de corpos-base, skins, roupas, armaduras e equipamentos modulares.

**Objetivo visual:** o personagem deve parecer uma única ilustração orgânica e contínua. O jogador não deve perceber que ele foi tecnicamente montado com sprites, camadas, máscaras, ossos, malhas ou peças independentes.

**Princípio central:** o equipamento adapta-se ao personagem e à animação. Não basta colocar uma imagem por cima do corpo. É obrigatório identificar a região anatômica coberta, aplicar a máscara correta, posicionar o item por âncoras, respeitar a ordem de desenho e testar o resultado em movimento.

Aplique estas regras a humanoides e criaturas, mas nunca force um rig humanoide em uma anatomia incompatível.

## 2. Contexto artístico do projeto

O jogo é um RPG/roguelike medieval de fantasia 2D, com arte desenhada à mão, pinceladas e aparência indie. Evite acabamento plástico, excessivamente realista ou genérico.

O personagem inicial é o Mago-base: cabelo escuro; rosto humano normal sem a capa/capuz encantado; aparência mágica com rosto escurecido e olhos brancos quando usa o capuz/capa; proporções de herói do jogo. O projeto também possui slimes elementais e prevê criaturas como ents e dragões.

Não invente medidas, pivôs ou coordenadas finais a partir de uma prancha conceitual. Calibre os dados sobre os sprites reais.

## 3. Vocabulário

- **Corpo-base:** desenho anatômico de referência, sem equipamento externo.
- **Skin:** aparência visual do personagem, podendo alterar cabelo, rosto, cores, materiais e vestimenta-base.
- **Equipamento:** item vestível ou utilizável, como capacete, peitoral, luvas, calças, botas, capa, cajado ou arma.
- **Slot:** categoria lógica em que um equipamento é instalado.
- **Região corporal:** área anatômica que pode ser coberta, como tórax, antebraço ou coxa.
- **Máscara de cobertura:** informação que oculta os pixels do corpo cobertos pelo item.
- **Âncora:** ponto usado para posicionar, rotacionar ou deformar o equipamento.
- **Pivô:** ponto em torno do qual uma peça gira.
- **Rig/esqueleto:** hierarquia de ossos, articulações e transformações.
- **Malha deformável:** superfície com vértices que acompanha movimentos.
- **Correção desenhada:** quadro ou ajuste artístico manual para resolver uma pose que o rig não reproduz naturalmente.
- **Draw order/sorting:** ordem em que as camadas são renderizadas.
- **Retargeting:** adaptação de uma animação para outro personagem, respeitando seu rig e suas proporções.

## 4. Mapear a região que será coberta

Nunca encaixe uma armadura apenas redimensionando a imagem até "parecer certa". Antes de posicionar uma peça, identifique:

1. slot ocupado;
2. regiões anatômicas cobertas;
3. regiões que permanecem visíveis;
4. âncoras e pivôs;
5. partes do corpo que devem ser ocultadas;
6. ordem de desenho em cada direção;
7. comportamento em cada animação e quadro;
8. compatibilidade com outros equipamentos.

### Exemplo: peitoral

- Slot: `chest`.
- Cobre: tórax frontal, lateral e/ou costas conforme o design.
- Âncoras: base do pescoço, ombros, centro do tórax, cintura e laterais.
- Máscara: oculta somente os pixels do torso que ficariam atravessando o peitoral.
- Deformação: preservar volume; permitir rotação/translação e flexão limitada. Usar correção desenhada em poses extremas.
- Não cobrir braços, mãos, cabeça ou pernas, salvo se a peça realmente se estender até essas regiões.

### Exemplo: capacete

- Slot: `head`.
- Cobre cabelo e/ou partes da cabeça conforme o desenho.
- Deve acompanhar o giro da cabeça como peça predominantemente rígida.
- A máscara não deve ocultar pescoço ou rosto exposto sem necessidade.

### Exemplo: botas

- Slot: `feet`.
- Cobre pé e, conforme o modelo, parte da canela.
- Âncoras: tornozelo, calcanhar e ponta do pé.
- Preservar volume e validar contato com o chão.

Se a peça cobre apenas parte de uma região, usar máscara parcial. Nunca ocultar a região inteira por conveniência.

## 5. Vistas e mapa anatômico

### 5.1 Vistas mínimas para humanoides

Obter frente, costas, perfil esquerdo e perfil direito. Uma vista 3/4 pode complementar, mas não substitui as quatro vistas.

Todas devem manter:
- mesma altura, escala e proporções;
- alinhamento consistente de cabeça, ombros, quadril, joelhos e pés;
- pose neutra comparável;
- perspectiva ortográfica ou próxima dela;
- iluminação e acabamento compatíveis.

### 5.2 Landmarks por vista

Registrar:
- caixa delimitadora, altura e largura;
- centro/topo da cabeça e base do pescoço;
- ombros, cotovelos, punhos e mãos;
- centro do tórax, cintura e quadril;
- joelhos, tornozelos, calcanhares e pontas dos pés;
- contornos e limites das regiões corporais;
- limites de sobreposição entre regiões.

Guardar coordenadas em pixels ou normalizadas entre 0 e 1, sempre registrando a resolução de referência. Não misturar sistemas sem conversão explícita.

### 5.3 Reconhecimento assistido

A IA pode sugerir contornos e articulações, mas deve apresentar os landmarks para revisão. Deve corrigir pontos deslocados, registrar incertezas e nunca inventar anatomia oculta pela perspectiva. Uma imagem 2D não contém toda a profundidade do corpo; combinar vistas e quadros de animação.

## 6. Slots e dados do equipamento

Slots humanoides sugeridos: `head`, `neck`, `shoulders`, `chest`, `back`, `upper_arms`, `forearms`, `hands`, `waist`, `legs`, `feet`, `main_hand`, `off_hand`, `accessories`.

Um item pode ocupar mais de um slot, mas isso deve ser explícito. Conflitos são resolvidos por regras de compatibilidade, nunca por sobreposição acidental.

Cada equipamento deve declarar, no mínimo:
- identificador e nome;
- slot(s);
- arquétipos compatíveis;
- regiões cobertas;
- âncoras/pivôs;
- draw order;
- máscara de cobertura;
- perfil de deformação;
- assets por direção;
- exceções/correções por animação;
- estado de validação.

Exemplo de contrato:

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
  "validation_status": "draft"
}
```

É um contrato ilustrativo: adaptar nomes e formato ao esquema real do projeto. Não declarar integração sem testar. Consulte `equipment_resource.schema.json` como referência auxiliar.

## 7. Substituição visual: ocultar, não apagar

O corpo-base deve permanecer preservado. Equipar um item não pode destruir nem editar permanentemente o sprite original.

Pipeline obrigatório:
1. carregar corpo-base e skin ativa;
2. ler os itens instalados nos slots;
3. carregar assets da direção correta;
4. calcular transformações pelas âncoras;
5. aplicar máscara somente às áreas cobertas;
6. desenhar as peças na ordem correta;
7. desenhar detalhes que devam ficar à frente;
8. validar a composição final.

Ao trocar um item no mesmo slot:
- remover o item anterior e sua máscara;
- aplicar o novo item e sua máscara;
- atualizar âncoras e draw order;
- verificar conflitos com itens vizinhos.

Equipamentos incompatíveis no mesmo slot devem se substituir. Camadas combináveis só podem coexistir se a regra permitir explicitamente.

## 8. Junções invisíveis e continuidade

O personagem não pode parecer recortado, colado ou montado. Regras:
- usar sobreposição escondida nas junções;
- estender a peça de trás por baixo da peça da frente;
- evitar bordas coincidentes entre partes;
- preservar continuidade de contorno, textura, cor, sombra e iluminação;
- evitar contornos duplicados e espaços transparentes;
- evitar interseções visíveis de pele, roupa e armadura;
- revisar ombros, cotovelos, punhos, pescoço, quadril, joelhos e tornozelos;
- validar em movimento, não apenas na pose neutra.

A sobreposição deve fechar frestas sem criar volumes ou interseções indevidas. Ajustes de pintura, sombra e textura podem ser necessários nas junções.

## 9. Deformação por material

Não aplicar a mesma deformação a todos os materiais.

| Material/peça | Regra |
|---|---|
| Corpo | deformação anatômica flexível, dentro dos limites do desenho |
| Tecido justo | acompanha o corpo com deformação moderada |
| Túnica/roupa solta | malha ou ossos secundários, com balanço |
| Capa | deformação flexível, atraso e movimento secundário |
| Couro rígido | baixa deformação; preservar volume |
| Placas metálicas | deformação mínima; preferir rotação/translação |
| Ombreiras | girar pela âncora do ombro, sem amassar a placa |
| Capacete | preservar forma e acompanhar a cabeça |
| Botas | preservar volume; acompanhar tornozelo e pé |
| Cajado/arma | transformação rígida alinhada ao ponto de empunhadura |

Armaduras rígidas não devem ser deformadas como pele. Preferir pivôs corretos, rotação/translação, placas sobrepostas, segmentos em juntas naturais e quadros corretivos desenhados. Malha de baixa deformação só quando necessário.

Não usar escala como solução universal: isso causa pulsação e mudança de volume. Corrigir primeiro âncoras, pivôs, perspectiva, sorting e máscaras.

## 10. Ordem de desenho e oclusão

A ordem varia por direção e pose. Uma hierarquia genérica pode ser:
1. parte traseira da capa e acessórios distantes;
2. membros do lado distante;
3. corpo e roupa-base;
4. peitoral e peças do tronco;
5. membros do lado próximo;
6. mãos e item empunhado conforme a pose;
7. parte frontal da capa e detalhes;
8. efeitos visuais acima do personagem.

A hierarquia deve ser configurável por direção e animação. Capa ou roupa pode exigir partes traseira/frontal para sorting correto, sem que a aparência final revele cortes.

## 11. Arquétipos e animações compatíveis

A IA deve identificar o arquétipo antes de escolher animações. Não aplicar automaticamente animações humanoides a monstros.

### 11.1 Humanoide bípede

- Locomoção: idle/respiração, walk, run, início/parada, turn, diagonais se suportadas, hit reaction, knockback, jump/land se aplicável, death.
- Combate: desarmado, ataque leve/pesado, bloqueio, esquiva, arma curta, arma longa, duas mãos.
- Magia: preparação, conjuração rápida/carregada, lançamento, canalização, interrupção, recuperação.

### 11.2 Mago com cajado

- idle segurando cajado;
- walk/run segurando cajado;
- ajuste de empunhadura;
- ataque físico com cajado;
- golpe com ponta/base;
- preparação de magia;
- conjuração com uma ou duas mãos;
- lançamento, canalização e recuperação.

O cajado deve ter ponto de empunhadura. Verificar mão, ângulo e interseções com corpo.

### 11.3 Humanoide com armadura pesada

- idle com oscilação reduzida;
- walk mais pesado e com apoio claro;
- run mais pesado ou limitado;
- ataques com antecipação e recuperação marcadas;
- hit reaction coerente com massa;
- esquiva limitada pela silhueta;
- death com peso e impacto.

Peso visual não deve alterar automaticamente a velocidade de gameplay.

### 11.4 Humanoide com capa ou manto

- idle com oscilação secundária;
- walk/run com atraso do tecido;
- giro com inércia;
- salto/queda com balanço;
- conjuração com reação do tecido;
- death com acomodação.

Usar malha ou cadeia de ossos secundária; validar atravessamentos.

### 11.5 Slimes e criaturas amorfas

- idle pulsante;
- squash and stretch;
- compressão antes do impulso;
- expansão no deslocamento;
- aterrissagem/recuperação;
- ataque por pancada, projeção ou cuspe;
- hit reaction;
- death/dissolução.

Slimes elementais compartilham estrutura temporal quando adequado, mas mantêm silhueta, partículas e reações próprias. Para slime de terra com cuspe, sincronizar preparação, emissão, projétil e recuperação.

Carapaça rígida não deve esticar como gelatina: usar peça rígida ancorada, placas articuladas ou correções. Skin temática pode alterar a superfície sem ocupar slot de armadura.

### 11.6 Quadrúpedes

- idle/respiração;
- walk, trot/run/gallop conforme porte;
- turn;
- mordida, garra, investida;
- hit reaction;
- jump/land se aplicável;
- death.

Definir cadeias de patas dianteiras/traseiras, coluna, pescoço e cabeça. Respeitar a passada da espécie.

### 11.7 Ents

- idle lento de tronco, galhos e folhas;
- walk pesado com apoio claro;
- ataque de braço/galho;
- golpe no chão;
- antecipação e recuperação longas;
- hit reaction com inércia;
- death com queda e impacto.

Armaduras/cascas e folhas devem acompanhar a estrutura sem perder aparência rígida/orgânica.

### 11.8 Dragões

- idle em solo;
- walk pesado;
- decolagem, voo em ciclo, curva, pairar e pouso;
- mordida, garra, cauda e sopro;
- hit reaction em solo/voo;
- death/queda conforme escopo.

Dragões exigem rig próprio: asas, coluna, pescoço, cauda e membros não são retargetados como corpo humanoide.

### 11.9 Matriz resumida

| Arquétipo | Locomoção | Ataques | Equipamento |
|---|---|---|---|
| Humanoide | idle, walk, run, turn | corpo a corpo, armas, magia | slots humanoides |
| Mago/cajado | walk/run com cajado | cajado, projétil, canalização | cajado, veste, capa |
| Armadura pesada | walk pesado, run limitado | golpe pesado, bloqueio | placas rígidas |
| Capa/manto | walk/run + tecido | conforme classe/arma | tecido e acessórios |
| Slime | pulsar, deslizar, saltar | pancada, cuspe, projeção | carapaça/skin |
| Quadrúpede | walk, trot, gallop | mordida, garra, investida | slots específicos |
| Ent | passos pesados | galhos, braços, golpe no solo | casca, folhas, adornos |
| Dragão | walk, fly, takeoff, landing | mordida, garra, cauda, sopro | escamas/peças próprias |

## 12. Direções, spritesheets e nomenclatura

Para humanoides de quatro direções:
- `front`: frente;
- `back`: costas;
- `left`: perfil esquerdo;
- `right`: perfil direito.

Não espelhar automaticamente se houver assimetria, arma em mão específica, detalhes laterais ou iluminação incompatível. Espelhamento exige validação.

Oito quadros por direção é um ponto inicial para caminhada, não uma regra universal. FPS e quantidade de quadros devem seguir o estilo e o ritmo do jogo.

Nomes sugeridos:
- `mago_idle_front.png`
- `mago_walk_front.png`
- `mago_walk_back.png`
- `mago_walk_left.png`
- `mago_walk_right.png`
- `mago_attack_staff_left.png`
- `mago_cast_projectile_front.png`

Registrar largura/altura por quadro, colunas/linhas, FPS, pivô, margens, direção, loop/once e eventos por quadro. Preferir spritesheets em grade documentada ou quadros individuais.

## 13. Protocolo de criação de animação

1. Definir ação e resultado visual.
2. Identificar arquétipo.
3. Definir direção, arma e equipamento.
4. Planejar fases: antecipação, ação, contato/impacto, recuperação e follow-through.
5. Criar poses-chave com silhueta e distribuição de peso claras.
6. Criar intermediários com arcos e espaçamento coerentes.
7. Validar loop, quando houver.
8. Aplicar equipamentos, máscaras, âncoras e sorting.
9. Testar deformação por material.
10. Testar direções compatíveis.
11. Corrigir com quadros desenhados quando necessário.
12. Registrar metadados e versão.

Critérios de aprovação:
- silhueta legível;
- volume/proporção estáveis;
- contato dos pés sem deslizar involuntariamente;
- articulações sem quebras visuais;
- ausência de frestas e interseções;
- armadura sem pulsação ou perda de volume;
- arma corretamente empunhada;
- partículas sincronizadas;
- loop sem salto;
- timing comunica peso e intenção.

## 14. Testes obrigatórios por equipamento

Nenhum equipamento é aprovado apenas em pose parada. Testar:
- pose neutra nas quatro direções aplicáveis;
- idle e walk;
- run, se existir;
- ação que mova a articulação mais próxima;
- extremos de rotação/flexão;
- combinação com peças vizinhas;
- remoção e substituição;
- máscara corporal;
- sorting e silhueta.

Testes específicos:
- peitoral: torção do tronco e elevação dos braços;
- ombreira: elevação/rotação do ombro;
- braçadeira/luva: cotovelo e punho;
- calças/grevas: caminhada, corrida e joelho;
- botas: tornozelo, contato e aterrissagem;
- capacete: giro/inclinação da cabeça;
- capa: caminhada, corrida, giro, salto e conjuração;
- cajado/arma: caminhada, ataque, conjuração e troca de direção.

## 15. Trabalho em projetos existentes

- Inspecionar assets reais antes de sugerir substituições.
- Preservar originais; trabalhar em cópia ou branch.
- Não sobrescrever animações aprovadas sem autorização.
- Não inventar caminhos, dimensões ou recursos não verificados.
- Respeitar a versão do Godot do projeto.
- Distinguir conceito, protótipo e recurso pronto para produção.
- Executar validações estáticas e testes reais quando disponíveis.
- Relatar testes não executados e limitações.

Uma prancha conceitual não é spritesheet final. Um mapa esquemático não contém coordenadas anatômicas calibradas.

## 16. Comportamento obrigatório da IA

Antes de executar:
1. identificar personagem e arquétipo;
2. verificar vistas, sprites e animações disponíveis;
3. identificar slot e região coberta;
4. verificar rig, máscara, âncora e sorting;
5. declarar dados ausentes;
6. propor o menor conjunto de alterações;
7. preservar originais;
8. produzir resultado verificável;
9. testar quadros e direções afetados;
10. documentar o que foi feito e o que permanece conceitual.

Nunca:
- alegar precisão anatômica sem revisar landmarks;
- afirmar que equipamento acompanha animação sem testar;
- deformar armadura rígida como tecido;
- ocultar região inteira se a cobertura for parcial;
- desenhar item sobre o corpo sem máscara;
- misturar escalas ou proporções;
- reutilizar animação humanoide em criatura amorfa sem adaptação;
- declarar integração ao Godot sem testar importação e reprodução.

## 17. Checklist de aprovação

### Corpo-base
- [ ] Quatro vistas coerentes.
- [ ] Altura, largura e escala documentadas.
- [ ] Landmarks revisados.
- [ ] Rig e pivôs documentados.
- [ ] Nomenclatura consistente.

### Equipamento
- [ ] Slot definido.
- [ ] Regiões cobertas definidas.
- [ ] Máscara revisada.
- [ ] Âncoras/pivôs definidos.
- [ ] Draw order definido.
- [ ] Perfil de deformação definido.
- [ ] Conflitos de slots resolvidos.

### Animação
- [ ] Arquétipo correto.
- [ ] Fases planejadas.
- [ ] Quadros-chave e intermediários revisados.
- [ ] Contato e peso coerentes.
- [ ] Loop validado, se aplicável.
- [ ] Equipamento testado em movimento.
- [ ] Direções aplicáveis testadas.

### Entrega
- [ ] Originais preservados.
- [ ] Arquivos nomeados e organizados.
- [ ] Metadados registrados.
- [ ] Limitações documentadas.
- [ ] Importação/execução testada ou marcada como pendente.

## 18. Regra final

**O equipamento deve adaptar-se ao personagem e à animação sem destruir a identidade visual do corpo nem perder sua própria estrutura material.** O corpo pode dobrar; o tecido acompanha; a armadura rígida preserva volume; as máscaras ocultam o que está coberto; e as camadas formam uma única imagem coerente.

O objetivo não é mostrar que o personagem foi construído com peças independentes. É fazer com que ninguém perceba isso.
