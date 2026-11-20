(() => {
  const rotas = {
    personagens: { arquivo: "inicio.html", titulo: "Personagens" },
    producao: { arquivo: "producao.html", titulo: "Linha de produção" },
    animacoes: { arquivo: "ferramentas/biblioteca.html", titulo: "Animações" },
    efeitos: { arquivo: "ferramentas/efeitos.html", titulo: "Efeitos" },
    ferramentas: { arquivo: "ferramentas/index.html", titulo: "Ferramentas" },
    guia: { arquivo: "guia.html", titulo: "Guia e skills" },
  };
  const palco = document.getElementById("estudio-palco");
  const titulo = document.getElementById("estudio-titulo");
  const botoes = [...document.querySelectorAll("[data-rota]")];
  const nomes = { personagens: "Personagens", producao: "Linha de produção", animacoes: "Animações", efeitos: "Efeitos", ferramentas: "Ferramentas", guia: "Guia e skills" };
  let atual = "";

  function selecionar(nome, historico = true) {
    if (!rotas[nome]) nome = "personagens";
    atual = nome;
    palco.src = rotas[nome].arquivo;
    titulo.textContent = rotas[nome].titulo;
    botoes.forEach(b => {
      const ativo = b.dataset.rota === nome;
      b.setAttribute("aria-pressed", String(ativo));
      if (ativo) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (historico) history.pushState({ rota: nome }, "", "#" + nome);
  }

  function identificar(url) {
    const caminho = url.pathname.toLowerCase();
    if (caminho.endsWith("/producao.html")) return "producao";
    if (caminho.endsWith("/biblioteca.html")) return "animacoes";
    if (caminho.endsWith("/efeitos.html")) return "efeitos";
    if (caminho.endsWith("/guia.html")) return "guia";
    if (caminho.endsWith("/ferramentas/index.html")) return "ferramentas";
    return "personagens";
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
        b.setAttribute("aria-pressed", String(ativo));
        if (ativo) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      });
    } catch (erro) {
      console.warn("Não foi possível aplicar o tema unificado nesta tela.", erro);
    }
  });

  botoes.forEach(b => b.addEventListener("click", () => selecionar(b.dataset.rota)));
  window.addEventListener("popstate", () => selecionar(location.hash.slice(1), false));
  const inicial = rotas[location.hash.slice(1)] ? location.hash.slice(1) : "personagens";
  selecionar(inicial, !location.hash);
})();
