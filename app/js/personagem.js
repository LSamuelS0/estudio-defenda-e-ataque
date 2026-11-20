/* Área de trabalho do personagem: Visualização, Rig, Equipamentos, Adição e Inventário. */
(async () => {
  Comum.topo('inicio');
  const { esc } = Comum; const N = EstudioNucleo;
  const $ = s => document.querySelector(s);
  const id = new URLSearchParams(location.search).get('id');
  let ab; try { ab = await Armazem.abrir(id); } catch (e) { $('#p-nome').textContent = e.message; return; }
  let p = ab.p;
  const sel = { anim: Object.keys(p.animacoes || {})[0], dir: 'frente' };
  const cache = {};
  p.rig = p.rig || {}; p.revisado = p.revisado || {}; p.equipamentos = p.equipamentos || []; p.habilidades = p.habilidades || []; p.drops = p.drops || [];

  // ------------------------------------------------ cabeçalho
  function cabecalho() {
    $('#p-nome').textContent = p.nome; $('#p-desc').textContent = p.descricao || '';
    $('#p-tipo').textContent = (p.categoria === 'heroi' ? 'HERÓI / HUMANOIDE' : 'MONSTRO / CRIATURA') + ' · ' + (p.especie || '').toUpperCase();
    $('#migalha-cat').textContent = p.categoria === 'heroi' ? 'HERÓIS' : 'MONSTROS';
    $('#p-status').textContent = p.status || 'Em produção'; $('#p-status').className = 'selo ' + (p.status === 'No jogo' ? 'ok' : 'ouro');
    document.title = p.nome + ' · Estúdio Defenda e Ataque';
  }
  cabecalho();
  if (Armazem.desktop) { $('#b-pasta').hidden = false; $('#b-pasta').onclick = () => window.estudioDesktop.dados.abrirPasta('personagens/' + p.id); }
  async function salvar(arquivos, acao) { p = await Armazem.salvar(p, arquivos, acao); ab = await Armazem.abrir(p.id); return p; }

  // ------------------------------------------------ abas
  const paineis = ['ver', 'rig', 'equip', 'adicao', 'inv'];
  let abaAtual = new URLSearchParams(location.search).get('aba');
  if (!paineis.includes(abaAtual)) abaAtual = 'ver';
  function selecionarAba(nome) {
    abaAtual = nome;
    document.querySelectorAll('.aba').forEach(x => x.setAttribute('aria-selected', x.dataset.aba === nome ? 'true' : 'false'));
    paineis.forEach(n => $('#painel-' + n).hidden = n !== nome);
    atualizar();
  }
  document.querySelectorAll('.aba').forEach(b => b.onclick = () => selecionarAba(b.dataset.aba));
  document.querySelectorAll('.aba').forEach(b => b.setAttribute('aria-selected', b.dataset.aba === abaAtual ? 'true' : 'false'));
  paineis.forEach(n => $('#painel-' + n).hidden = n !== abaAtual);

  // ------------------------------------------------ animações
  async function carregar(anim, dir) {
    const k = anim + '/' + dir; if (cache[k]) return cache[k];
    const meta = await ab.lerJSON(p.animacoes[anim]);
    const d = meta.direcoes[dir] ? dir : Object.keys(meta.direcoes)[0];
    const quadros = await ImagemWeb.fatiarFolha(await ab.url(meta.direcoes[d].arquivo), meta);
    cache[k] = { meta, quadros, pontos: meta.direcoes[d].ponta_cajado_px || null, fps: meta.fps || meta.fps_ref || 10 };
    return cache[k];
  }
  const bytesDe = c => ({ w: c.width, h: c.height, bytes: c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data });

  function montarControles(alvo, palco, op = {}) {
    const anims = Object.keys(p.animacoes || {});
    alvo.innerHTML = `
      <select data-c="anim" title="Animação">${anims.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select>
      <div class="grupo">${N.DIRECOES.map(d => `<button class="chip" data-dir="${d}">${Comum.DIRECOES[d]}</button>`).join('')}</div>
      <div class="grupo"><button class="chip" data-c="ant" title="Quadro anterior">◀</button><button class="chip" data-c="play">❚❚</button><button class="chip" data-c="prox" title="Próximo quadro">▶</button><span class="mono" data-c="q">1/1</span></div><label class="linha-quadros"><span>Quadros</span><input type="range" data-c="scrub" min="0" max="0" value="0"><output data-c="qout">1 / 1</output></label><div class="tira-quadros" data-c="frames" aria-label="Quadros da animação"></div>
      <label class="grupo mudo">fps <input type="number" data-c="fps" min="1" max="30" style="width:58px"></label>
      <div class="grupo">${['escuro', 'grama', 'xadrez', 'claro'].map(f => `<button class="chip" data-fundo="${f}">${f}</button>`).join('')}</div>
      <button class="chip" data-c="cebola">casca de cebola</button>
      ${op.visualizacao ? '<button class="chip" data-c="malha">malha</button><button class="chip" data-c="silhueta">silhueta</button><button class="chip" data-c="trajetoria">trajetória</button>' : ''}
      ${op.extra || ''}`;
    if (op.visualizacao) { const bM=alvo.querySelector('[data-c=malha]'), bS=alvo.querySelector('[data-c=silhueta]'), bT=alvo.querySelector('[data-c=trajetoria]'); bM.onclick=()=>{palco.mostrarMalha=!palco.mostrarMalha;bM.setAttribute('aria-pressed',palco.mostrarMalha);op.alterarMalha&&op.alterarMalha(palco.mostrarMalha)}; bS.onclick=()=>{palco.silhueta=!palco.silhueta;bS.setAttribute('aria-pressed',palco.silhueta);palco.desenhar()}; bT.onclick=()=>{palco.mostrarTrajetoria=!palco.mostrarTrajetoria;bT.setAttribute('aria-pressed',palco.mostrarTrajetoria);palco.desenhar()}; }
    const s = alvo.querySelector('[data-c=anim]'); s.value = sel.anim; s.onchange = () => { sel.anim = s.value; atualizar(); };
    alvo.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { sel.dir = b.dataset.dir; atualizar(); });
    alvo.querySelector('[data-c=ant]').onclick = () => { palco.tocando = false; palco.irPara(palco.k - 1); sinc(); };
    alvo.querySelector('[data-c=prox]').onclick = () => { palco.tocando = false; palco.irPara(palco.k + 1); sinc(); };
    alvo.querySelector('[data-c=play]').onclick = () => { palco.tocando = !palco.tocando; sinc(); };
    const scrub = alvo.querySelector('[data-c=scrub]'); scrub.oninput = () => { palco.tocando = false; palco.irPara(+scrub.value); sinc(); };
    const fps = alvo.querySelector('[data-c=fps]'); fps.onchange = () => { palco.fps = Math.max(1, +fps.value || 10); };
    alvo.querySelectorAll('[data-fundo]').forEach(b => b.onclick = () => { palco.fundo = b.dataset.fundo; palco.desenhar(); sinc(); });
    alvo.querySelector('[data-c=cebola]').onclick = () => { palco.cebola = !palco.cebola; palco.desenhar(); sinc(); };
    function sinc() {
      s.value = sel.anim; fps.value = palco.fps;
      alvo.querySelectorAll('[data-dir]').forEach(b => b.setAttribute('aria-pressed', b.dataset.dir === sel.dir));
      alvo.querySelectorAll('[data-fundo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fundo === palco.fundo));
      alvo.querySelector('[data-c=cebola]').setAttribute('aria-pressed', palco.cebola);
      alvo.querySelector('[data-c=play]').textContent = palco.tocando ? '❚❚' : '►';
      alvo.querySelector('[data-c=q]').textContent = (palco.k + 1) + '/' + palco.quadros.length;
      const range = alvo.querySelector('[data-c=scrub]'); if (range) { range.max = Math.max(0, palco.quadros.length - 1); range.value = palco.k; alvo.querySelector('[data-c=qout]').textContent = (palco.k + 1) + ' / ' + palco.quadros.length; const tira=alvo.querySelector('[data-c=frames]'); if(tira && tira.childElementCount!==palco.quadros.length){tira.innerHTML=palco.quadros.map((_,i)=>'<button type="button" class="mini-quadro" data-frame="'+i+'" aria-label="Quadro '+(i+1)+'">'+(i+1)+'</button>').join(''); tira.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>{palco.tocando=false;palco.irPara(+b.dataset.frame);sinc()})} tira?.querySelectorAll('[data-frame]').forEach(b=>b.setAttribute('aria-current',+b.dataset.frame===palco.k?'true':'false')); }
    }
    palco.aoMudarQuadro = () => { sinc(); op.aoMudarQuadro && op.aoMudarQuadro(palco.k); };
    return sinc;
  }

  function mostrarConferencia(alvo, lista) {
    alvo.innerHTML = lista.map(r => `<div class="regra ${r.ok ? 'ok' : 'falha'}"><span class="icone">${r.ok ? '✔' : '✘'}</span><div><b>${esc(r.nome)}</b><span>${esc(r.texto)} · meta: ${esc(r.meta)}</span></div></div>`).join('');
  }

  // ------------------------------------------------ 01 visualização
  const palcoVer = new Palco($('#palco-ver'));
  const sincVer = montarControles($('#ctl-ver'), palcoVer, { visualizacao: true, alterarMalha: async (ativa) => { const a=await carregar(sel.anim,sel.dir); const L=ativa?await landmarksDe(sel.anim,sel.dir):null; palcoVer.definir({quadros:a.quadros,fps:a.fps,pivo:a.meta.pivo_px,pontos:a.pontos,landmarks:L}); } });
  const confCache = {};
  async function atualizarVer() {
    const a = await carregar(sel.anim, sel.dir);
    palcoVer.definir({ quadros: a.quadros, fps: a.fps, pivo: a.meta.pivo_px, pontos: a.pontos, landmarks: null }); sincVer();
    const m = a.meta;
    $('#ficha-ver').innerHTML = [['Animação', sel.anim + ' · ' + Comum.DIRECOES[sel.dir]], ['Quadros', m.quadros], ['Quadro (px)', m.largura_quadro + ' × ' + m.altura_quadro], ['Pivô (pé)', m.pivo_px.join(', ')], ['Escala no jogo', m.escala_jogo], ['FPS', m.fps || m.fps_ref || '—'], ['Arquivo', m.direcoes[sel.dir] ? m.direcoes[sel.dir].arquivo : '—'], ['Gerado por', m.gerado_por || '—']]
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
    const k = sel.anim + '/' + sel.dir;
    if (!confCache[k]) { $('#conf-ver').innerHTML = '<p class="mudo">Conferindo…</p>'; confCache[k] = Tarefas.rodar('conferir', { quadros: a.quadros.map(bytesDe) }); }
    mostrarConferencia($('#conf-ver'), await confCache[k]);
  }

  // ------------------------------------------------ 02 rig
  const palcoRig = new Palco($('#palco-rig')); palcoRig.editavel = true; palcoRig.tocando = false;
  const sincRig = montarControles($('#ctl-rig'), palcoRig, { aoMudarQuadro: () => listaRig() });
  const propostas = {};
  async function landmarksDe(anim, dir) {
    p.rig[anim] = p.rig[anim] || {};
    const a = await carregar(anim, dir); const k = anim + '/' + dir;
    if (!propostas[k]) propostas[k] = await Tarefas.rodar('landmarks', { quadros: a.quadros.map(bytesDe), opcoes: { corDestaque: [0.3, 0.55, 1] } });
    if (!p.rig[anim][dir]) p.rig[anim][dir] = JSON.parse(JSON.stringify(propostas[k]));
    return p.rig[anim][dir];
  }
  function revisados() { p.revisado[sel.anim] = p.revisado[sel.anim] || {}; return new Set(p.revisado[sel.anim][sel.dir] || []); }
  async function atualizarRig() {
    const a = await carregar(sel.anim, sel.dir);
    const L = await landmarksDe(sel.anim, sel.dir);
    palcoRig.revisados = revisados();
    palcoRig.definir({ quadros: a.quadros, fps: a.fps, pivo: a.meta.pivo_px, pontos: null, landmarks: L }); sincRig(); listaRig();
    $('#rig-arvore').innerHTML = N.HIERARQUIA.map(h => { let d = 0, x = h; while (x.pai) { d++; x = N.HIERARQUIA.find(y => y.id === x.pai); } return `<div style="padding-left:${d * 14}px">${d ? '└ ' : '● '}${esc(h.nome)}</div>`; }).join('');
  }
  function listaRig() {
    const L = palcoRig.landmarks && palcoRig.landmarks[palcoRig.k]; if (!L) return; const rv = revisados();
    $('#rig-lista').innerHTML = N.LANDMARKS.filter(n => L[n]).map(n => `<button class="regra ${n === palcoRig.selecionado ? 'ok' : ''}" data-l="${n}" style="text-align:left;cursor:pointer;color:inherit"><span class="icone" style="color:${rv.has(n) ? 'var(--green)' : 'var(--violet)'}">●</span><div><b>${esc(N.NOMES_LANDMARK[n] || n)}</b><span class="mono">${L[n][0].toFixed(0)}, ${L[n][1].toFixed(0)}</span></div></button>`).join('');
    $('#rig-lista').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { palcoRig.selecionado = b.dataset.l; palcoRig.desenhar(); listaRig(); });
  }
  palcoRig.aoSelecionar = () => listaRig();
  palcoRig.aoMoverLandmark = (k, nome) => {
    const rv = revisados(); rv.add(nome); p.revisado[sel.anim][sel.dir] = [...rv]; palcoRig.revisados = rv; palcoRig.desenhar(); listaRig();
    $('#rig-fb').textContent = 'Alterado (não salvo)';
  };
  $('#rig-propor').onclick = async () => {
    const k = sel.anim + '/' + sel.dir; p.rig[sel.anim][sel.dir] = JSON.parse(JSON.stringify(propostas[k]));
    p.revisado[sel.anim] = p.revisado[sel.anim] || {}; p.revisado[sel.anim][sel.dir] = []; atualizarRig(); $('#rig-fb').textContent = 'Pontos propostos de novo (não salvo)';
  };
  $('#rig-copiar').onclick = () => {
    // aplica o mesmo deslocamento (correção - proposta) do ponto selecionado em todos os quadros
    const n = palcoRig.selecionado; if (!n) { $('#rig-fb').textContent = 'Selecione um ponto primeiro'; return; }
    const prop = propostas[sel.anim + '/' + sel.dir]; const L = p.rig[sel.anim][sel.dir]; const k = palcoRig.k;
    const dx = L[k][n][0] - prop[k][n][0], dy = L[k][n][1] - prop[k][n][1];
    L.forEach((q, i) => { if (i !== k) q[n] = [+(prop[i][n][0] + dx).toFixed(1), +(prop[i][n][1] + dy).toFixed(1)]; });
    palcoRig.desenhar(); $('#rig-fb').textContent = 'Correção copiada para os ' + L.length + ' quadros (não salvo)';
  };
  $('#rig-salvar').onclick = async () => { await salvar({}, 'Rig revisado: ' + sel.anim + ' ' + sel.dir); $('#rig-fb').textContent = 'Rig salvo ✔'; };

  // ------------------------------------------------ 03 equipamentos
  const palcoEq = new Palco($('#palco-equip'));
  let verComItens = true;
  const sincEq = montarControles($('#ctl-equip'), palcoEq, { extra: '<button class="chip" data-c="itens" aria-pressed="true">ver com itens</button><button class="chip" data-c="exportar">salvar como animação nova</button>' });
  $('#ctl-equip [data-c=itens]').onclick = e => { verComItens = !verComItens; e.target.setAttribute('aria-pressed', verComItens); atualizarEquip(); };
  $('#ctl-equip [data-c=exportar]').onclick = () => exportarEquipado();
  const imgItens = {};
  async function imagemItem(it, dir) {
    const arq = (it.directional_assets && (it.directional_assets[dir] || it.directional_assets.frente)) || null; if (!arq) return null;
    if (!imgItens[arq]) { const bmp = await ImagemWeb.carregarBitmap(await ab.url(arq)); const c = ImagemWeb.canvas(bmp.width, bmp.height); c.getContext('2d').drawImage(bmp, 0, 0); imgItens[arq] = c; }
    return imgItens[arq];
  }
  function ajuste(it, dir) {
    it.ajustes = it.ajustes || {};
    if (!it.ajustes[dir]) it.ajustes[dir] = JSON.parse(JSON.stringify(it.ajustes.frente || { pega: [0, 0], angulo: 0, escala: 0.3, ordem: 'frente' }));
    return it.ajustes[dir];
  }
  async function itensParaCompor(dir) {
    const out = [];
    for (const it of p.equipamentos.filter(x => x.equipado !== false)) {
      const c = await imagemItem(it, dir); if (!c) continue; const aj = ajuste(it, dir);
      out.push({ imagem: bytesDe(c), pega: aj.pega, ancora: (it.anchors || [])[0] || 'hand_main', mira: (it.anchors || [])[1] || null, anguloExtra: aj.angulo, escala: aj.escala, ordem: aj.ordem, mascara: !!it.ocultarCorpo, folga: 1 });
    }
    return out;
  }
  let pedidoEq = 0;
  async function comporAnimacao(anim, dir) {
    const a = await carregar(anim, dir); const L = await landmarksDe(anim, dir); const itens = await itensParaCompor(dir);
    if (!itens.length) return a.quadros;
    const res = await Tarefas.rodar('compor', { quadros: a.quadros.map(bytesDe), landmarks: L, itens });
    return res.map(r => ImagemWeb.bytesParaCanvas(r.w, r.h, r.bytes));
  }
  async function atualizarEquip() {
    const meu = ++pedidoEq; const a = await carregar(sel.anim, sel.dir);
    const quadros = verComItens && p.equipamentos.length ? await comporAnimacao(sel.anim, sel.dir) : a.quadros;
    if (meu !== pedidoEq) return;
    palcoEq.definir({ quadros, fps: a.fps, pivo: a.meta.pivo_px, pontos: null, landmarks: null }); sincEq(); listaItens();
    if (verComItens && p.equipamentos.length) { const r = await Tarefas.rodar('conferir', { quadros: quadros.map(bytesDe) }); if (meu === pedidoEq) mostrarConferencia($('#conf-equip'), r); }
  }
  let itemSel = null;
  function listaItens() {
    $('#eq-lista').innerHTML = p.equipamentos.length ? p.equipamentos.map((it, i) => `<div class="regra ${it === itemSel ? 'ok' : ''}"><input type="checkbox" data-eq="${i}" ${it.equipado !== false ? 'checked' : ''} title="Equipado"><div style="flex:1;cursor:pointer" data-abrir="${i}"><b>${esc(it.name)}</b><span>${jaDesenhado(it.slot) ? '⚠ já desenhado no corpo · ' : ''}${esc(Comum.SLOTS[it.slot] || it.slot)} · âncora ${esc(N.NOMES_LANDMARK[(it.anchors || [])[0]] || '—')}</span></div><span class="selo">${esc(it.validation_status)}</span></div>`).join('') : '<p class="mudo">Nenhum item ainda. Adicione uma imagem ou recorte peças na aba Adição.</p>';
    $('#eq-lista').querySelectorAll('[data-eq]').forEach(c => c.onchange = () => {
      const it = p.equipamentos[+c.dataset.eq];
      if (c.checked && jaDesenhado(it.slot) && !confirm('"' + (Comum.SLOTS[it.slot] || it.slot) + '" já está desenhado no corpo deste personagem. Equipar vai mostrar a peça duplicada. Equipar mesmo assim (só para teste)?')) { c.checked = false; return; }
      it.equipado = c.checked; atualizarEquip();
    });
    $('#eq-lista').querySelectorAll('[data-abrir]').forEach(d => d.onclick = () => abrirItem(p.equipamentos[+d.dataset.abrir]));
  }
  $('#eq-slot').innerHTML = (p.slots || Object.keys(Comum.SLOTS)).map(s => `<option value="${s}">${esc(Comum.SLOTS[s] || s)}</option>`).join('');
  $('#eq-ancora').innerHTML = N.LANDMARKS.map(l => `<option value="${l}">${esc(N.NOMES_LANDMARK[l])}</option>`).join('');
  $('#eq-mira').innerHTML = '<option value="">Não girar (fica reto)</option>' + N.LANDMARKS.map(l => `<option value="${l}">${esc(N.NOMES_LANDMARK[l])}</option>`).join('');
  $('#eq-perfil').innerHTML = Object.entries(Comum.PERFIS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  async function abrirItem(it) {
    itemSel = it; $('#eq-editor').hidden = false; $('#eq-titulo').textContent = it.name; const aj = ajuste(it, sel.dir);
    $('#eq-nome').value = it.name; $('#eq-slot').value = it.slot; $('#eq-ancora').value = (it.anchors || [])[0] || 'hand_main'; $('#eq-mira').value = (it.anchors || [])[1] || '';
    $('#eq-perfil').value = it.deformation_profile; $('#eq-ordem').value = aj.ordem; $('#eq-escala').value = aj.escala; $('#eq-angulo').value = aj.angulo; $('#eq-ocultar').checked = !!it.ocultarCorpo;
    $('#eq-escala-v').textContent = (+aj.escala).toFixed(2); $('#eq-angulo-v').textContent = aj.angulo + '°';
    desenharPega(); listaItens();
  }
  async function desenharPega() {
    const it = itemSel; if (!it) return; const c = $('#eq-pega'); const img = await imagemItem(it, sel.dir); if (!img) return;
    const dpr = devicePixelRatio || 1; c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; const g = c.getContext('2d');
    const e = Math.min(c.width / img.width, c.height / img.height) * 0.9; const ox = (c.width - img.width * e) / 2, oy = (c.height - img.height * e) / 2;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(img, ox, oy, img.width * e, img.height * e);
    const [px, py] = ajuste(it, sel.dir).pega; g.strokeStyle = '#c9a96e'; g.lineWidth = 2 * dpr;
    g.beginPath(); g.moveTo(ox + px * e - 10 * dpr, oy + py * e); g.lineTo(ox + px * e + 10 * dpr, oy + py * e); g.moveTo(ox + px * e, oy + py * e - 10 * dpr); g.lineTo(ox + px * e, oy + py * e + 10 * dpr); g.stroke();
    c.onclick = ev => { const r = c.getBoundingClientRect(); const x = ((ev.clientX - r.left) * dpr - ox) / e, y = ((ev.clientY - r.top) * dpr - oy) / e; ajuste(it, sel.dir).pega = [Math.round(x), Math.round(y)]; desenharPega(); atualizarEquipDepois(); };
  }
  let tEq = 0; function atualizarEquipDepois() { clearTimeout(tEq); tEq = setTimeout(atualizarEquip, 180); }
  function lerEditor() {
    const it = itemSel; if (!it) return; const aj = ajuste(it, sel.dir);
    it.name = $('#eq-nome').value.trim() || it.name; it.slot = $('#eq-slot').value; it.anchors = [$('#eq-ancora').value].concat($('#eq-mira').value ? [$('#eq-mira').value] : []);
    it.deformation_profile = $('#eq-perfil').value; aj.ordem = $('#eq-ordem').value; aj.escala = +$('#eq-escala').value; aj.angulo = +$('#eq-angulo').value; it.ocultarCorpo = $('#eq-ocultar').checked;
    it.draw_order = aj.ordem === 'atras' ? 'behind_body' : 'front_of_body';
    $('#eq-escala-v').textContent = aj.escala.toFixed(2); $('#eq-angulo-v').textContent = aj.angulo + '°';
    atualizarEquipDepois();
  }
  ['#eq-nome', '#eq-slot', '#eq-ancora', '#eq-mira', '#eq-perfil', '#eq-ordem', '#eq-escala', '#eq-angulo', '#eq-ocultar'].forEach(s => $(s).addEventListener('input', lerEditor));
  $('#eq-salvar').onclick = async () => { lerEditor(); await salvar({}, 'Item ajustado: ' + itemSel.name); $('#eq-fb').textContent = 'Salvo ✔'; listaItens(); };
  $('#eq-remover').onclick = async () => {
    if (!itemSel) return; p.equipamentos = p.equipamentos.filter(x => x !== itemSel); itemSel = null; $('#eq-editor').hidden = true;
    await salvar({}, 'Item removido'); atualizarEquip();
  };
  // slots que já vêm pintados no desenho do personagem (ex.: o mago v2 já tem capuz, manto e cajado):
  // equipar outro item ali duplica a peça (dois cajados). Regra: só equipar nesses slots num corpo-base sem a peça.
  const jaDesenhado = slot => (p.slotsNoDesenho || []).includes(slot);
  async function novoItem(nome, canvasItem, slot) {
    const iid = Comum.slug(nome) + '_' + Date.now().toString(36); const arq = 'equipamentos/' + iid + '.png';
    const a = await carregar(sel.anim, sel.dir); const L = (await landmarksDe(sel.anim, sel.dir))[0];
    const corpo = L ? (L.foot_contact_left[1] - L.head_top[1]) : a.meta.altura_quadro * 0.8;
    const it = {
      id: iid, name: nome, slot: slot || 'main_hand', compatible_archetypes: [p.arquetipo || 'humanoid_biped'], coverage_regions: [],
      anchors: ['hand_main'], draw_order: 'front_of_body', deformation_profile: 'rigid_low_deform',
      directional_assets: { frente: arq }, ajustes: { frente: { pega: [Math.round(canvasItem.width / 2), Math.round(canvasItem.height * 0.55)], angulo: 0, escala: +Math.min(1.5, (corpo * 0.9) / canvasItem.height).toFixed(2), ordem: 'frente' } },
      ocultarCorpo: false, equipado: !jaDesenhado(slot || 'main_hand'), validation_status: 'draft',
    };
    if (jaDesenhado(it.slot)) $('#eq-fb').textContent = 'Atenção: "' + (Comum.SLOTS[it.slot] || it.slot) + '" já está desenhado no corpo de ' + p.nome + '. O item foi guardado desligado para não aparecer duplicado.';
    p.equipamentos.push(it); imgItens[arq] = canvasItem;
    await salvar({ [arq]: await ImagemWeb.canvasParaPNG(canvasItem) }, 'Item novo: ' + nome);
    return it;
  }
  $('#eq-arquivo').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return; $('#eq-fb').textContent = 'Tirando o fundo…';
    const im = await ImagemWeb.paraNucleo(f); const r = await Tarefas.rodar('semFundo', { imagem: im });
    const it = await novoItem(f.name.replace(/\.[^.]+$/, ''), ImagemWeb.bytesParaCanvas(r.w, r.h, r.bytes));
    ev.target.value = ''; abrirItem(it); atualizarEquip();
  };
  async function exportarEquipado() {
    const nome = sel.anim + '_equipado'; const meta0 = (await carregar(sel.anim, 'frente')).meta; const arquivos = {}; const meta = JSON.parse(JSON.stringify(meta0)); meta.direcoes = {};
    for (const d of Object.keys(meta0.direcoes)) {
      const qs = await comporAnimacao(sel.anim, d); const arq = p.id + '_' + nome + '_' + d + '.png';
      arquivos[arq] = await ImagemWeb.canvasParaPNG(ImagemWeb.juntarFolha(qs));
      meta.direcoes[d] = { ...meta0.direcoes[d], arquivo: arq };
    }
    meta.equipamentos = p.equipamentos.filter(x => x.equipado !== false).map(x => x.id);
    arquivos[p.id + '_' + nome + '.json'] = JSON.stringify(meta, null, 1);
    p.animacoes[nome] = p.id + '_' + nome + '.json';
    await salvar(arquivos, 'Animação com itens: ' + nome);
    alert('Salvo como a animação "' + nome + '". Ela aparece na lista de animações e vai junto em "Enviar para o jogo".');
    montarControles($('#ctl-ver'), palcoVer);
  }

  // ------------------------------------------------ 04 adição
  $('#ad-anim').href = 'producao.html?id=' + encodeURIComponent(p.id);
  $('#ad-pecas').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return; $('#ad-fb').textContent = 'Recortando peças…';
    const pecas = await Tarefas.rodar('pecas', { imagem: await ImagemWeb.paraNucleo(f) });
    $('#ad-fb').textContent = pecas.length + ' peça(s) encontrada(s). Escolha o slot e clique em "Virar item".';
    const opcoes = (p.slots || Object.keys(Comum.SLOTS)).map(s => `<option value="${s}">${esc(Comum.SLOTS[s] || s)}</option>`).join('');
    $('#ad-resultado').innerHTML = '';
    pecas.forEach((pc, i) => {
      const c = ImagemWeb.bytesParaCanvas(pc.w, pc.h, pc.bytes); const div = document.createElement('div'); div.className = 'cartao folha';
      const img = document.createElement('img'); img.src = c.toDataURL(); div.appendChild(img);
      div.insertAdjacentHTML('beforeend', `<label class="campo">Nome<input type="text" value="Peça ${i + 1}"></label><label class="campo">Slot<select>${opcoes}</select></label><div class="linha-botoes"><button class="botao pequeno primario">Virar item</button></div>`);
      div.querySelector('button').onclick = async () => { const it = await novoItem(div.querySelector('input').value, c, div.querySelector('select').value); div.querySelector('button').disabled = true; div.querySelector('button').textContent = 'Virou item ✔'; void it; };
      $('#ad-resultado').appendChild(div);
    });
    ev.target.value = '';
  };
  $('#ad-gesto').innerHTML = Object.entries(N.GESTOS).map(([k, g]) => `<option value="${k}">${esc(g.nome)}</option>`).join('');
  $('#ad-gesto-b').onclick = async () => {
    const chave = $('#ad-gesto').value, g = N.GESTOS[chave]; const b = $('#ad-gesto-b'); b.disabled = true;
    try {
      const base = p.animacoes.parado ? 'parado' : Object.keys(p.animacoes)[0];
      const meta0 = (await carregar(base, 'frente')).meta; const meta = JSON.parse(JSON.stringify(meta0)); meta.direcoes = {}; const arquivos = {};
      const nome = 'gesto_' + chave; let regrasOk = true;
      for (const d of Object.keys(meta0.direcoes)) {
        $('#ad-fb').textContent = 'Gerando ' + g.nome + ' · ' + Comum.DIRECOES[d] + '…';
        const a = await carregar(base, d); const L = (await landmarksDe(base, d))[0];
        const r = await Tarefas.rodar('gesto', { bases: a.quadros.map(bytesDe), landmarks: L, segmentos: g.segmentos, ordemPeca: d === 'costas' ? 'atras' : 'frente' });
        regrasOk = regrasOk && r.regra.ok;
        // skill: toda animação (inclusive teste) passa pela conferência; reprovada não é salva
        if (!r.aprovado) { const ruins = r.conferencia.filter(x => !x.ok).map(x => x.nome + ' (' + x.texto + ')').join('; '); throw new Error('REPROVADO em ' + Comum.DIRECOES[d] + ': ' + ruins + '. Nada foi salvo.'); }
        const qs = r.quadros.map(q => ImagemWeb.bytesParaCanvas(q.w, q.h, q.bytes)); const arq = p.id + '_' + nome + '_' + d + '.png';
        arquivos[arq] = await ImagemWeb.canvasParaPNG(ImagemWeb.juntarFolha(qs));
        meta.direcoes[d] = { arquivo: arq, ponta_cajado_px: (a.pontos || []).map((pt, k) => pt && r.pontos[k] ? [+(pt[0] + r.pontos[k][0]).toFixed(1), +(pt[1] + r.pontos[k][1]).toFixed(1)] : pt) };
      }
      meta.quadros = meta.colunas = 30; meta.fps = 15; meta.duracao_s = 2; meta.procedural = { gesto: chave, segmentos: g.segmentos, regra_nao_volta: regrasOk };
      arquivos[p.id + '_' + nome + '.json'] = JSON.stringify(meta, null, 1); p.animacoes[nome] = p.id + '_' + nome + '.json';
      await salvar(arquivos, 'Gesto procedural: ' + g.nome);
      $('#ad-fb').textContent = 'Pronto ✔ "' + nome + '" (30 quadros, 4 direções' + (regrasOk ? ', regra "não volta" ok' : '') + '). Veja na aba Visualização.';
      montarControles($('#ctl-ver'), palcoVer);
    } catch (e) { $('#ad-fb').textContent = 'Erro: ' + e.message; console.error(e); }
    b.disabled = false;
  };
  $('#ad-hab-b').onclick = async () => { const n = $('#ad-hab').value.trim(); if (!n) return; p.habilidades.push({ id: Comum.slug(n), nome: n }); $('#ad-hab').value = ''; await salvar({}, 'Habilidade: ' + n); $('#ad-fb').textContent = 'Habilidade adicionada ✔'; };
  $('#ad-drop-b').onclick = async () => { const n = $('#ad-drop').value.trim(); if (!n) return; p.drops.push({ id: Comum.slug(n), nome: n }); $('#ad-drop').value = ''; await salvar({}, 'Drop: ' + n); $('#ad-fb').textContent = 'Drop adicionado ✔'; };

  // ------------------------------------------------ 05 inventário
  function atualizarInv() {
    $('#inv-slots').innerHTML = (p.slots || []).map(s => { const it = p.equipamentos.find(x => x.slot === s && x.equipado !== false); return `<div class="slot ${it ? 'cheio' : ''}"><b>${esc(Comum.SLOTS[s] || s)}</b><br>${it ? esc(it.name) : 'vazio'}</div>`; }).join('');
    $('#inv-hab').innerHTML = p.habilidades.map(h => `<div class="regra"><span class="icone">✧</span><div><b>${esc(h.nome)}</b><span>${esc(h.efeito || '')}</span></div></div>`).join('') || '<p class="mudo">Nenhuma.</p>';
    $('#inv-drop').innerHTML = p.drops.map(h => `<div class="regra"><span class="icone">✦</span><div><b>${esc(h.nome)}</b></div></div>`).join('') || '<p class="mudo">Nenhum.</p>';
    $('#inv-hist').innerHTML = (p.historico || []).slice().reverse().map(h => `<div>${esc(h.data.slice(0, 16).replace('T', ' '))} · ${esc(h.acao)}</div>`).join('');
  }

  // ------------------------------------------------ enviar para o jogo
  $('#b-jogo').onclick = async () => {
    const b = $('#b-jogo'); b.disabled = true; b.textContent = 'Preparando…';
    try {
      const pasta = p.pastaJogo || ('art/' + p.id); const arquivos = {};
      for (const anim in p.animacoes) {
        const meta = await ab.lerJSON(p.animacoes[anim]); arquivos[pasta + '/' + p.animacoes[anim]] = JSON.stringify(meta, null, 1);
        for (const d in meta.direcoes) arquivos[pasta + '/' + meta.direcoes[d].arquivo] = new Uint8Array(await (await fetch(await ab.url(meta.direcoes[d].arquivo))).arrayBuffer());
      }
      for (const it of p.equipamentos) { const arq = it.directional_assets && it.directional_assets.frente; if (arq) arquivos[pasta + '/icones/' + it.id + '.png'] = new Uint8Array(await (await fetch(await ab.url(arq))).arrayBuffer()); }
      if (p.equipamentos.length) arquivos[pasta + '/equipamentos.json'] = JSON.stringify(p.equipamentos.map(({ ajustes, ...r }) => ({ ...r, ajustes })), null, 1);
      const r = await Armazem.enviarParaJogo(arquivos, p.id + '_para_o_jogo.zip');
      b.textContent = r.ok ? (r.pasta ? 'Enviado ✔' : 'Baixado ✔') : 'Enviar para o jogo';
      if (r.ok) await salvar({}, 'Enviado para o jogo (' + Object.keys(arquivos).length + ' arquivos em ' + pasta + ')');
    } catch (e) { alert(e.message); b.textContent = 'Enviar para o jogo'; }
    b.disabled = false; setTimeout(() => { b.textContent = 'Enviar para o jogo'; }, 4000);
  };

  // ------------------------------------------------
  async function atualizar() {
    try {
      if (abaAtual === 'ver') await atualizarVer();
      else if (abaAtual === 'rig') await atualizarRig();
      else if (abaAtual === 'equip') await atualizarEquip();
      else if (abaAtual === 'inv') atualizarInv();
    } catch (e) { console.error(e); }
  }
  atualizar();
})().catch(e => { console.error(e); document.getElementById('p-nome').textContent = e.message; });
