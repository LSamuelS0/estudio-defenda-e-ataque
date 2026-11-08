# Estúdio Defenda e Ataque

Projeto de um editor integrado para criação de jogos 2D, começando por fluxos de produção de personagens, equipamentos, animações e efeitos.

## Estado atual

O repositório contém a biblioteca de skills e seus contratos de trabalho. A aplicação do editor ainda precisa ser localizada ou adicionada: os caminhos verificados não incluem o código do aplicativo nem `tools/estudio/index.html`, citado na skill de animação. Consulte [Continuidade do projeto](docs/CONTINUIDADE_PROJETO.md) para o estado verificado e [Plano do editor](docs/PLANO_EDITOR_PROFISSIONAL.md) para as próximas etapas.

## Estrutura

- `skills/`: instruções portáteis para criação de assets e colaboração de IA.
- `docs/`: decisões de produto, continuidade, roadmap e contratos de personagem.
- `docs/personagens/`: templates para referência, rig e inspeção do Mago-base.

## Fluxo de contribuição

- `main` é a linha estável.
- `develop` recebe trabalho integrado.
- Desenvolva em uma branch temática e abra Pull Request para `develop`.
- Não declare templates como assets calibrados nem integração como concluída sem validar os arquivos no aplicativo/engine.

## Skills

Leia [o catálogo de skills](skills/README.md) e siga a skill aplicável antes de alterar arte, equipamento ou animação.
