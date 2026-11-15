# Plano do Estúdio (atualizado 08/11/2026)

Visão: um programa de Windows que leva qualquer personagem, animação, equipamento ou efeito da folha desenhada até o jogo, conferindo a qualidade sozinho. Plano original do ChatGPT preservado em `docs/central-v2/PLANO_DE_EVOLUCAO.md`.

| Etapa | Situação |
|---|---|
| 0. Base e rastreabilidade (código no repositório, testes, CI) | ✔ feito |
| 1. Fundação (projetos persistentes em Documentos, histórico, abrir/salvar) | ✔ feito (sem desfazer/refazer ainda) |
| 2. Inspeção de personagem (rig por quadro, proposto + revisado) | ✔ primeira versão |
| 3. Equipamento modular (slot, âncora, pega, ordem, ocultar corpo, schema) | ✔ itens rígidos · ✘ tecido com atraso |
| 4. Animação (linha de produção, idle, onion skin, conferência) | ✔ andar + idle · ✘ editor de timeline/keyframes |
| 5. Efeitos e partículas | ferramenta antiga (Efeitos em pincel) · ✘ editor unificado de emissores |
| 6. Exportação Godot (PNG + JSON, enviar para pasta do jogo com .bak) | ✔ feito |
| 7. Qualidade profissional (instalador, autoteste, guia) | ✔ instalador e portátil via GitHub Actions · ✘ assinatura do .exe |

Próximas entregas grandes: timeline de keyframes para ataque/conjuração; capa com atraso (cadeia de ossos secundária); editor de partículas comum; geração de arte por API (opcional).
