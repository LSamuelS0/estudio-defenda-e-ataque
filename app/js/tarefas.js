/* Fila para o trabalhador: Tarefas.rodar('produzir', dados, aoProgresso) -> Promise com o resultado. */
window.Tarefas = (() => {
  let w = null, seq = 0; const pend = new Map();
  function trabalhador() {
    if (w) return w;
    w = new Worker('js/trabalhador.js');
    w.onmessage = (ev) => {
      const { id, progresso, resultado, erro } = ev.data; const p = pend.get(id); if (!p) return;
      if (progresso) { p.prog && p.prog(progresso.texto, progresso.parte); return; }
      pend.delete(id); erro ? p.falha(new Error(erro)) : p.ok(resultado);
    };
    w.onerror = (e) => { for (const p of pend.values()) p.falha(new Error(e.message || 'Falha no processamento')); pend.clear(); w = null; };
    return w;
  }
  function rodar(tipo, dados, prog, transferir = []) {
    return new Promise((ok, falha) => { const id = ++seq; pend.set(id, { ok, falha, prog }); trabalhador().postMessage({ id, tipo, dados }, transferir); });
  }
  return { rodar };
})();
