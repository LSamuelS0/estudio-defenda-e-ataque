# Skills do Estúdio Defenda e Ataque

Esta pasta reúne instruções portáteis para agentes de IA que colaboram no projeto. Antes de executar uma tarefa coberta por uma skill, leia o documento correspondente e siga suas regras.

## Catálogo

| Skill | Finalidade | Arquivo |
|---|---|---|
| Skill de animação | Referência única para animações 2D, personagens, equipamentos modulares, efeitos em pincel, inspeção anatômica, exportação e revisão de spritesheets | [skill-de-animacao/SKILL.md](skill-de-animacao/SKILL.md) |

A skill consolidada reúne o conteúdo que antes estava separado entre substituição de equipamentos e animação/efeitos. Os documentos de origem permanecem no repositório para rastreabilidade; use a skill acima como fonte canônica ao preparar prompts ou executar trabalho novo.

## Convenções para novas skills

- Cada skill fica em sua própria subpasta: `skills/<nome-da-skill>/`.
- O arquivo principal se chama `SKILL.md` e contém metadados `name` e `description` no início.
- Adicione referências auxiliares apenas quando forem necessárias para executar a skill.
- Diferencie claramente conceitos, protótipos e recursos testados.
- Atualize este catálogo quando uma nova skill for adicionada.
- Revise histórico e preserve compatibilidade antes de alterar uma skill existente.

## Instrução geral para agentes

Ao trabalhar neste repositório, verifique se há uma skill aplicável em `skills/` e leia-a antes de editar arquivos ou criar recursos. Se regras parecerem conflitantes, preserve a integridade dos assets e do projeto e documente a decisão.
