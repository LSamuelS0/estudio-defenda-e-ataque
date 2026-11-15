# Arquitetura central — versão 1

## Princípio
Heróis, humanoides, monstros e criaturas usam o mesmo núcleo de dados e a mesma interface. A categoria e a espécie definem os recursos disponíveis, não um editor separado.

## Navegação
1. Página inicial: separa Heróis/Feiticeiros e Monstros/Criaturas.
2. Seleção de entidade: abre a mesma página `app/personagem.html?id=...` para qualquer entidade.
3. Abas comuns:
   - **Visualização**: prévia, camadas e árvore de ossos em modo somente leitura.
   - **Edição**: transformações, escala X/Y, posição, rotação, dimensão, opacidade e espelhamento.
   - **Adição**: cadastro separado de roupas/armaduras, skins, habilidades, partículas, ossos e drops.
   - **Inventário e drops**: slots, habilidades e loot no mesmo padrão de dados.

## Núcleo compartilhado
- `app/js/core.js`: carregamento do catálogo, configuração por entidade e persistência local.
- `app/data/entities.json`: registro de entidades e suas características.
- `app/personagem.html`: única interface de trabalho para todas as entidades.
- `app/js/workspace.js`: comportamento comum das abas.

## Contrato de entidade
Cada entidade tem `id`, `category`, `kind`, `species`, `slots`, `bones`, `equipment`, `abilities` e `loot`. Os slots e a árvore podem variar por espécie; a estrutura do editor não varia.

## Segurança de edição
A aba Visualização não contém controles de alteração. As mudanças ficam concentradas em Edição e Adição. Nesta primeira fundação, os valores são salvos no `localStorage` do navegador, separados pelo ID da entidade.

## Limites desta etapa
Esta versão cria a navegação central, o contrato de dados e os formulários iniciais. Ainda não conecta todos os renderizadores antigos, não importa automaticamente os equipamentos existentes e não transforma os rascunhos em sprites prontos. A integração com `mago.html`, `slimes.html`, `efeitos.html`, `biblioteca.html` e `movimento.html` será feita gradualmente, preservando os módulos originais.


## Evolução da etapa 2
A interface de edição registra transformações por peça, metadados de hierarquia, padrões de animação e parâmetros de partículas no armazenamento local por entidade. O protocolo de animação está descrito em `PADRAO_DE_ANIMACAO.md`. A interface é compartilhada entre categorias; os dados específicos (esqueleto, slots, movimentos e assets) continuam definidos por entidade.
