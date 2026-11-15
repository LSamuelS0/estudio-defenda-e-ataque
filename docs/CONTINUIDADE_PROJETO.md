# Continuidade do Estúdio Defenda e Ataque

Atualizado em 15/11/2026 (branch `main`). Leia junto com o [Roteiro para o jogo](ROTEIRO_PARA_O_JOGO.md).

## Estado real (verificado)
- **O aplicativo está no repositório** em `app/` (antes só existia dentro de um .zip). É um programa Electron para Windows, offline.
- **Motor** (`app/nucleo/nucleo.js`, sem dependências): tirar fundo, separar quadros, medir, alinhar pelo pé, reduzir com alfa pré-multiplicado, suavizar borda, gerar idle, conferir regras, propor rig, posicionar item rígido, compor corpo + itens, recortar peças, gerar JSON do jogo.
- **Testado**: 10 testes automáticos (`app/testes/rodar.js`); teste de fumaça do app real (`ESTUDIO_AUTOTESTE`) abre as telas, confere o mago (7/7 regras), propõe 19 pontos do rig e salva no disco.
- **Mago v2** produzido pela linha de produção a partir das 4 folhas: 8 folhas (andar + parado) passam em todas as regras.
- Ferramentas antigas preservadas em `app/ferramentas/`, agora sem depender de internet (JSZip local, sem Google Fonts).

## O que veio de cada IA
- **ChatGPT**: skill de equipamentos modulares, hoje incorporada à skill canônica `skills/skill-de-animacao/SKILL.md`, "Central v2" (casca Heróis/Monstros → tela única com Visualização/Edição/Adição/Inventário; documentos em `docs/central-v2/`), pranchas do corpo-base e mapa anatômico (`docs/referencias/mago/`).
- **Claude**: materiais originais de animação e efeitos, incorporados à skill canônica `skills/skill-de-animacao/SKILL.md`, Estúdio original (slimes, mago, efeitos, movimento, biblioteca), motor e aplicativo novo.

## Decisões
- Em 15/11/2026, o aplicativo, a documentação atualizada e a skill canônica foram consolidados na branch `main`. Novas tarefas devem usar branches temáticas e Pull Requests revisados e testados antes de integrar na `main`.
- Visual da Central v2; funcionalidade real ligada nela.
- Arte vem de fora (ChatGPT/artista); o Estúdio automatiza o resto. Geração de imagem por API pode entrar depois.
- Skin roxa só depois do app rodando no computador do Lucas.

## Limites conhecidos (não esconder)
- O rig é proposto pela silhueta: bom para âncoras grandes (mão, quadril, pés); cotovelos e punhos precisam de revisão à mão.
- Equipamento hoje é **rígido** (só gira e move). Tecido com atraso (capa) ainda não existe; segue a skill: item rígido testado primeiro.
- O corpo-base sem roupa (pranchas) é conceito: falta ter folhas de animação reais para o sistema de roupas valer de verdade.
- O executável não é assinado: o Windows mostra aviso na primeira vez.
- `docs/personagens/*.json|svg` (ChatGPT) continuam como templates não calibrados; o rig calibrado de cada personagem fica no `personagem.json` dele.

## Próximos passos
1. Lucas instala o app (Actions → Aplicativo Windows) e testa com o mago.
2. Levar o mago v2 para o jogo seguindo o Roteiro (seção 1.1).
3. Folhas reais do corpo-base → primeiro item rígido (cajado) testado nas 4 direções.
4. Animações que faltam: corrida, ataque com cajado, conjuração, magia em área, dano, morte.
5. Skin roxa pela linha de produção.
