/*
 * Armazém de personagens: onde ficam os personagens e seus arquivos.
 *  - Aplicativo do Windows: Documentos\Estúdio Defenda e Ataque\personagens\<id>\ (arquivos de verdade, fáceis de copiar e versionar).
 *  - Navegador (teste): IndexedDB do navegador.
 * Os personagens que vêm com o aplicativo (app/dados/personagens) são só leitura: ao salvar, o Estúdio grava uma cópia
 * na pasta do usuário com o mesmo id, que passa a valer no lugar da original (o original nunca é alterado).
 */
window.Armazem = (() => {
  const desk = window.estudioDesktop || null;
  // todas as páginas do aplicativo ficam na raiz de app/, então "dados/" é relativo a elas
  const BASE_APP = new URL('dados/', document.baseURI).href;

  // ---------- IndexedDB (modo navegador)
  let dbP = null;
  function db() {
    if (!dbP) dbP = new Promise((ok, erro) => {
      const r = indexedDB.open('estudio-defenda-e-ataque', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('arquivos');
      r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
    });
    return dbP;
  }
  async function idb(modo, fn) { const d = await db(); return new Promise((ok, erro) => { const t = d.transaction('arquivos', modo); const s = t.objectStore('arquivos'); const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error); }); }

  // ---------- leitura/gravação genérica na pasta do usuário
  async function lerUsuario(rel) {
    if (desk) { const b = await desk.dados.ler(rel); return b ? new Uint8Array(b) : null; }
    const v = await idb('readonly', s => s.get(rel)); return v ? new Uint8Array(v) : null;
  }
  async function gravarUsuario(rel, bytes) {
    if (bytes instanceof Blob) bytes = new Uint8Array(await bytes.arrayBuffer());
    if (typeof bytes === 'string') bytes = new TextEncoder().encode(bytes);
    if (desk) return desk.dados.gravar(rel, bytes);
    return idb('readwrite', s => s.put(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), rel));
  }
  async function listarUsuario(prefixo) {
    if (desk) return (await desk.dados.listar(prefixo)).map(x => prefixo + '/' + x.caminho);
    const chaves = await idb('readonly', s => s.getAllKeys()); return (chaves || []).filter(k => k.startsWith(prefixo + '/'));
  }

  const urlsCriadas = [];
  async function urlUsuario(rel) {
    if (desk) return 'estudio://dados/' + rel.split('/').map(encodeURIComponent).join('/') + '?v=' + Date.now();
    const b = await lerUsuario(rel); if (!b) return null;
    const u = URL.createObjectURL(new Blob([b], { type: rel.endsWith('.json') ? 'application/json' : 'image/png' })); urlsCriadas.push(u); return u;
  }

  // ---------- catálogo
  async function catalogoApp() {
    try { const r = await fetch(BASE_APP + 'entidades.json'); return (await r.json()).personagens || []; } catch { return []; }
  }
  async function listar() {
    const lista = new Map();
    for (const id of await catalogoApp()) {
      try { const p = await (await fetch(BASE_APP + 'personagens/' + id + '/personagem.json')).json(); lista.set(p.id, { ...p, origem: 'app' }); } catch { /* sem arquivo */ }
    }
    const arquivos = await listarUsuario('personagens');
    for (const rel of arquivos.filter(r => /^personagens\/[^/]+\/personagem\.json$/.test(r))) {
      try {
        const p = JSON.parse(new TextDecoder().decode(await lerUsuario(rel)));
        const doApp = lista.get(p.id); if (doApp && (doApp.versaoBase || 0) > (p.versaoBase || 0)) continue; // cópia de uma versão antiga
        lista.set(p.id, { ...p, origem: 'usuario' });
      } catch { /* corrompido: ignora */ }
    }
    return [...lista.values()];
  }
  async function abrir(id) {
    let doUsuario = await lerUsuario('personagens/' + id + '/personagem.json');
    if (doUsuario) {
      // o app trouxe uma versão nova da base (ex.: Mago v3): a cópia salva antes no navegador/pasta fica de lado
      try {
        const r = await fetch(BASE_APP + 'personagens/' + id + '/personagem.json');
        if (r.ok) { const app = await r.json(); const u = JSON.parse(new TextDecoder().decode(doUsuario)); if ((app.versaoBase || 0) > (u.versaoBase || 0)) doUsuario = null; }
      } catch { /* sem cópia no app */ }
    }
    let p, origem;
    if (doUsuario) { p = JSON.parse(new TextDecoder().decode(doUsuario)); origem = 'usuario'; }
    else { const r = await fetch(BASE_APP + 'personagens/' + id + '/personagem.json'); if (!r.ok) throw new Error('Personagem não encontrado: ' + id); p = await r.json(); origem = 'app'; }
    const url = async nome => {
      const doU = origem === 'usuario' ? await lerUsuario('personagens/' + id + '/' + nome) : null;
      if (doU) return urlUsuario('personagens/' + id + '/' + nome);
      return BASE_APP + 'personagens/' + id + '/' + nome;
    };
    const lerJSON = async nome => (await fetch(await url(nome))).json();
    return { p, origem, url, lerJSON };
  }
  /** Salva o personagem e arquivos novos (nome -> bytes/Blob). Registra a mudança no histórico. */
  async function salvar(p, arquivos = {}, acao = 'alteração') {
    p.historico = (p.historico || []).concat([{ data: new Date().toISOString(), acao }]).slice(-50);
    for (const nome in arquivos) await gravarUsuario('personagens/' + p.id + '/' + nome, arquivos[nome]);
    // arquivos que só existem no app (ex.: folhas originais) são copiados na primeira gravação
    const atual = await lerUsuario('personagens/' + p.id + '/personagem.json');
    let antiga = false; try { antiga = !!atual && (JSON.parse(new TextDecoder().decode(atual)).versaoBase || 0) < (p.versaoBase || 0); } catch { antiga = true; }
    if (!atual || antiga) {
      for (const nome of p.arquivos || []) {
        if (arquivos[nome]) continue;
        try { const r = await fetch(BASE_APP + 'personagens/' + p.id + '/' + nome); if (r.ok) await gravarUsuario('personagens/' + p.id + '/' + nome, new Uint8Array(await r.arrayBuffer())); } catch { /* ok */ }
      }
    }
    p.arquivos = [...new Set([...(p.arquivos || []), ...Object.keys(arquivos)])];
    await gravarUsuario('personagens/' + p.id + '/personagem.json', JSON.stringify(p, null, 1));
    return p;
  }

  // ---------- enviar para o jogo
  async function pastaJogo() { return desk ? desk.jogo.pasta() : null; }
  async function escolherPastaJogo() { return desk ? desk.jogo.escolher() : null; }
  /** arquivos: { 'art/mago/mago_andar.json': bytes, ... }. No Windows grava direto na pasta do jogo (guarda .bak); no navegador baixa um .zip. */
  async function enviarParaJogo(arquivos, nomeZip = 'pacote_jogo.zip') {
    const conv = async v => v instanceof Blob ? new Uint8Array(await v.arrayBuffer()) : typeof v === 'string' ? new TextEncoder().encode(v) : v;
    if (desk) {
      let pasta = await desk.jogo.pasta(); if (!pasta) pasta = await desk.jogo.escolher(); if (!pasta) return { ok: false, motivo: 'Nenhuma pasta escolhida' };
      const feitos = []; for (const rel in arquivos) feitos.push(await desk.jogo.gravar(rel, await conv(arquivos[rel])));
      return { ok: true, pasta, feitos };
    }
    const zip = new JSZip(); for (const rel in arquivos) zip.file(rel, await conv(arquivos[rel]));
    baixar(await zip.generateAsync({ type: 'blob' }), nomeZip); return { ok: true, zip: nomeZip };
  }
  function baixar(blob, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function abrirPastaPersonagens() { if (desk) return desk.dados.abrirPasta('personagens'); return null; }

  return { desktop: !!desk, listar, abrir, salvar, enviarParaJogo, pastaJogo, escolherPastaJogo, baixar, abrirPastaPersonagens, BASE_APP };
})();
