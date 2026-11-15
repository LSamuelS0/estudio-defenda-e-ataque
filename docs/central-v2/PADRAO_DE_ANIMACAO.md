# Protocolo de animação — Estúdio Central

## Objetivo
Usar um processo repetível para reduzir retrabalho e manter qualidade consistente entre heróis, humanoides e criaturas. O protocolo é comum a todas as entidades; timing, número de quadros e intensidade são ajustados ao peso, anatomia e personalidade de cada uma.

## Etapas de produção
1. **Definir intenção:** ação, emoção, direção, duração, loop ou ação única e leitura necessária no jogo.
2. **Planejar poses-chave:** pose inicial, antecipação quando fizer sentido, pose principal/contato, recuperação e pose final.
3. **Bloquear o movimento:** validar silhueta, centro de massa, equilíbrio, direção e espaçamento antes de polir detalhes.
4. **Refinar:** aplicar arcos, aceleração/desaceleração, sobreposição, follow-through e pequenas diferenças entre partes do corpo.
5. **Conferir continuidade:** testar em velocidade real, quadro a quadro, em fundo claro/escuro e nas direções necessárias.
6. **Aprovar e registrar:** salvar FPS, quadros, direção, loop, peças vinculadas, versão e checklist de qualidade.

## Princípios obrigatórios
- **Clareza antes de detalhe:** a ação precisa ser entendida pela silhueta.
- **Antecipação e recuperação:** usar quando a ação pedir preparação e consequência; não inserir pausas artificiais em todo movimento.
- **Timing e spacing:** quadros não devem avançar em intervalos mecanicamente iguais se isso prejudicar peso ou intenção. Usar holds e aceleração de forma intencional.
- **Arcos:** mãos, armas, cabeças, caudas e efeitos percorrem trajetórias coerentes, salvo movimentos deliberadamente angulares.
- **Peso e centro de massa:** saltos, impactos e passos precisam mostrar apoio, transferência de peso e consequência.
- **Volume consistente:** evitar deformações involuntárias, tremores de escala e mudanças de proporção entre quadros.
- **Overlap / follow-through:** cabelos, mantos, caudas, orelhas, partículas e acessórios respondem com atraso coerente.
- **Contato e apoio:** pés, mãos, armas e objetos não devem deslizar durante um contato que deveria estar fixo.
- **Loop limpo:** primeiro e último quadro precisam se conectar sem salto de posição, escala, luz ou velocidade.
- **Legibilidade no jogo:** testar no tamanho real de exibição, não apenas ampliado no editor.

## Referências iniciais por tipo
Estes números são pontos de partida, não leis universais. Ajustar com base no estilo desenhado, duração da ação e sensação de peso.

| Tipo | FPS inicial | Quadros iniciais | Repetição | Foco |
|---|---:|---:|---|---|
| Idle | 8 | 6 | Loop | Respiração, balanço sutil, assimetria natural |
| Caminhada | 12 | 8 | Loop | Alternância de apoio, deslocamento e retorno sem deslize |
| Corrida | 14 | 8 | Loop | Inclinação, impulso, suspensão e impacto |
| Ataque | 12 | 7 | Uma vez | Antecipação, arco da arma/membro, impacto e recuperação |
| Conjuração | 10 | 10 | Uma vez | Preparação, foco, gesto, liberação e dissipação |
| Impacto | 12 | 4 | Uma vez | Compressão, direção da força e recuperação |
| Morte | 10 | 8 | Uma vez | Perda de equilíbrio, queda e pose final legível |

## Checklist de aprovação
Uma animação não deve ser marcada como pronta apenas por ter todos os quadros desenhados. Revisar:
- Silhueta legível em todos os quadros.
- Arcos e trajetórias consistentes.
- Espaçamento sem saltos involuntários.
- Volume e proporções preservados.
- Apoios sem deslize quando aplicável.
- Sobreposição e follow-through naturais.
- Timing, pausas e acelerações intencionais.
- Loop/pose final conferidos.
- Teste no tamanho real e no contexto do jogo.

## Regra para criaturas e equipamentos
O mesmo protocolo serve a qualquer espécie. Criaturas sem pernas não precisam de checklist de pés; nesse caso validar contato com o chão, compressão, impulso, ondulação e continuidade da massa. Equipamentos devem acompanhar o osso/âncora correto sem atravessar o corpo, perder alinhamento ou mudar de escala entre direções.

## Limite desta etapa do software
A interface já registra padrões, fases e itens de validação localmente por entidade. A reprodução real da animação, edição de keyframes, onion skin, curvas de timing, preview sincronizado de armaduras/partículas e exportação ainda dependem da integração com os renderizadores e módulos legados.
