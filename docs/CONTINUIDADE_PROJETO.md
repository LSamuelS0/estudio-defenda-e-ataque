# Continuidade do Estúdio Defenda e Ataque

Data de referência: 8 de novembro de 2026

## Objetivo
Transformar o Estúdio Defenda e Ataque em software profissional para criação de jogos, com fluxos confiáveis de produção de arte 2D, personagens modulares, animação, efeitos, organização de assets, preview e exportação.

## Decisões da conversa móvel
- O Mago-base, derivado da imagem enviada no chat, será a primeira referência.
- Corpo-base inicial sem cajado, capa/capuz e armadura; manter o short de referência.
- Produzir vistas front, back, left e right, mantendo escala e proporções.
- O primeiro ciclo de caminhada terá 8 quadros por direção, fundo transparente, loop contínuo e ponto de apoio consistente. Oito quadros é referência inicial, não requisito imutável.
- Criar inspeção vetorial para landmarks, articulações e regiões corporais; revisar as sugestões de IA sobre a arte real.
- Equipamentos modulares declaram slots, regiões cobertas, máscara, âncoras/pivôs, ordem de desenho e compatibilidade.
- Corpo flexível; tecido com deformação moderada/secundária; armadura rígida com baixa deformação e volume preservado.
- Skills novas ficam em `skills/<skill>/SKILL.md`, com auxiliares e registro no catálogo.
- Fluxo combinado: `main` estável, `develop` para integração e branches temáticas com PRs.

## Estado verificado no GitHub
Repositório: [LSamuelS0/estudio-defenda-e-ataque](https://github.com/LSamuelS0/estudio-defenda-e-ataque)

- `skills/character-equipment-replacement/` e `skills/animacao-2d-pincel/` existem em `develop`.
- PR #1 e PR #2 estão fechados e marcados como mesclados em `develop`.
- O README da `main` era apenas o título do projeto antes desta proposta de documentação.
- A consulta não encontrou o código do editor nem `tools/estudio/index.html`, mencionado na skill de animação. A aplicação precisa ser localizada ou adicionada ao repositório.
- A pasta aberta no computador é um projeto Godot de Sobrevivência na Grécia Antiga, não um checkout Git; não foi considerada o código-fonte do Estúdio.

## Referências existentes
- `skills/character-equipment-replacement/SKILL.md`: anatomia, slots, máscaras, âncoras, sorting e materiais.
- `skills/character-equipment-replacement/equipment_resource.schema.json`: contrato de equipamento.
- `skills/animacao-2d-pincel/SKILL.md` e `regras-animacao-efeitos.md`: princípios de animação, critérios e efeitos.

Essas regras são documentação de produção e não provam que o aplicativo já implemente essas funções.

## Próximos passos
1. Localizar o checkout do editor e auditar stack, execução e módulos existentes.
2. Documentar arquitetura, formatos de projeto e estado real do produto.
3. Recuperar e aprovar a arte original do Mago-base.
4. Fixar resolução/célula do quadro e calibrar landmarks nas quatro vistas.
5. Produzir e revisar a caminhada sem deslizamento ou mudança de proporção.
6. Testar um item rígido com máscara e âncoras antes de generalizar o sistema.
7. Importar e reproduzir o resultado no engine alvo.

## Limite dos templates
O SVG e JSONs em `docs/personagens/` são templates esquemáticos. Não contêm coordenadas calibradas nem sprites finais. A conversa compartilhada não disponibiliza aqui a imagem de origem como arquivo de produção. Não declarar asset aprovado, rig preciso ou integração testada até validar a arte e o engine.
