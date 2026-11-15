# Estúdio Defenda e Ataque

Programa de Windows para criar os personagens, animações, equipamentos e efeitos do jogo **Defenda e Ataque** (Godot 4). Funciona sem internet.

O que ele faz sozinho:

- **Linha de produção**: você arrasta as folhas desenhadas (uma por direção) e ele tira o fundo branco, separa os quadros, alinha pelo pé, deixa as 4 direções na mesma escala, suaviza a borda, gera o idle respirando e exporta PNG + JSON no formato que o jogo lê.
- **Conferência automática** pelas regras das skills: sem serrilhado, pé firme, loop sem emenda, sempre em movimento, ritmo, nenhum fundo branco, volume estável.
- **Rig**: propõe os pontos do corpo (cabeça, pescoço, ombros, cotovelos, punhos, tronco, cintura, quadril, joelhos, tornozelos, pés) em cada quadro; você corrige arrastando.
- **Equipamentos**: recorta as peças de uma prancha, prende cada item a um ponto do rig (slot, âncora, ponto de pega, ordem de desenho, ocultar o corpo embaixo) e mostra o item acompanhando a animação.
- **Enviar para o jogo**: grava direto em `art/<personagem>/` na pasta do jogo e guarda o arquivo antigo como `.bak`.
- As ferramentas anteriores (Slimes, Mago por esqueleto, Efeitos em pincel, Movimento, Biblioteca) continuam dentro, em **Ferramentas**.

## Como baixar e abrir (Windows)

1. No GitHub, abra **Actions → Aplicativo Windows**, clique na execução mais recente e baixe **Estudio-Defenda-e-Ataque-Windows** em *Artifacts*.
2. Dentro do .zip há duas opções:
   - `Estudio-Defenda-e-Ataque-…-nsis.exe`: instalador (cria atalho na área de trabalho);
   - `Estudio-Defenda-e-Ataque-…-portatil.exe`: abre direto, sem instalar.
3. Na primeira vez o Windows pode avisar "aplicativo não reconhecido" (não é assinado): clique em **Mais informações → Executar assim mesmo**.

Os personagens ficam em **Documentos › Estúdio Defenda e Ataque › personagens** (uma pasta por personagem, com folhas, JSON e histórico).

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/` | O aplicativo (Electron). `index.html` Personagens, `personagem.html` tela do personagem, `producao.html` linha de produção, `guia.html` |
| `app/nucleo/` | **Motor sem dependências** (tirar fundo, separar quadros, alinhar, suavizar, idle, conferência, rig, equipamentos). Roda igual no app e na linha de comando |
| `app/cli/` | Linha de comando para outras IAs e automação |
| `app/dados/personagens/` | Personagens que vêm com o app (hoje: o mago v2, com as folhas originais em `fonte/`) |
| `app/ferramentas/` | Ferramentas anteriores do Estúdio |
| `app/testes/` | Testes automáticos (rodam no GitHub a cada envio) |
| `skills/` | Regras de qualidade para qualquer IA: animação em pincel e substituição de equipamentos |
| `docs/` | Roteiro para o jogo, arquitetura, referências visuais (pranchas do mago) |

## Para desenvolvedores e IAs

```bash
node app/testes/rodar.js                                            # testes do núcleo
node app/cli/estudio.js produzir app/dados/personagens/mago/fonte/receita.json
node app/cli/estudio.js conferir folha.png 274 278 6
cd app && npm install && npm start                                  # abrir o app (precisa de Node 20+)
cd app && npm run montar:windows                                    # instalador (no Windows)
```

Antes de mexer em arte, equipamento ou animação, leia a skill aplicável em [`skills/`](skills/README.md) e o [Roteiro para o jogo](docs/ROTEIRO_PARA_O_JOGO.md).

## Fluxo de branches

O trabalho atual está todo na branch `estudio-app`. Quando estiver aprovado, ela é mesclada em `main` (versão estável) e as branches antigas já mescladas podem ser apagadas.
