# Roteiro para o jogo — o que levar do Estúdio para o Defenda e Ataque

Documento vivo: atualizado a cada conversa. É a lista do que precisa ir para o jogo (Godot 4.7.2, pasta `D:\Meu jogo\Defenda e Ataque!`), em que ordem e como conferir. Qualquer IA que pegar o projeto deve ler este arquivo primeiro, depois as skills em `skills/`.

Última atualização: 08/11/2026.

## Como ler
- **Pronto no Estúdio** = o arquivo já existe neste repositório e passou na conferência das skills.
- **Pendente** = ainda precisa ser feito antes de ir para o jogo.
- Cada entrega para o jogo segue o mesmo ritual (seção "Ritual de entrega").

---

## 1. Fila de entregas para o jogo (em ordem)

### 1.1 Mago v2 (capuz escuro, cristal azul) — andar e parado
- **Situação:** pronto no Estúdio. Gerado pela linha de produção em `app/dados/personagens/mago/`.
- **Arquivos:** `mago_andar.json`, `mago_andar_{frente,costas,esquerda,direita}.png` (6 quadros), `mago_parado.json`, `mago_parado_{...}.png` (12 quadros, 2,2 s, respiração + brilho do cristal).
- **Medidas:** quadro 274×278, pivô (137, 262) no pé, `escala_jogo` 0,5. Ponta do cajado por quadro em `ponta_cajado_px`.
- **Conferência:** 7/7 regras ✔ nas 8 folhas (serrilhado 0%, pé firme, loop, ritmo, sem fundo branco, volume).
- **No jogo:** copiar para `art/mago/` (o Estúdio faz isso em "Enviar para o jogo" e guarda `.bak` do antigo). Jogador e bot usam o mesmo arquivo.
- **Conferir no Godot:** `mago.gd` lê largura/altura/pivô do JSON — confirmar que o tamanho novo (274×278, antes 220×290) não muda o tamanho na tela; conferir se o projétil sai da ponta do cajado em todas as direções.
- **Atenção:** a imagem de corpo inteiro (`fonte/mago_corpo_inteiro.png`) tem o cajado do lado oposto ao da caminhada de frente e manto mais claro. Por isso o idle de frente usa o quadro mais "de pé" da caminhada, e não essa imagem.

### 1.2 Página do herói e moeda
- **Pendente.** Trocar a silhueta de `painel_heroi.png` pelo mago de corpo inteiro e colocar o rosto (`fonte/mago_retrato_moeda.png`) dentro de `medalha_ativa.png` (hoje é a silhueta do chapéu de mago).
- Página do inventário (`painel_equipamento.png`): mostrar o mago no lugar da silhueta.
- Fazer no Estúdio (recorte sem fundo + borda macia) e só depois aplicar no jogo.

### 1.3 Equipamentos do mago (capuz/manto, calça, botas, cajado)
- **Pendente.** Peças já recortadas automaticamente da prancha `docs/referencias/mago/02_pecas_equipamento_mago.png`.
- Uso imediato no jogo: **ícones do inventário** (uma imagem por item, sem fundo).
- Uso futuro: trocar a roupa no corpo do personagem. Depende do corpo-base com folhas de animação reais (ver 2.1).

### 1.4 Skin roxa do mago
- **Depois que o Estúdio estiver rodando no computador** (decisão do Lucas, 08/11). Referência: `docs/referencias/mago/07_skin_mago_roxo.png`.
- Precisa das 4 folhas de caminhada da skin para passar na linha de produção. Mesma escala e pivô do mago v2.

---

## 2. Trabalho no Estúdio que destrava o jogo
1. **Corpo-base do mago** (menino sem roupa, short): as pranchas em `docs/referencias/mago/` são conceito. Precisam virar 4 folhas de caminhada reais (8 quadros por direção) para o sistema de roupas funcionar de verdade.
2. **Rig calibrado**: pontos propostos sozinhos pelo Estúdio em cada quadro e revisados à mão (cabeça, pescoço, ombros, cotovelos, punhos, tronco, cintura, quadril, joelhos, tornozelos, pés).
3. **Primeiro item rígido testado em movimento** (cajado ou bota) antes de generalizar para tecido (capa).
4. Animações que faltam no jogo, pela lista das skills e pranchas: corrida, ataque com cajado, conjuração (10 quadros), magia em área (12 quadros), receber dano, morte.

## 3. Ritual de entrega (toda vez que algo vai para o jogo)
1. Gerar no Estúdio e ver a **conferência** (todas as regras ✔ ou divergência anotada aqui).
2. Ver em fundo escuro e claro (caçar franja branca) e com casca de cebola.
3. "Enviar para o jogo" (grava em `art/...` e guarda `.bak`) ou baixar o .zip.
4. Abrir o Godot, rodar a cena, conferir tamanho, pivô, ponta do cajado e o bot.
5. Atualizar a planilha "Dados do Jogo" se algum número mudou (regra do projeto: planilha sempre igual aos CSV).
6. Marcar aqui como entregue, com a data.

## 4. Decisões registradas
- 08/11: o Estúdio vira programa do Windows (Electron), offline, com tudo numa branch só (`estudio-app`) até ficar organizado.
- 08/11: a casca visual é a "Central v2" do ChatGPT (Heróis/Monstros → tela única do personagem com Visualização, Edição, Adição, Inventário).
- 08/11: as duas skills (`animacao-2d-pincel` e `character-equipment-replacement`) são as regras de qualidade; o Estúdio confere as regras sozinho.
- 08/11: skin roxa só depois do Estúdio funcionando no computador.

## 5. Entregues
- (nada ainda nesta fase)
