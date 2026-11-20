# Estúdio Defenda e Ataque

Aplicação web estática para revisar animações 2D, organizar personagens e equipamentos e editar efeitos.

## Acesso

GitHub Pages serve a aplicação em `app/index.html`. A navegação fixa leva a Visão geral, Personagens, Movimento, Produção e Efeitos. Personagens abre a bancada com catálogo lateral, filtros e workspace integrado. Para abrir a versão publicada, use:

https://lsamuels0.github.io/estudio-defenda-e-ataque/app/

## Áreas

- **Personagens (Bancada):** layout no estilo Blender. À esquerda, a lista de personagens (recolhível). No centro, a barra de ferramentas (Selecionar, Malha, Roupa, Rig, Visão, Anotar), o palco e a linha do tempo. À direita, três hierarquias que recolhem e maximizam:
  - **Camadas:** 0 corpo base (nu) · 1 luvas · 2 peitoral · 3 calça · 4 botas · 5 capacete · 6 armas. Cada camada guarda o seu conjunto de peças, com uma peça ativa por vez e um olho para mostrar ou ocultar a camada. A camada maior é desenhada por cima.
  - **Rig:** hierarquia de ossos; selecionar, arrastar no palco ou digitar X/Y por quadro.
  - **Efeitos:** efeitos ligados ao personagem, com o ponto do corpo onde nascem e uma prévia leve.
  O painel está completo para heróis. Os Slimes ainda abrem o visualizador próprio e recebem o mesmo painel numa próxima etapa. Atalhos: Q, M, G, R, V e N para as ferramentas, espaço para tocar e setas para trocar de quadro.
- **Movimento:** seleção de personagem para revisão dos ciclos disponíveis.
- **Produção:** abre o workspace de personagem com rig e equipamentos/camadas.
- **Efeitos:** mantém o estúdio dedicado a efeitos e magias.
- **Skills:** as referências de produção continuam versionadas no diretório `skills/`.

Os arquivos base dos personagens continuam em `app/dados/personagens/`.

## Regras de importação
- **Textura em qualidade excelente:** sem serrilhado que não seja da textura, sem franja branca, restos de fundo, linhas guia ou marcas de edição, sem deformar. Esquerda e direita olham para lados opostos, com o mesmo rosto e o mesmo cabelo. Detalhes na seção 2.1 de `skills/animacao-2d-pincel/SKILL.md`; processo de referência em `app/cli/importacao/`.
- **Rig único:** definido na frente, com todos os pontos ligados. Costas e laterais nascem girando o rig da frente ("Girar rig da frente" na ferramenta Rig) e depois recebem o pente-fino. A remoção da antiga ferramenta do Mago não removeu seus dados nem seus sprites.
