# Estúdio Defenda e Ataque

Programa de Windows para criar os personagens, animações, equipamentos e efeitos do jogo **Defenda e Ataque** (Godot 4). Funciona sem internet.

## Testar no navegador

Abra o [Estúdio HTML no GitHub Pages](https://lsamuels0.github.io/estudio-defenda-e-ataque/app/) para testar a versão web. Os projetos criados no navegador ficam armazenados localmente neste navegador.

O site está publicado a partir da branch `main`; por isso, o endereço inclui `/app/`, onde está o ponto de entrada. A barra fixa inferior mantém o acesso à visão geral, personagens, produção, revisão de animações, efeitos, ferramentas e skills. As telas carregadas no palco compartilham a mesma paleta, tipografia e legenda.

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
| `app/` | O aplicativo (Electron). `index.html` shell unificado, `visao-geral.html` painel geral, `inicio.html` personagens, `personagem.html` tela do personagem e `producao.html` linha de produção |
| `app/nucleo/` | **Motor sem dependências** (tirar fundo, separar quadros, alinhar, suavizar, idle, conferência, rig, equipamentos). Roda igual no app e na linha de comando |
| `app/cli/` | Linha de comando para outras IAs e automação |
| `app/dados/personagens/` | Personagens que vêm com o app (hoje: o mago v2, com as folhas originais em `fonte/`) |
| `app/ferramentas/` | Ferramentas anteriores do Estúdio |
| `app/testes/` | Testes automáticos (rodam no GitHub a cada envio) |
| `skills/` | Regras canônicas para animação 2D, equipamentos modulares e efeitos; materiais de origem preservados para rastreabilidade |
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

A branch `main` contém a versão consolidada e executável do Estúdio. Para novas tarefas, use branches temáticas e Pull Requests revisados e testados antes de integrar na `main`, que permanece como versão estável.
