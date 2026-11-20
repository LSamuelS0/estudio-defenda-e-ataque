(() => {
  const rotas = {
    visao: { arquivo: "visao-geral.html", titulo: "Visão geral" },
    personagens: { arquivo: "studio.html", titulo: "Estúdio de personagens" },
    movimento: { arquivo: "movimento.html", titulo: "Movimento" },
    producao: { arquivo: "producao.html", titulo: "Produção de personagem" },
    efeitos: { arquivo: "ferramentas/efeitos.html", titulo: "Estúdio de efeitos" },
  };
  const palco = document.getElementById("estudio-palco");
  const titulo = document.getElementById("estudio-titulo");
  const botoes = [...document.querySelectorAll("[data-rota]")];
  const nomes = { visao: "Visão geral", personagens: "Heróis e criaturas", movimento: "Movimento", producao: "Produção de personagem", efeitos: "Estúdio de efeitos" };
  let atual = "";

  function selecionar(nome, historico = true) {
    if (!rotas[nome]) nome = "visao";
    atual = nome;
    palco.src = rotas[nome].arquivo;
    titulo.textContent = rotas[nome].titulo;
    botoes.forEach(b => {
      const ativo = b.dataset.rota === nome;
      if (ativo) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (historico) history.pushState({ rota: nome }, "", "#" + nome);
  }

  function identificar(url) {
    const caminho = url.pathname.toLowerCase();
    if (caminho.endsWith("/visao-geral.html")) return "visao";
    if (caminho.endsWith("/studio.html") || caminho.endsWith("/inicio.html") || caminho.endsWith("/personagem.html")) return "personagens";
    if (caminho.endsWith("/producao.html")) return "producao";
    if (caminho.endsWith("/movimento.html")) return "movimento";
    if (caminho.endsWith("/efeitos.html")) return "efeitos";
    return "visao";
  }

  palco.addEventListener("load", () => {
    try {
      const doc = palco.contentDocument;
      if (!doc || !doc.head) return;
      if (!doc.getElementById("estudio-unificado-css")) {
        const link = doc.createElement("link");
        link.id = "estudio-unificado-css";
        link.rel = "stylesheet";
        link.href = new URL("css/unificado.css", location.href).href;
        doc.head.appendChild(link);
      }
      const rotaInterna = identificar(new URL(palco.contentWindow.location.href));
      atual = rotaInterna;
      titulo.textContent = nomes[rotaInterna];
      botoes.forEach(b => {
        const ativo = b.dataset.rota === rotaInterna;
        if (ativo) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      });
    } catch (erro) {
      console.warn("Não foi possível aplicar o tema unificado nesta tela.", erro);
    }
  });

  botoes.forEach(b => b.addEventListener("click", () => selecionar(b.dataset.rota)));
  document.querySelector(".estudio-marca")?.addEventListener("click", evento => {
    evento.preventDefault();
    selecionar("visao");
  });
  window.addEventListener("popstate", () => selecionar(location.hash.slice(1), false));
  const inicial = rotas[location.hash.slice(1)] ? location.hash.slice(1) : "visao";
  selecionar(inicial, !location.hash);
})();
