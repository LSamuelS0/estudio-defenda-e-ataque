# Skills do Estúdio Defenda e Ataque

Esta pasta reúne instruções portáteis para agentes de IA que colaboram no projeto. Antes de executar uma tarefa coberta por uma skill, leia o documento correspondente e siga suas regras.

## Catálogo

| Skill | Finalidade | Arquivo |
|---|---|---|
| Substituição inteligente de roupas e equipamentos 2D | Mapear regiões corporais, aplicar máscaras, posicionar equipamentos, preservar volumes e adaptar peças às animações | [character-equipment-replacement/SKILL.md](character-equipment-replacement/SKILL.md) |

## Convenções para novas skills

- Cada skill deve ficar em sua própria subpasta: `skills/<nome-da-skill>/`.
- O arquivo principal deve se chamar `SKILL.md` e conter metadados `name` e `description` no início.
- Incluir referências auxiliares (JSON Schema, exemplos, checklists) na mesma subpasta.
- Escrever regras operacionais, pré-requisitos, fluxo de trabalho, validação e limitações.
- Diferenciar claramente conceitos, protótipos e recursos testados.
- Atualizar este catálogo sempre que uma nova skill for adicionada.
- Não sobrescrever uma skill existente sem revisar seu histórico e preservar compatibilidade.

## Instrução geral para agentes

Ao trabalhar neste repositório, verifique primeiro se existe uma skill aplicável em `skills/`. Leia-a antes de editar arquivos ou criar recursos. Se duas skills parecerem conflitar, preserve as regras de segurança e integridade do projeto e documente a divergência antes de prosseguir.
