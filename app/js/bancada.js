/*
 * Bancada no estilo Blender.
 *   Esquerda: lista de personagens (recolhível).
 *   Centro:   barra de ferramentas (Selecionar, Malha, Roupa, Rig, Visão, Anotar), palco e linha do tempo.
 *   Direita:  três hierarquias recolhíveis/maximizáveis — Camadas (0 corpo nu … 6 armas), Rig e Efeitos.
 * O mesmo painel serve para qualquer personagem; por enquanto ele está completo para heróis
 * (personagens com folhas de sprite). Slimes abrem o visualizador próprio até o painel ser clonado para eles.
 */
(async () => {
  const N = window.EstudioNucleo; const { esc } = Comum;
  if (window.top !== window) document.body.classList.add('em-casca'); // dentro do Estúdio a marca já aparece no topo
  const $ = s => document.querySelector(s);
  const DIRS = N.DIRECOES;

  // ------------------------------------------------------------ camadas
  // A ordem das camadas é a ordem de desenho: a camada maior fica por cima.
  const CAMADAS = [
    { n: 0, nome: 'Corpo base', desc: 'personagem nu, sem roupa', slot: null, ancora: null },
    { n: 1, nome: 'Luvas', slot: 'hands', ancora: 'wrist_right', slots: ['hands', 'forearms'] },
    { n: 2, nome: 'Peitoral', slot: 'chest', ancora: 'chest_center', slots: ['chest', 'shoulders', 'back', 'upper_arms', 'neck', 'accessories'] },
    { n: 3, nome: 'Calça', slot: 'legs', ancora: 'hip_center', slots: ['legs', 'waist'] },
    { n: 4, nome: 'Botas', slot: 'feet', ancora: 'ankle_right', slots: ['feet'] },
    { n: 5, nome: 'Capacete', slot: 'head', ancora: 'head_center', slots: ['head'] },
    { n: 6, nome: 'Armas', slot: 'main_hand', ancora: 'hand_main', slots: ['main_hand', 'off_hand'] },
  ];
  const camadaDoSlot = slot => (CAMADAS.find(c => c.slots && c.slots.includes(slot)) || CAMADAS[2]).n;
  const camadaDe = it => (it.camada != null ? it.camada : camadaDoSlot(it.slot));

  const CORES_EFEITO = { fogo: '#ff9a55', agua: '#6cc4ff', 'água': '#6cc4ff', ar: '#c4f1ee', terra: '#d0aa72', arcano: '#b48cff', orbe: '#b48cff' };
  const corEfeito = nome => { const t = String(nome || '').toLowerCase(); for (const k in CORES_EFEITO) if (t.includes(k)) return CORES_EFEITO[k]; return '#9fd7ff'; };

  // ------------------------------------------------------------ estado
  let entradas = [], entrada = null, pendente = null;
  let ab = null, p = null, sujo = false;
  let cache = {}, propostas = {}, imgItens = {};
  const sel = { anim: null, dir: 'frente' };
  let ferramenta = 'selecionar', itemSel = null, ossoSel = null;
  let modoRoupa = 'mover', escopoRoupa = 'todos', corNota = '#e4be70';
  let quadrosCompostos = null, pedido = 0;

  const palco = new Palco($('#bc-palco'));
  palco.mostrarPivo = true; palco.mostrarPontos = false;

  const ui = (() => { try { return JSON.parse(localStorage.getItem('bancada-ui') || '{}'); } catch { return {}; } })();
  const guardarUI = () => { try { localStorage.setItem('bancada-ui', JSON.stringify(ui)); } catch { /* sem armazenamento */ } };

  function marcarSujo(v = true) {
    sujo = v; $('#bc-estado').textContent = v ? '● Alterações não salvas' : '';
  }
  function avisoTemporario(t) { $('#bc-estado').textContent = t; setTimeout(() => { $('#bc-estado').textContent = sujo ? '● Alterações não salvas' : ''; }, 2200); }

  // ------------------------------------------------------------ painéis (recolher, maximizar, esconder colunas)
  document.querySelectorAll('.bc-painel').forEach(painel => {
    const nome = painel.dataset.painel; const col = painel.closest('.bc-coluna');
    if (ui['fechado-' + nome]) painel.classList.remove('aberto');
    painel.querySelector('[data-acao=recolher]').onclick = () => {
      const aberto = painel.classList.toggle('aberto'); painel.querySelector('[data-acao=recolher]').setAttribute('aria-expanded', aberto);
      if (!aberto && painel.classList.contains('max')) { painel.classList.remove('max'); col.classList.remove('tem-max'); }
      ui['fechado-' + nome] = !aberto; guardarUI();
    };
    const max = painel.querySelector('[data-acao=maximizar]');
    if (max) max.onclick = () => {
      const ja = painel.classList.contains('max');
      col.querySelectorAll('.bc-painel').forEach(x => x.classList.remove('max'));
      col.classList.toggle('tem-max', !ja);
      if (!ja) { painel.classList.add('max', 'aberto'); }
    };
  });
  function colunas() {
    $('#bc-corpo').classList.toggle('sem-esq', !!ui.semEsq); $('#bc-corpo').classList.toggle('sem-dir', !!ui.semDir);
    $('#bc-esquerda').hidden = !!ui.semEsq; $('#bc-mostrar-esq').hidden = !ui.semEsq;
    $('#bc-direita').hidden = !!ui.semDir; $('#bc-mostrar-dir').hidden = !ui.semDir;
    requestAnimationFrame(() => palco.desenhar());
  }
  $('#bc-esconder-esq').onclick = () => { ui.semEsq = true; guardarUI(); colunas(); };
  $('#bc-mostrar-esq').onclick = () => { ui.semEsq = false; guardarUI(); colunas(); };
  $('#bc-esconder-dir').onclick = () => { ui.semDir = true; guardarUI(); colunas(); };
  $('#bc-mostrar-dir').onclick = () => { ui.semDir = false; guardarUI(); colunas(); };
  colunas();

  // ------------------------------------------------------------ lista de personagens
  try {
    const [lista, cat] = await Promise.all([Armazem.listar(), fetch('dados/entidades.json').then(r => r.json())]);
    entradas = lista.map(x => ({ id: x.id, nome: x.nome, tipo: x.categoria === 'heroi' ? 'heroi' : 'monstro', elem: 'comum', cor: '#c9a96e', fonte: 'sprite' }));
    for (const a of cat.atalhos || []) {
      const elem = a.especie === 'slime' ? (/agua|fogo|terra|ar/.exec(a.id) || ['comum'])[0] : 'comum';
      entradas.push({ id: a.id, nome: a.nome, tipo: a.especie === 'slime' ? 'slime' : 'monstro', elem, cor: a.cor || '#8ebd87', fonte: 'externo', url: a.ferramenta || 'ferramentas/slimes.html' });
    }
  } catch (e) { $('#bc-lista').innerHTML = '<p class="bc-mudo">' + esc(e.message) + '</p>'; }

  function desenharLista() {
    const q = $('#bc-busca').value.trim().toLowerCase(), t = $('#bc-filtro-tipo').value, el = $('#bc-filtro-elem').value;
    const vis = entradas.filter(x => (t === 'todos' || x.tipo === t) && (el === 'todos' || x.elem === el) && (!q || x.nome.toLowerCase().includes(q)));
    const grupos = [['heroi', 'Heróis', '♙'], ['slime', 'Slimes', '◉'], ['monstro', 'Monstros', '♟']];
    $('#bc-lista').innerHTML = grupos.map(([k, nome, ic]) => {
      const itens = vis.filter(x => x.tipo === k); if (!itens.length) return '';
      return '<div class="bc-grupo-titulo">' + nome + ' · ' + itens.length + '</div>' + itens.map(x =>
        `<div class="bc-no bc-personagem" role="button" tabindex="0" data-ent="${esc(x.id)}" aria-selected="${entrada && entrada.id === x.id}">
          <span class="bc-icone-p" style="color:${esc(x.cor)}">${ic}</span>
          <span class="bc-no-nome"><b>${esc(x.nome)}</b><small>${esc(x.elem === 'comum' ? (k === 'heroi' ? 'Herói' : 'Comum') : x.elem)}</small></span>
          <span class="bc-tag${x.fonte === 'sprite' ? ' ok' : ''}">${x.fonte === 'sprite' ? 'painel' : 'visual.'}</span></div>`).join('');
    }).join('') || '<p class="bc-mudo">Nada encontrado.</p>';
    $('#bc-lista').querySelectorAll('[data-ent]').forEach(b => {
      const ir = () => pedirAbrir(entradas.find(x => x.id === b.dataset.ent));
      b.onclick = ir; b.onkeydown = e => { if (e.key === 'Enter') ir(); };
    });
  }
  ['#bc-busca', '#bc-filtro-tipo', '#bc-filtro-elem'].forEach(s => $(s).addEventListener('input', desenharLista));
  desenharLista();

  function pedirAbrir(x) {
    if (!x || (entrada && entrada.id === x.id)) return;
    if (sujo) { pendente = x; $('#bc-confirmar').showModal(); return; }
    abrir(x);
  }
  $('#bc-confirmar').addEventListener('close', async () => {
    const x = pendente; pendente = null; const r = $('#bc-confirmar').returnValue;
    if (!x || r === 'ficar') return;
    if (r === 'salvar') { try { await salvar('Bancada: alterações salvas'); } catch (e) { alert('Não foi possível salvar: ' + e.message); return; } }
    marcarSujo(false); abrir(x);
  });
  window.addEventListener('beforeunload', e => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });

  // ------------------------------------------------------------ abrir personagem
  async function abrir(x) {
    entrada = x; desenharLista(); itemSel = null; ossoSel = null; quadrosCompostos = null;
    $('#bc-nome').textContent = x.nome; $('#bc-tipo').textContent = x.tipo === 'heroi' ? 'HERÓI' : x.tipo === 'slime' ? 'SLIME' : 'MONSTRO';
    $('#bc-vazio').hidden = true;
    if (x.fonte !== 'sprite') {
      // Slimes ainda são gerados por código no visualizador próprio; o painel será clonado para eles.
      p = null; ab = null; $('#bc-palco').hidden = true; $('#bc-linha-tempo').hidden = true; $('#bc-ficha').hidden = true; $('#bc-salvar').disabled = true;
      const fr = $('#bc-externo'); fr.hidden = false; if (!fr.src.endsWith(x.url)) fr.src = x.url;
      document.querySelectorAll('[data-ferr]').forEach(b => b.disabled = true); $('#bc-opcoes').innerHTML = '';
      const nota = '<p class="bc-nota">O painel de ' + esc(x.nome) + ' ainda usa o visualizador próprio. Quando o painel do herói estiver finalizado, ele será clonado para os Slimes com as mesmas camadas, rig e efeitos.</p>';
      $('#bc-camadas').innerHTML = nota; $('#bc-props').hidden = true; $('#bc-rig').innerHTML = nota; $('#bc-rig-props').innerHTML = ''; $('#bc-efeitos').innerHTML = nota;
      $('#bc-dica').textContent = ''; return;
    }
    $('#bc-externo').hidden = true; $('#bc-palco').hidden = false; $('#bc-linha-tempo').hidden = false;
    document.querySelectorAll('[data-ferr]').forEach(b => b.disabled = false);
    $('#bc-camadas').innerHTML = $('#bc-rig').innerHTML = $('#bc-efeitos').innerHTML = '<p class="bc-mudo">Carregando…</p>';
    try { ab = await Armazem.abrir(x.id); } catch (e) { $('#bc-camadas').innerHTML = '<p class="bc-aviso">' + esc(e.message) + '</p>'; return; }
    p = ab.p; cache = {}; propostas = {}; imgItens = {};
    p.rig = p.rig || {}; p.revisado = p.revisado || {}; p.equipamentos = p.equipamentos || []; p.habilidades = p.habilidades || [];
    p.camadasVisiveis = p.camadasVisiveis || {}; if (p.studioBodyVisible === false) p.camadasVisiveis[0] = false;
    p.notas = p.notas || [];
    if (!p.efeitos) p.efeitos = p.habilidades.filter(h => h.efeito).map(h => ({ id: h.id, nome: h.nome, efeito: h.efeito, ancora: 'hand_main', ativo: false }));
    for (const it of p.equipamentos) if (it.camada == null) it.camada = camadaDoSlot(it.slot);
    sel.anim = Object.keys(p.animacoes || {})[0]; sel.dir = 'frente';
    $('#bc-ficha').hidden = false; $('#bc-ficha').href = 'personagem.html?id=' + encodeURIComponent(p.id);
    $('#bc-salvar').disabled = false; marcarSujo(false);
    palco.desloc = [0, 0]; palco.zoom = 0; palco.k = 0; palco.tocando = true;
    montarLinhaTempo();
    await atualizarPalco(true);
    desenharCamadas(); desenharRig(); desenharEfeitos(); aplicarFerramenta();
  }

  async function salvar(acao) {
    if (!p) return;
    p.studioBodyVisible = visivel(0);
    p = await Armazem.salvar(p, {}, acao || 'Bancada: alterações salvas'); ab = await Armazem.abrir(p.id);
    marcarSujo(false); avisoTemporario('Salvo ✔');
  }
  $('#bc-salvar').onclick = () => salvar().catch(e => alert('Não foi possível salvar: ' + e.message));

  // ------------------------------------------------------------ animação e composição
  const bytesDe = c => ({ w: c.width, h: c.height, bytes: c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data });
  async function carregar(anim, dir) {
    const k = anim + '/' + dir; if (cache[k]) return cache[k];
    const meta = await ab.lerJSON(p.animacoes[anim]);
    const d = meta.direcoes[dir] ? dir : Object.keys(meta.direcoes)[0];
    const quadros = await ImagemWeb.fatiarFolha(await ab.url(meta.direcoes[d].arquivo), meta);
    return (cache[k] = { meta, quadros, fps: meta.fps || meta.fps_ref || 10 });
  }
  async function landmarksDe(anim, dir) {
    p.rig[anim] = p.rig[anim] || {};
    const a = await carregar(anim, dir); const k = anim + '/' + dir;
    if (!propostas[k]) propostas[k] = await Tarefas.rodar('landmarks', { quadros: a.quadros.map(bytesDe), opcoes: { corDestaque: [0.3, 0.55, 1] } });
    if (!p.rig[anim][dir]) {
      // o rig é um só: as outras vistas nascem girando o rig da frente
      const girado = dir !== 'frente' ? await rigGirado(anim, dir) : null;
      p.rig[anim][dir] = girado || JSON.parse(JSON.stringify(propostas[k]));
    }
    return p.rig[anim][dir];
  }
  const medidas = {};
  async function medidasDe(anim, dir) {
    const k = anim + '/' + dir; if (medidas[k]) return medidas[k];
    const a = await carregar(anim, dir); return (medidas[k] = a.quadros.map(c => N.medidasSilhueta(ImagemWeb.canvasParaNucleo(c))));
  }
  /** Rig da vista 'dir' girando o rig da frente (mesma animação), quadro a quadro. */
  async function rigGirado(anim, dir) {
    if (!p.animacoes[anim]) return null;
    const frente = await landmarksDe(anim, 'frente'); const mf = await medidasDe(anim, 'frente'), ma = await medidasDe(anim, dir);
    const out = ma.map((m, k) => { const fk = frente[k % frente.length], mk = mf[k % mf.length]; return fk && m && mk ? N.girarRig(fk, mk, m, dir) : null; });
    return out.every(Boolean) ? out : null;
  }
  async function ocultosDe(anim, dir) {
    if (dir !== 'esquerda' && dir !== 'direita') return new Set();
    const frente = await landmarksDe(anim, 'frente'), mf = await medidasDe(anim, 'frente');
    return new Set(N.ladoOculto(frente[0], mf[0], dir));
  }
  const visivel = n => p.camadasVisiveis[n] !== false;
  async function imagemItem(it, dir) {
    const arq = it.directional_assets && (it.directional_assets[dir] || it.directional_assets.frente); if (!arq) return null;
    if (!imgItens[arq]) {
      try { const bmp = await ImagemWeb.carregarBitmap(await ab.url(arq)); const c = ImagemWeb.canvas(bmp.width, bmp.height); c.getContext('2d').drawImage(bmp, 0, 0); imgItens[arq] = c; }
      catch { return null; }
    }
    return imgItens[arq];
  }
  function ajuste(it, dir) {
    it.ajustes = it.ajustes || {};
    if (!it.ajustes[dir]) it.ajustes[dir] = JSON.parse(JSON.stringify(it.ajustes.frente || { pega: [0, 0], angulo: 0, escala: 0.3, ordem: 'frente' }));
    return it.ajustes[dir];
  }
  const poseLida = (it, dir, k) => { const b = ajuste(it, dir); return Object.assign({ offsetX: 0, offsetY: 0 }, b, (b.quadros && b.quadros[k]) || {}); };
  function poseQuadro(it, dir, k) {
    const b = ajuste(it, dir); b.quadros = b.quadros || {};
    if (!b.quadros[k]) b.quadros[k] = { offsetX: b.offsetX || 0, offsetY: b.offsetY || 0, angulo: b.angulo || 0, escala: b.escala || 0.3, ordem: b.ordem || 'frente' };
    return b.quadros[k];
  }
  const itensAtivos = () => p.equipamentos.filter(it => it.equipado !== false && camadaDe(it) > 0 && visivel(camadaDe(it))).sort((a, b) => camadaDe(a) - camadaDe(b));
  async function compor(anim, dir) {
    const a = await carregar(anim, dir); const L = await landmarksDe(anim, dir); const itens = [];
    for (const it of itensAtivos()) {
      const c = await imagemItem(it, dir); if (!c) continue; const aj = ajuste(it, dir);
      itens.push({ imagem: bytesDe(c), pega: aj.pega, ancora: (it.anchors || [])[0] || 'hand_main', mira: (it.anchors || [])[1] || null, anguloExtra: aj.angulo, escala: aj.escala, ordem: aj.ordem, offsetX: aj.offsetX || 0, offsetY: aj.offsetY || 0, poses: aj.quadros || {}, mascara: !!it.ocultarCorpo, folga: 1 });
    }
    if (!itens.length && visivel(0)) return a.quadros;
    const r = await Tarefas.rodar('compor', { quadros: a.quadros.map(bytesDe), landmarks: L, itens, corpoVisivel: visivel(0) });
    return r.map(q => ImagemWeb.bytesParaCanvas(q.w, q.h, q.bytes));
  }
  async function atualizarPalco() {
    if (!p || !sel.anim) return;
    const meu = ++pedido;
    const a = await carregar(sel.anim, sel.dir); const L = await landmarksDe(sel.anim, sel.dir);
    const quadros = await compor(sel.anim, sel.dir); if (meu !== pedido) return;
    quadrosCompostos = quadros;
    palco.revisados = revisados(); palco.ocultos = await ocultosDe(sel.anim, sel.dir);
    palco.definir({ quadros, fps: palco.fps && palco._fpsDe === sel.anim ? palco.fps : a.fps, pivo: a.meta.pivo_px, pontos: null, landmarks: L });
    palco._fpsDe = sel.anim; $('#bc-fps').value = palco.fps;
    sincLinhaTempo();
  }
  let tCompor = 0; const recomporDepois = () => { clearTimeout(tCompor); tCompor = setTimeout(atualizarPalco, 140); };

  // ------------------------------------------------------------ linha do tempo
  function montarLinhaTempo() {
    const anims = Object.keys(p.animacoes || {});
    $('#bc-anim').innerHTML = anims.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join(''); $('#bc-anim').value = sel.anim;
    $('#bc-direcoes').innerHTML = DIRS.map(d => `<button type="button" data-dir="${d}" aria-pressed="${d === sel.dir}">${esc(Comum.DIRECOES[d])}</button>`).join('');
    $('#bc-direcoes').querySelectorAll('[data-dir]').forEach(b => b.onclick = async () => { sel.dir = b.dataset.dir; $('#bc-direcoes').querySelectorAll('[data-dir]').forEach(x => x.setAttribute('aria-pressed', x === b)); await atualizarPalco(); desenharRig(); abrirProps(); aplicarFerramenta(); });
    $('#bc-fundos').innerHTML = ['escuro', 'grama', 'xadrez', 'claro'].map(f => `<button type="button" data-fundo="${f}" aria-pressed="${palco.fundo === f}">${f}</button>`).join('');
    $('#bc-fundos').querySelectorAll('[data-fundo]').forEach(b => b.onclick = () => { palco.fundo = b.dataset.fundo; $('#bc-fundos').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); palco.desenhar(); });
  }
  $('#bc-anim').onchange = async () => { sel.anim = $('#bc-anim').value; palco.k = 0; $('#bc-tira').innerHTML = ''; await atualizarPalco(); desenharRig(); abrirProps(); };
  $('#bc-ant').onclick = () => irQuadro(palco.k - 1);
  $('#bc-prox').onclick = () => irQuadro(palco.k + 1);
  $('#bc-play').onclick = () => { palco.tocando = !palco.tocando; sincLinhaTempo(); };
  $('#bc-fps').onchange = () => { palco.fps = Math.max(1, +$('#bc-fps').value || 10); };
  document.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => {
    const k = b.dataset.ver, campo = k === 'cebola' ? 'cebola' : k === 'silhueta' ? 'silhueta' : 'mostrarTrajetoria';
    palco[campo] = !palco[campo]; b.setAttribute('aria-pressed', palco[campo]); palco.desenhar();
  });
  function irQuadro(k) { palco.tocando = false; palco.irPara(k); sincLinhaTempo(); }
  function sincLinhaTempo() {
    const n = palco.quadros.length; $('#bc-quadro').textContent = (palco.k + 1) + '/' + n; $('#bc-play').textContent = palco.tocando ? '❚❚' : '►';
    const tira = $('#bc-tira');
    if (tira.childElementCount !== n) {
      tira.innerHTML = palco.quadros.map((_, i) => `<button type="button" data-q="${i}">${i + 1}</button>`).join('');
      tira.querySelectorAll('[data-q]').forEach(b => b.onclick = () => irQuadro(+b.dataset.q));
    }
    const comPose = itemSel ? ((ajuste(itemSel, sel.dir).quadros) || {}) : {};
    tira.querySelectorAll('[data-q]').forEach(b => { b.setAttribute('aria-current', +b.dataset.q === palco.k); b.classList.toggle('tem-pose', !!comPose[b.dataset.q]); });
  }
  palco.aoMudarQuadro = () => { sincLinhaTempo(); if (!palco.tocando) { desenharRigProps(); abrirProps(true); } };

  // ------------------------------------------------------------ ferramentas
  const DICAS = {
    selecionar: 'Clique numa peça para selecioná-la ou perto de um ponto do corpo para escolher o osso. Roda do mouse amplia.',
    malha: 'Malha: esqueleto e contorno das peças ativas — confira se uma peça entra dentro da outra.',
    roupa: 'Roupa: selecione uma peça nas Camadas e arraste no palco para ajustar.',
    rig: 'Rig: arraste os pontos do corpo. Pontos corrigidos ficam verdes.',
    visao: 'Visão: arraste para mover, roda do mouse para ampliar, duplo clique para enquadrar.',
    anotar: 'Anotar: desenhe por cima. As anotações ficam nesta animação e direção.',
  };
  document.querySelectorAll('[data-ferr]').forEach(b => b.onclick = () => { ferramenta = b.dataset.ferr; aplicarFerramenta(); });
  function aplicarFerramenta() {
    document.querySelectorAll('[data-ferr]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ferr === ferramenta));
    palco.editavel = ferramenta === 'rig';
    palco.mostrarMalha = ferramenta === 'malha' || ferramenta === 'rig';
    palco.selecionado = ossoSel;
    const c = $('#bc-palco'); c.style.cursor = { visao: 'grab', anotar: 'crosshair', roupa: itemSel ? 'move' : 'default', rig: 'pointer' }[ferramenta] || 'default';
    const op = $('#bc-opcoes');
    if (ferramenta === 'roupa') {
      op.innerHTML = ['mover', 'girar', 'escala'].map(m => `<button type="button" data-modo="${m}" aria-pressed="${modoRoupa === m}">${m === 'mover' ? 'Mover' : m === 'girar' ? 'Girar' : 'Escala'}</button>`).join('') +
        '<span>·</span>' + [['todos', 'Todos os quadros'], ['quadro', 'Só este quadro']].map(([v, t]) => `<button type="button" data-escopo="${v}" aria-pressed="${escopoRoupa === v}">${t}</button>`).join('');
      op.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { modoRoupa = b.dataset.modo; aplicarFerramenta(); });
      op.querySelectorAll('[data-escopo]').forEach(b => b.onclick = () => { escopoRoupa = b.dataset.escopo; aplicarFerramenta(); });
    } else if (ferramenta === 'visao') {
      op.innerHTML = '<button type="button" id="bc-enquadrar">Enquadrar</button>'; $('#bc-enquadrar').onclick = enquadrar;
    } else if (ferramenta === 'anotar') {
      op.innerHTML = `<label>cor <input type="color" id="bc-cor" value="${corNota}"></label><button type="button" id="bc-limpar-notas">Limpar anotações</button>`;
      $('#bc-cor').oninput = e => { corNota = e.target.value; };
      $('#bc-limpar-notas').onclick = () => { p.notas = p.notas.filter(n => !(n.anim === sel.anim && n.dir === sel.dir)); marcarSujo(); palco.desenhar(); };
    } else if (ferramenta === 'rig') {
      op.innerHTML = (sel.dir !== 'frente' ? '<button type="button" id="bc-rig-girar" title="Refaz o rig desta vista girando o rig da frente">Girar rig da frente</button>' : '') + '<button type="button" id="bc-rig-propor">Proposta automática</button><button type="button" id="bc-rig-copiar">Copiar correção p/ todos os quadros</button>';
      $('#bc-rig-propor').onclick = proporDeNovo; $('#bc-rig-copiar').onclick = copiarCorrecao;
      if ($('#bc-rig-girar')) $('#bc-rig-girar').onclick = girarDaFrente;
    } else op.innerHTML = '';
    $('#bc-dica').textContent = p ? DICAS[ferramenta] : '';
    if (ferramenta === 'roupa' && !itemSel && p) $('#bc-dica').textContent = 'Roupa: primeiro selecione uma peça na hierarquia de Camadas (à direita).';
    palco.desenhar();
  }
  function enquadrar() { palco.desloc = [0, 0]; palco.zoom = 0; palco.desenhar(); }
  document.addEventListener('keydown', e => {
    if (!p || e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const mapa = { q: 'selecionar', m: 'malha', g: 'roupa', r: 'rig', v: 'visao', n: 'anotar' };
    if (mapa[e.key.toLowerCase()]) { ferramenta = mapa[e.key.toLowerCase()]; aplicarFerramenta(); }
    else if (e.key === ' ') { e.preventDefault(); palco.tocando = !palco.tocando; sincLinhaTempo(); }
    else if (e.key === 'ArrowLeft') irQuadro(palco.k - 1);
    else if (e.key === 'ArrowRight') irQuadro(palco.k + 1);
  });

  // ------------------------------------------------------------ geometria das peças no palco
  function cantosItem(it, img, L, k) {
    const a = (it.anchors || [])[0] || 'hand_main'; if (!L || !L[a] || !img) return null;
    const pose = poseLida(it, sel.dir, k);
    const A = [L[a][0] + (pose.offsetX || 0), L[a][1] + (pose.offsetY || 0)];
    let ang = (pose.angulo || 0) * Math.PI / 180; const mira = (it.anchors || [])[1];
    if (mira && L[mira]) ang += Math.atan2(L[mira][1] - L[a][1], L[mira][0] - L[a][0]) + Math.PI / 2;
    const s = pose.escala || 0.3, cs = Math.cos(ang), sn = Math.sin(ang), [gx, gy] = pose.pega || [0, 0];
    const cantos = [[0, 0], [img.width, 0], [img.width, img.height], [0, img.height]].map(([x, y]) => { const dx = (x - gx) * s, dy = (y - gy) * s; return [A[0] + dx * cs - dy * sn, A[1] + dx * sn + dy * cs]; });
    return { A, cantos };
  }
  const dentro = (pt, poli) => { let r = false; for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) { const [xi, yi] = poli[i], [xj, yj] = poli[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) r = !r; } return r; };

  // desenho por cima do personagem: peça selecionada, malha das peças, efeitos e anotações
  palco.aoDesenhar = (g, ox, oy, e) => {
    if (!p) return; const L = palco.landmarks && palco.landmarks[palco.k]; const T = ([x, y]) => [ox + x * e, oy + y * e];
    if (ferramenta === 'malha' && L) {
      for (const it of itensAtivos()) {
        const img = imgItens[(it.directional_assets || {})[sel.dir] || (it.directional_assets || {}).frente]; const c = cantosItem(it, img, L, palco.k); if (!c) continue;
        g.strokeStyle = 'rgba(101,184,235,.55)'; g.lineWidth = 1; g.beginPath(); c.cantos.map(T).forEach((pt, i) => i ? g.lineTo(...pt) : g.moveTo(...pt)); g.closePath(); g.stroke();
      }
    }
    if (itemSel && L) {
      const img = imgItens[(itemSel.directional_assets || {})[sel.dir] || (itemSel.directional_assets || {}).frente]; const c = cantosItem(itemSel, img, L, palco.k);
      if (c) {
        g.strokeStyle = '#65d8eb'; g.lineWidth = 1.5; g.setLineDash([5, 3]); g.beginPath(); c.cantos.map(T).forEach((pt, i) => i ? g.lineTo(...pt) : g.moveTo(...pt)); g.closePath(); g.stroke(); g.setLineDash([]);
        const [x, y] = T(c.A); g.beginPath(); g.arc(x, y, 7, 0, 7); g.moveTo(x - 12, y); g.lineTo(x + 12, y); g.moveTo(x, y - 12); g.lineTo(x, y + 12); g.stroke();
      }
    }
    // efeitos: prévia leve em pincelada translúcida, sempre em movimento, sem esconder o personagem
    const t = performance.now() / 1000;
    for (const ef of p.efeitos.filter(x => x.ativo)) {
      const pt = L && L[ef.ancora]; if (!pt) continue; const [x, y] = T(pt); const cor = corEfeito(ef.nome + ' ' + (ef.efeito || ''));
      g.save(); g.lineCap = 'round'; g.strokeStyle = cor;
      for (let i = 0; i < 3; i++) {
        const r = (10 + i * 5) * Math.max(0.6, e / 2), a0 = t * (2.2 + i * 0.7) + i * 2.1;
        g.globalAlpha = 0.32 - i * 0.07; g.lineWidth = 3.2 - i * 0.8; g.beginPath(); g.arc(x, y, r, a0, a0 + 1.9); g.stroke();
      }
      g.globalAlpha = 0.5; g.fillStyle = cor; g.beginPath(); g.arc(x + Math.cos(t * 3) * 3, y + Math.sin(t * 3) * 3, 2.2, 0, 7); g.fill(); g.restore();
    }
    for (const n of p.notas.filter(n => n.anim === sel.anim && n.dir === sel.dir)) {
      if (!n.pontos.length) continue; g.strokeStyle = n.cor; g.lineWidth = 2.5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      n.pontos.map(T).forEach((pt, i) => i ? g.lineTo(...pt) : g.moveTo(...pt)); if (n.pontos.length === 1) { const [x, y] = T(n.pontos[0]); g.arc(x, y, 1.5, 0, 7); } g.stroke();
    }
  };
  // os efeitos se movem mesmo com a animação pausada
  (function animarEfeitos() { if (p && p.efeitos.some(x => x.ativo) && !palco.tocando) palco.desenhar(); setTimeout(() => requestAnimationFrame(animarEfeitos), 33); })();

  // ------------------------------------------------------------ interação no palco
  let arraste = null;
  palco.aoPonteiro = (tipo, ev, [x, y, e]) => {
    if (!p) return; const c = $('#bc-palco');
    if (tipo === 'down') {
      c.setPointerCapture(ev.pointerId);
      if (ferramenta === 'visao' || ev.button === 1) { arraste = { tipo: 'visao', x: ev.clientX, y: ev.clientY, d0: [...(palco.desloc || [0, 0])] }; c.style.cursor = 'grabbing'; return; }
      if (ferramenta === 'anotar') { const n = { cor: corNota, anim: sel.anim, dir: sel.dir, pontos: [[+x.toFixed(1), +y.toFixed(1)]] }; p.notas.push(n); arraste = { tipo: 'nota', n }; marcarSujo(); palco.desenhar(); return; }
      if (ferramenta === 'roupa' && itemSel) { palco.tocando = false; sincLinhaTempo(); arraste = { tipo: 'roupa', x, y, cx: ev.clientX, cy: ev.clientY }; return; }
      if (ferramenta === 'selecionar' || ferramenta === 'malha') {
        const L = palco.landmarks && palco.landmarks[palco.k];
        const alvo = itensAtivos().reverse().find(it => { const img = imgItens[(it.directional_assets || {})[sel.dir] || (it.directional_assets || {}).frente]; const k = cantosItem(it, img, L, palco.k); return k && dentro([x, y], k.cantos); });
        if (alvo) { selecionarItem(alvo); return; }
        if (L) { let melhor = null, d = 10 / e; for (const nome in L) { const dd = Math.hypot(L[nome][0] - x, L[nome][1] - y); if (dd < d) { d = dd; melhor = nome; } } if (melhor) { selecionarOsso(melhor); return; } }
        if (itemSel) { itemSel = null; desenharCamadas(); abrirProps(); palco.desenhar(); }
      }
    } else if (tipo === 'move' && arraste) {
      if (arraste.tipo === 'visao') { palco.desloc = [arraste.d0[0] + ev.clientX - arraste.x, arraste.d0[1] + ev.clientY - arraste.y]; palco.desenhar(); }
      else if (arraste.tipo === 'nota') { arraste.n.pontos.push([+x.toFixed(1), +y.toFixed(1)]); palco.desenhar(); }
      else if (arraste.tipo === 'roupa') {
        const dx = x - arraste.x, dy = y - arraste.y, dpx = (ev.clientX - arraste.cx) - (ev.clientY - arraste.cy);
        arraste.x = x; arraste.y = y; arraste.cx = ev.clientX; arraste.cy = ev.clientY;
        editarPose(pose => {
          if (modoRoupa === 'mover') { pose.offsetX = +((pose.offsetX || 0) + dx).toFixed(1); pose.offsetY = +((pose.offsetY || 0) + dy).toFixed(1); }
          else if (modoRoupa === 'girar') pose.angulo = +((pose.angulo || 0) + dpx * 0.6).toFixed(1);
          else pose.escala = +Math.max(0.03, Math.min(3, (pose.escala || 0.3) * (1 + dpx * 0.005))).toFixed(3);
        });
        palco.desenhar(); abrirProps(true); recomporDepois();
      }
    } else if (tipo === 'up') {
      if (arraste && arraste.tipo === 'visao') c.style.cursor = ferramenta === 'visao' ? 'grab' : 'default';
      arraste = null;
    }
  };
  $('#bc-palco').addEventListener('wheel', ev => {
    if (!p || !palco.quadros.length) return; ev.preventDefault();
    const atual = palco._escala(), novo = Math.max(0.2, Math.min(12, atual * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    const r = $('#bc-palco').getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top; const [ox, oy] = palco._origem();
    // amplia em torno do ponteiro
    const ix = (mx - ox) / atual, iy = (my - oy) / atual; palco.zoom = novo;
    const [nx, ny] = palco._origem(); palco.desloc = [(palco.desloc || [0, 0])[0] + (mx - (nx + ix * novo)), (palco.desloc || [0, 0])[1] + (my - (ny + iy * novo))];
    palco.desenhar();
  }, { passive: false });
  $('#bc-palco').addEventListener('dblclick', () => { if (ferramenta === 'visao') enquadrar(); });

  /** Aplica uma mudança na pose da peça selecionada: no quadro atual ou na base + todos os quadros com pose própria. */
  function editarPose(fn) {
    const it = itemSel; if (!it) return; const b = ajuste(it, sel.dir);
    if (escopoRoupa === 'quadro') fn(poseQuadro(it, sel.dir, palco.k));
    else { fn(b); for (const k in (b.quadros || {})) fn(b.quadros[k]); }
    marcarSujo();
  }

  // ------------------------------------------------------------ hierarquia: camadas
  function desenharCamadas() {
    if (!p) return;
    const html = CAMADAS.map(cam => {
      const itens = p.equipamentos.filter(it => camadaDe(it) === cam.n); const vis = visivel(cam.n);
      const aberta = ui['cam-' + cam.n] !== false;
      if (cam.n === 0) {
        return `<div class="bc-no${vis ? '' : ' inativo'}"><span class="bc-seta"></span><button type="button" class="bc-olho" data-vis="0" aria-pressed="${vis}" title="Mostrar/ocultar corpo">👁</button>
          <span class="bc-no-nome">0 · ${esc(cam.nome)}<small>${esc(cam.desc)}</small></span><span class="bc-tag">base</span></div>`;
      }
      const ativa = itens.find(it => it.equipado !== false);
      return `<div class="bc-no${vis ? '' : ' inativo'}"><button type="button" class="bc-seta" data-abrir-cam="${cam.n}" aria-expanded="${aberta}">${aberta ? '▾' : '▸'}</button>
          <button type="button" class="bc-olho" data-vis="${cam.n}" aria-pressed="${vis}" title="Mostrar/ocultar camada">👁</button>
          <span class="bc-no-nome">${cam.n} · ${esc(cam.nome)}<small>${ativa ? esc(ativa.name) : 'nenhuma ativa'}</small></span><span class="bc-tag">${itens.length}</span></div>` +
        (aberta ? `<div class="bc-filhos">${itens.map(it => `<div class="bc-no${it.equipado !== false ? '' : ' inativo'}" aria-selected="${it === itemSel}">
            <span class="bc-seta"></span><button type="button" class="bc-radio" role="radio" data-ativar="${esc(it.id)}" aria-checked="${it.equipado !== false}" title="Ativar esta peça na camada">${it.equipado !== false ? '◉' : '○'}</button>
            <button type="button" class="bc-no-nome" data-item="${esc(it.id)}">${esc(it.name)}<small>${esc(Comum.SLOTS[it.slot] || it.slot)}</small></button>
            <span class="bc-tag${it.validation_status === 'approved' ? ' ok' : ''}">${it.validation_status === 'approved' ? 'ok' : 'rasc.'}</span></div>`).join('')}
            <label class="bc-mini">＋ Adicionar peça (imagem)<input type="file" data-novo="${cam.n}" accept="image/png,image/webp,image/jpeg" hidden></label></div>` : '');
    }).join('');
    const desenhado = (p.slotsNoDesenho || []).length ? `<p class="bc-aviso">${esc(p.nome)}: a imagem-base já vem vestida (${esc(p.slotsNoDesenho.map(s => Comum.SLOTS[s] || s).join(', '))}). A Camada 0 só ficará "nua" com as folhas do corpo-base; até lá, peças nessas camadas aparecem sobrepostas.</p>` : '';
    $('#bc-camadas').innerHTML = html + desenhado;
    const cx = $('#bc-camadas');
    cx.querySelectorAll('[data-vis]').forEach(b => b.onclick = () => { const n = +b.dataset.vis; p.camadasVisiveis[n] = !visivel(n); if (!visivel(n) && itemSel && camadaDe(itemSel) === n) itemSel = null; marcarSujo(); desenharCamadas(); abrirProps(); atualizarPalco(); });
    cx.querySelectorAll('[data-abrir-cam]').forEach(b => b.onclick = () => { const n = b.dataset.abrirCam; ui['cam-' + n] = ui['cam-' + n] === false; guardarUI(); desenharCamadas(); });
    cx.querySelectorAll('[data-ativar]').forEach(b => b.onclick = () => {
      const it = p.equipamentos.find(x => x.id === b.dataset.ativar); const liga = it.equipado === false;
      for (const o of p.equipamentos) if (camadaDe(o) === camadaDe(it)) o.equipado = false; // uma peça ativa por camada
      it.equipado = liga; marcarSujo(); desenharCamadas(); abrirProps(); atualizarPalco();
    });
    cx.querySelectorAll('[data-item]').forEach(b => b.onclick = () => selecionarItem(p.equipamentos.find(x => x.id === b.dataset.item)));
    cx.querySelectorAll('[data-novo]').forEach(inp => inp.onchange = ev => novaPeca(ev.target.files[0], +inp.dataset.novo).finally(() => { ev.target.value = ''; }));
  }
  async function selecionarItem(it) {
    itemSel = it; ossoSel = null; await imagemItem(it, sel.dir);
    if (ui['cam-' + camadaDe(it)] === false) ui['cam-' + camadaDe(it)] = true;
    desenharCamadas(); abrirProps(); desenharRig(); sincLinhaTempo();
    if (ferramenta === 'rig' || ferramenta === 'anotar') { ferramenta = 'roupa'; }
    aplicarFerramenta();
  }
  async function novaPeca(f, n) {
    if (!f) return; const cam = CAMADAS[n]; avisoTemporario('Tirando o fundo…');
    const r = await Tarefas.rodar('semFundo', { imagem: await ImagemWeb.paraNucleo(f) });
    const canvasItem = ImagemWeb.bytesParaCanvas(r.w, r.h, r.bytes);
    const nome = f.name.replace(/\.[^.]+$/, ''); const iid = Comum.slug(nome) + '_' + Date.now().toString(36); const arq = 'equipamentos/' + iid + '.png';
    const L = (await landmarksDe(sel.anim, sel.dir))[0]; const a = await carregar(sel.anim, sel.dir);
    const altura = L ? (L.foot_contact_left[1] - L.head_top[1]) : a.meta.altura_quadro * 0.8;
    const proporcao = { 1: 0.14, 2: 0.35, 3: 0.4, 4: 0.18, 5: 0.25, 6: 0.9 }[n] || 0.3;
    const it = {
      id: iid, name: nome, slot: cam.slot, camada: n, compatible_archetypes: [p.arquetipo || 'humanoid_biped'], coverage_regions: [],
      anchors: [cam.ancora], draw_order: 'front_of_body', deformation_profile: n === 6 || n === 5 ? 'rigid_low_deform' : 'moderate',
      directional_assets: { frente: arq },
      ajustes: { frente: { pega: [Math.round(canvasItem.width / 2), Math.round(canvasItem.height * (n === 6 ? 0.55 : 0.5))], angulo: 0, escala: +Math.min(2, (altura * proporcao) / canvasItem.height).toFixed(3), ordem: 'frente', offsetX: 0, offsetY: 0 } },
      ocultarCorpo: n !== 6, equipado: true, validation_status: 'draft',
    };
    for (const o of p.equipamentos) if (camadaDe(o) === n) o.equipado = false;
    p.equipamentos.push(it); imgItens[arq] = canvasItem;
    p = await Armazem.salvar(p, { [arq]: await ImagemWeb.canvasParaPNG(canvasItem) }, 'Peça nova na camada ' + n + ': ' + nome); ab = await Armazem.abrir(p.id);
    p.equipamentos = p.equipamentos || []; itemSel = p.equipamentos.find(x => x.id === iid);
    avisoTemporario('Peça adicionada ✔'); ui['cam-' + n] = true; await atualizarPalco(); selecionarItem(itemSel);
  }

  // propriedades da peça selecionada
  function opcoesLandmark(v, vazio) { return (vazio ? `<option value="">${vazio}</option>` : '') + N.LANDMARKS.map(l => `<option value="${l}"${l === v ? ' selected' : ''}>${esc(N.NOMES_LANDMARK[l] || l)}</option>`).join(''); }
  function abrirProps(soValores) {
    const box = $('#bc-props'); if (!p || !itemSel) { box.hidden = true; box.innerHTML = ''; return; }
    const it = itemSel, pose = poseLida(it, sel.dir, palco.k), temQuadro = !!((ajuste(it, sel.dir).quadros || {})[palco.k]);
    if (soValores && box.querySelector('#bp-x')) {
      $('#bp-x').value = pose.offsetX || 0; $('#bp-y').value = pose.offsetY || 0; $('#bp-ang').value = pose.angulo || 0; $('#bp-ang-v').textContent = (pose.angulo || 0) + '°';
      $('#bp-esc').value = pose.escala || 0.3; $('#bp-esc-v').textContent = (+pose.escala || 0.3).toFixed(2); $('#bp-quadro').textContent = temQuadro ? 'pose própria neste quadro' : 'pose geral'; return;
    }
    const jaDesenhado = (p.slotsNoDesenho || []).includes(it.slot);
    box.hidden = false;
    box.innerHTML = `<h4>Propriedades · ${esc(it.name)}</h4>
      ${jaDesenhado && it.equipado !== false ? `<p class="bc-aviso">"${esc(Comum.SLOTS[it.slot] || it.slot)}" já está desenhado no corpo de ${esc(p.nome)}: a peça aparece sobreposta.</p>` : ''}
      <div class="bc-campos">
        <label class="bc-campo inteiro">Nome<input id="bp-nome" value="${esc(it.name)}"></label>
        <label class="bc-campo">Camada<select id="bp-camada">${CAMADAS.slice(1).map(c => `<option value="${c.n}"${c.n === camadaDe(it) ? ' selected' : ''}>${c.n} · ${esc(c.nome)}</option>`).join('')}</select></label>
        <label class="bc-campo">Slot<select id="bp-slot">${(p.slots || Object.keys(Comum.SLOTS)).map(s => `<option value="${s}"${s === it.slot ? ' selected' : ''}>${esc(Comum.SLOTS[s] || s)}</option>`).join('')}</select></label>
        <label class="bc-campo">Âncora<select id="bp-ancora">${opcoesLandmark((it.anchors || [])[0] || 'hand_main')}</select></label>
        <label class="bc-campo">Girar seguindo<select id="bp-mira">${opcoesLandmark((it.anchors || [])[1] || '', 'não girar')}</select></label>
        <label class="bc-campo">Material<select id="bp-perfil">${Object.entries(Comum.PERFIS).map(([k, v]) => `<option value="${k}"${k === it.deformation_profile ? ' selected' : ''}>${esc(v.split(' — ')[0])}</option>`).join('')}</select></label>
        <label class="bc-campo">Ordem<select id="bp-ordem"><option value="frente"${pose.ordem !== 'atras' ? ' selected' : ''}>Na frente do corpo</option><option value="atras"${pose.ordem === 'atras' ? ' selected' : ''}>Atrás do corpo</option></select></label>
        <label class="bc-campo">X<input type="number" id="bp-x" step="0.5" value="${pose.offsetX || 0}"></label>
        <label class="bc-campo">Y<input type="number" id="bp-y" step="0.5" value="${pose.offsetY || 0}"></label>
        <label class="bc-campo">Ângulo <span id="bp-ang-v">${pose.angulo || 0}°</span><input type="range" id="bp-ang" min="-180" max="180" step="1" value="${pose.angulo || 0}"></label>
        <label class="bc-campo">Escala <span id="bp-esc-v">${(+pose.escala || 0.3).toFixed(2)}</span><input type="range" id="bp-esc" min="0.03" max="2" step="0.01" value="${pose.escala || 0.3}"></label>
        <label class="bc-campo inteiro"><span><input type="checkbox" id="bp-ocultar"${it.ocultarCorpo ? ' checked' : ''}> Esconder o corpo embaixo da peça</span></label>
      </div>
      <p class="bc-nota">Quadro ${palco.k + 1} · <span id="bp-quadro">${temQuadro ? 'pose própria neste quadro' : 'pose geral'}</span>. Na ferramenta Roupa, escolha "Só este quadro" para ajustar quadro a quadro.</p>
      <span class="bc-nota">Ponto de pega (clique onde a âncora segura a peça):</span><canvas id="bc-pega"></canvas>
      <div class="bc-linha-botoes"><button type="button" id="bp-limpar">Apagar pose deste quadro</button><button type="button" id="bp-aprovar">${it.validation_status === 'approved' ? 'Voltar a rascunho' : 'Marcar como aprovada'}</button><button type="button" id="bp-remover">Remover peça</button></div>`;
    const ler = () => {
      it.name = $('#bp-nome').value.trim() || it.name; it.camada = +$('#bp-camada').value; it.slot = $('#bp-slot').value;
      it.anchors = [$('#bp-ancora').value].concat($('#bp-mira').value ? [$('#bp-mira').value] : []); it.deformation_profile = $('#bp-perfil').value; it.ocultarCorpo = $('#bp-ocultar').checked;
      const x = +$('#bp-x').value || 0, y = +$('#bp-y').value || 0, ang = +$('#bp-ang').value, sc = +$('#bp-esc').value, ordem = $('#bp-ordem').value;
      const alvo = escopoRoupa === 'quadro' ? poseQuadro(it, sel.dir, palco.k) : ajuste(it, sel.dir);
      Object.assign(alvo, { offsetX: x, offsetY: y, angulo: ang, escala: sc, ordem }); it.draw_order = ordem === 'atras' ? 'behind_body' : 'front_of_body';
      $('#bp-ang-v').textContent = ang + '°'; $('#bp-esc-v').textContent = sc.toFixed(2);
      marcarSujo(); palco.desenhar(); recomporDepois();
    };
    box.querySelectorAll('input,select').forEach(el => el.addEventListener('input', ler));
    $('#bp-camada').addEventListener('change', () => { for (const o of p.equipamentos) if (o !== it && camadaDe(o) === it.camada && it.equipado !== false) o.equipado = false; desenharCamadas(); });
    $('#bp-nome').addEventListener('change', desenharCamadas);
    $('#bp-limpar').onclick = () => { const b = ajuste(it, sel.dir); if (b.quadros) delete b.quadros[palco.k]; marcarSujo(); abrirProps(); sincLinhaTempo(); recomporDepois(); };
    $('#bp-aprovar').onclick = () => { it.validation_status = it.validation_status === 'approved' ? 'draft' : 'approved'; marcarSujo(); desenharCamadas(); abrirProps(); };
    $('#bp-remover').onclick = () => { if (!confirm('Remover "' + it.name + '"?')) return; p.equipamentos = p.equipamentos.filter(x => x !== it); itemSel = null; marcarSujo(); desenharCamadas(); abrirProps(); atualizarPalco(); };
    desenharPega();
  }
  async function desenharPega() {
    const it = itemSel, c = $('#bc-pega'); if (!it || !c) return; const img = await imagemItem(it, sel.dir); if (!img) return;
    const dpr = devicePixelRatio || 1; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; const g = c.getContext('2d');
    const e = Math.min(c.width / img.width, c.height / img.height) * 0.9, ox = (c.width - img.width * e) / 2, oy = (c.height - img.height * e) / 2;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(img, ox, oy, img.width * e, img.height * e);
    const [px, py] = ajuste(it, sel.dir).pega || [0, 0]; g.strokeStyle = '#c9a96e'; g.lineWidth = 2 * dpr; g.beginPath();
    g.moveTo(ox + px * e - 9 * dpr, oy + py * e); g.lineTo(ox + px * e + 9 * dpr, oy + py * e); g.moveTo(ox + px * e, oy + py * e - 9 * dpr); g.lineTo(ox + px * e, oy + py * e + 9 * dpr); g.stroke();
    c.onclick = ev => { const r = c.getBoundingClientRect(); ajuste(it, sel.dir).pega = [Math.round(((ev.clientX - r.left) * dpr - ox) / e), Math.round(((ev.clientY - r.top) * dpr - oy) / e)]; marcarSujo(); desenharPega(); palco.desenhar(); recomporDepois(); };
  }

  // ------------------------------------------------------------ hierarquia: rig
  function revisados() { p.revisado[sel.anim] = p.revisado[sel.anim] || {}; return new Set(p.revisado[sel.anim][sel.dir] || []); }
  function desenharRig() {
    if (!p) return; const rv = revisados(); const H = N.HIERARQUIA;
    const prof = h => { let d = 0, x = h; while (x && x.pai) { d++; x = H.find(y => y.id === x.pai); } return d; };
    const mostrar = palco.mostrarMalha || palco.editavel;
    $('#bc-rig').innerHTML = `<div class="bc-no"><span class="bc-seta"></span><button type="button" class="bc-olho" id="bc-rig-olho" aria-pressed="${mostrar}" title="Mostrar esqueleto no palco">👁</button><span class="bc-no-nome">Esqueleto<small>${rv.size}/${N.LANDMARKS.length} pontos corrigidos</small></span><span class="bc-tag">${esc(sel.anim)} · ${esc(Comum.DIRECOES[sel.dir])}</span></div>` +
      H.map(h => `<div class="bc-no" aria-selected="${h.id === ossoSel}" style="padding-left:${4 + prof(h) * 10}px"><span class="bc-seta">${prof(h) ? '└' : '●'}</span><span class="bc-olho" style="color:${rv.has(h.id) ? 'var(--bc-verde)' : 'var(--bc-violeta)'}">●</span>
        <button type="button" class="bc-no-nome" data-osso="${h.id}">${esc(h.nome)}</button><span class="bc-tag">${h.id === 'root' ? 'raiz' : (palco.ocultos && palco.ocultos.has(h.id)) ? 'atrás' : rv.has(h.id) ? 'ok' : 'auto'}</span></div>`).join('');
    $('#bc-rig-olho').onclick = () => { palco.mostrarMalha = !palco.mostrarMalha; palco.desenhar(); desenharRig(); };
    $('#bc-rig').querySelectorAll('[data-osso]').forEach(b => b.onclick = () => selecionarOsso(b.dataset.osso));
    desenharRigProps();
  }
  function selecionarOsso(id) {
    ossoSel = id; palco.selecionado = id; itemSel = null; desenharCamadas(); abrirProps();
    if (ferramenta !== 'rig' && ferramenta !== 'malha') { ferramenta = 'rig'; }
    aplicarFerramenta(); desenharRig();
  }
  function desenharRigProps() {
    const box = $('#bc-rig-props'); if (!p || !ossoSel || ossoSel === 'root') { box.innerHTML = ossoSel === 'root' ? '<p class="bc-nota">A raiz é o pivô do pé, definido pela linha de produção.</p>' : '<p class="bc-nota">Selecione um osso para ajustar a posição neste quadro.</p>'; return; }
    const L = palco.landmarks && palco.landmarks[palco.k]; const pt = L && L[ossoSel]; if (!pt) { box.innerHTML = ''; return; }
    box.innerHTML = `<h4>${esc(N.NOMES_LANDMARK[ossoSel] || ossoSel)} · quadro ${palco.k + 1}</h4><div class="bc-campos"><label class="bc-campo">X<input type="number" id="br-x" step="0.5" value="${pt[0]}"></label><label class="bc-campo">Y<input type="number" id="br-y" step="0.5" value="${pt[1]}"></label></div>
      <div class="bc-linha-botoes"><button type="button" id="br-copiar">Copiar correção p/ todos os quadros</button></div>`;
    const ler = () => { L[ossoSel] = [+$('#br-x').value || 0, +$('#br-y').value || 0]; marcarRevisado(ossoSel); palco.desenhar(); if (itensAtivos().length) recomporDepois(); };
    $('#br-x').oninput = ler; $('#br-y').oninput = ler; $('#br-copiar').onclick = copiarCorrecao;
  }
  function marcarRevisado(nome) { const rv = revisados(); rv.add(nome); p.revisado[sel.anim][sel.dir] = [...rv]; palco.revisados = rv; marcarSujo(); }
  palco.aoSelecionar = nome => { ossoSel = nome; desenharRig(); };
  palco.aoMoverLandmark = (k, nome) => { marcarRevisado(nome); desenharRig(); if (itensAtivos().length) recomporDepois(); };
  async function proporDeNovo() {
    const k = sel.anim + '/' + sel.dir; if (!propostas[k] || !confirm('Descartar as correções do rig desta animação e direção?')) return;
    p.rig[sel.anim][sel.dir] = JSON.parse(JSON.stringify(propostas[k])); p.revisado[sel.anim][sel.dir] = []; marcarSujo(); await atualizarPalco(); desenharRig();
  }
  async function girarDaFrente() {
    if (sel.dir === 'frente' || !confirm('Refazer o rig da vista ' + Comum.DIRECOES[sel.dir] + ' girando o rig da frente? As correções desta vista serão substituídas.')) return;
    const g = await rigGirado(sel.anim, sel.dir); if (!g) { avisoTemporario('Não consegui girar: falta o rig da frente'); return; }
    p.rig[sel.anim][sel.dir] = g; p.revisado[sel.anim] = p.revisado[sel.anim] || {}; p.revisado[sel.anim][sel.dir] = []; marcarSujo(); await atualizarPalco(); desenharRig(); avisoTemporario('Rig girado a partir da frente ✔');
  }
  function copiarCorrecao() {
    const n = ossoSel; if (!n || n === 'root') { avisoTemporario('Selecione um osso primeiro'); return; }
    const prop = propostas[sel.anim + '/' + sel.dir], L = p.rig[sel.anim][sel.dir], k = palco.k; if (!prop) return;
    const dx = L[k][n][0] - prop[k][n][0], dy = L[k][n][1] - prop[k][n][1];
    L.forEach((q, i) => { if (i !== k && prop[i][n]) q[n] = [+(prop[i][n][0] + dx).toFixed(1), +(prop[i][n][1] + dy).toFixed(1)]; });
    marcarRevisado(n); palco.desenhar(); avisoTemporario('Correção copiada para ' + L.length + ' quadros'); if (itensAtivos().length) recomporDepois();
  }

  // ------------------------------------------------------------ hierarquia: efeitos
  function desenharEfeitos() {
    if (!p) return;
    const livres = p.habilidades.filter(h => !p.efeitos.some(e => e.id === h.id));
    $('#bc-efeitos').innerHTML = (p.efeitos.length ? p.efeitos.map((ef, i) => `<div class="bc-no${ef.ativo ? '' : ' inativo'}"><span class="bc-seta" style="color:${corEfeito(ef.nome + ' ' + (ef.efeito || ''))}">✧</span>
        <button type="button" class="bc-olho" data-ef-vis="${i}" aria-pressed="${!!ef.ativo}" title="Prévia no palco">👁</button>
        <span class="bc-no-nome">${esc(ef.nome)}</span>
        <select data-ef-ancora="${i}" aria-label="Ponto do efeito" class="bc-ef-ancora">${opcoesLandmark(ef.ancora)}</select></div>`).join('') : '<p class="bc-nota">Nenhum efeito ligado a este personagem.</p>') +
      `<div class="bc-linha-botoes" style="margin-top:6px">${livres.length ? `<select id="bc-ef-novo">${livres.map(h => `<option value="${esc(h.id)}">${esc(h.nome)}</option>`).join('')}</select><button type="button" id="bc-ef-add">＋ Ligar efeito</button>` : ''}
        <a class="bc-botao secundario" href="index.html#efeitos" target="_top">Estúdio de efeitos ↗</a></div>
      <p class="bc-nota">A prévia mostra onde o efeito nasce no corpo (pincelada translúcida em movimento). O efeito completo é criado no Estúdio de efeitos.</p>`;
    $('#bc-efeitos').querySelectorAll('[data-ef-vis]').forEach(b => b.onclick = () => { const ef = p.efeitos[+b.dataset.efVis]; ef.ativo = !ef.ativo; marcarSujo(); desenharEfeitos(); palco.desenhar(); });
    $('#bc-efeitos').querySelectorAll('[data-ef-ancora]').forEach(s => s.onchange = () => { p.efeitos[+s.dataset.efAncora].ancora = s.value; marcarSujo(); desenharEfeitos(); palco.desenhar(); });
    const add = $('#bc-ef-add'); if (add) add.onclick = () => { const h = p.habilidades.find(x => x.id === $('#bc-ef-novo').value); p.efeitos.push({ id: h.id, nome: h.nome, efeito: h.efeito || null, ancora: 'hand_main', ativo: true }); marcarSujo(); desenharEfeitos(); palco.desenhar(); };
  }

  // ------------------------------------------------------------ início
  aplicarFerramenta();
  const inicial = new URLSearchParams(location.search).get('id');
  const alvo = entradas.find(x => x.id === inicial) || entradas.find(x => x.tipo === 'heroi');
  if (alvo) abrir(alvo);
})().catch(e => { console.error(e); const v = document.getElementById('bc-vazio'); if (v) v.querySelector('b').textContent = 'Erro: ' + e.message; });
