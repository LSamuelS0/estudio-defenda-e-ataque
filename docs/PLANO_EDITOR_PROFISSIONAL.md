# Plano do Estúdio Defenda e Ataque

## Visão do produto
Um editor integrado para criar jogos 2D, começando por organização de projetos e assets, inspeção anatômica, equipamentos modulares, animação, efeitos, preview e exportação. Cada etapa deve entregar um fluxo pequeno, estável e demonstrável.

## Estado inicial observado
O GitHub contém skills e contratos, mas não encontramos o código da aplicação nos caminhos verificados. Localizar a arquitetura antes de escolher framework, persistência ou formato. Godot é o engine de destino citado nas regras, não necessariamente a tecnologia do editor.

## Etapas

### 0. Base e rastreabilidade
Localizar checkout, stack, comandos de execução/build, dependências e funcionalidades existentes. Definir branches, changelog e política para binários grandes. Saída: arquitetura e instruções reproduzíveis.

### 1. Fundação do editor
Criar/abrir projeto; salvar, reabrir e recuperar; biblioteca de assets com importação, miniaturas, metadados e busca; canvas com seleção/zoom/pan; undo/redo. Saída: projeto de demonstração persistente.

### 2. Inspeção de personagem
Importar imagem; definir transparência, escala, caixa e apoio; marcar landmarks e regiões por direção; salvar coordenadas normalizadas com resolução, versão e revisão; exportar SVG e JSON. Saída: Mago-base anotado nas quatro vistas e revisado por artista.

### 3. Equipamento modular
Definir arquétipos, slots, cobertura, máscaras, âncoras, pivôs e draw order; detectar conflitos, frestas e assets ausentes; trocar/remover item sem alterar o corpo-base. Saída: personagem equipável com conjunto de teste.

### 4. Animação 2D
Organizar quadros, grade, FPS, pivô, eventos e loop; timeline e onion skin; preview alinhado pelo apoio; analisar deriva e volume; correções por quadro. Saída: quatro caminhadas e um teste de equipamento rígido.

### 5. Efeitos e biblioteca
Compor efeitos em camadas; pré-visualizar loop e rajada; aplicar verificações explicáveis das skills sem bloquear decisões artísticas; versionar assets e presets. Saída: efeito demonstrativo integrado.

### 6. Preview e exportação
Exportar spritesheets e metadados em presets versionados; validar caminhos, alpha, dimensões e recursos ausentes; testar integração com engine alvo. Saída: pacote reproduzível, importado e documentado.

### 7. Qualidade profissional
Autosave/recuperação, atalhos, acessibilidade, mensagens úteis, testes de compatibilidade e desempenho, releases e migração de formatos. Saída: versão instalável com projeto exemplo e guia.

## Priorização
Após localizar o código, implementar um recorte vertical: importar o Mago-base, anotar uma direção, salvar e reabrir os metadados. Não iniciar timeline, sistema completo de armaduras e exportador ao mesmo tempo.

## Decisões para arquitetura
- Stack e runtime do editor.
- Formato canônico e migração.
- SVG puro ou modelo JSON com SVG derivado.
- Quadros individuais, atlas ou spritesheet.
- Engines de destino e primeira integração.
- Limites de tamanho e armazenamento de binários no GitHub.

## Critério de pronto
Uma etapa só termina quando os dados persistem, o fluxo é repetível em um projeto de exemplo, os critérios de validação são observáveis e as limitações estão documentadas. Conceito, template e asset de produção são estados distintos.
