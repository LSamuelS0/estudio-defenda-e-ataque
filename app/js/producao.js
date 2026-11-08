/* Linha de produção: folhas desenhadas -> personagem pronto (PNG + JSON no formato do jogo). */
(async () => {
  Comum.topo('producao');
  const { esc } = Comum; const N = EstudioNucleo; const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  let existente = null;
  if (q.get('id')) {
    try {
      existente = (await Armazem.abrir(q.get('id'))).p;
      $('#f-nome').value = existente.nome; $('#f-nome').disabled = true; $('#f-cat').value = existente.categoria; $('#f-cat').disabled = true;
      $('#f-especie').value = existente.especie || ''; $('#f-arq').value = existente.arquetipo || 'humanoid_biped';
      $('#f-existente').hidden = false; $('#f-existente').textContent = 'Adicionando animação em "' + existente.nome + '". Use outro nome de animação para não substituir a atual (ex.: correr, atacar).';
      $('#titulo').textContent = 'Nova animação para ' + existente.nome;
    } catch { /* id inválido: vira personagem novo */ }
  } else if (q.get('categoria')) $('#f-cat').value = q.get('categoria') === 'monstro' ? 'monstro' : 'heroi';

  const folhas = []; // {arquivo, url, dir}
  const etapa = n => document.querySelectorAll('.etapa').forEach(e => { const k = +e.dataset.e; e.className = 'etapa' + (k < n ? ' feita' : k === n ? ' ativa' : ''); });
  function desenharFolhas() {
    $('#folhas').innerHTML = '';
    folhas.forEach((f, i) => {
      const d = document.createElement('div'); d.className = 'cartao folha';
      d.innerHTML = `<img src="${f.url}" alt=""><div class="mono" style="margin-bottom:6px">${esc(f.arquivo.name)}</div>
        <div class="linha-botoes" style="margin-top:0"><select>${N.DIRECOES.map(x => `<option value="${x}" ${x === f.dir ? 'selected' : ''}>${Comum.DIRECOES[x]}</option>`).join('')}</select><button class="botao pequeno">Tirar</button></div>`;
      d.querySelector('select').onchange = e => { f.dir = e.target.value; validar(); };
      d.querySelector('button').onclick = () => { folhas.splice(i, 1); desenharFolhas(); };
      $('#folhas').appendChild(d);
    });
    validar();
  }
  function validar() {
    const dirs = folhas.map(f => f.dir); const repetida = dirs.some((d, i) => dirs.indexOf(d) !== i);
    $('#b-produzir').disabled = !folhas.length || repetida;
    $('#progresso-txt').textContent = repetida ? 'Duas folhas com a mesma direção — ajuste antes de produzir.' : folhas.length ? folhas.length + ' folha(s): ' + dirs.map(d => Comum.DIRECOES[d]).join(', ') : '';
    etapa(folhas.length ? 3 : ($('#f-nome').value ? 2 : 1));
  }
  function adicionar(lista) {
    for (const arquivo of lista) {
      if (!arquivo.type.startsWith('image/')) continue;
      const usadas = new Set(folhas.map(f => f.dir));
      const dir = N.adivinharDirecao(arquivo.name) || N.DIRECOES.find(d => !usadas.has(d)) || 'frente';
      folhas.push({ arquivo, url: URL.createObjectURL(arquivo), dir });
    }
    desenharFolhas();
  }
  const zona = $('#soltar');
  zona.onclick = () => $('#f-arquivos').click(); zona.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') $('#f-arquivos').click(); };
  $('#f-arquivos').onchange = e => { adicionar(e.target.files); e.target.value = ''; };
  zona.ondragover = e => { e.preventDefault(); zona.classList.add('sobre'); };
  zona.ondragleave = () => zona.classList.remove('sobre');
  zona.ondrop = e => { e.preventDefault(); zona.classList.remove('sobre'); adicionar(e.dataTransfer.files); };
  $('#f-nome').oninput = validar;

  let resultado = null, idPers = null;
  const hexParaCor = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  $('#b-produzir').onclick = async () => {
    const nome = $('#f-nome').value.trim(); if (!nome) { $('#f-nome').focus(); $('#progresso-txt').textContent = 'Dê um nome ao personagem.'; return; }
    idPers = existente ? existente.id : Comum.slug(nome);
    $('#b-produzir').disabled = true; etapa(4);
    const dados = { folhas: {}, opcoes: {
      nome: idPers, nomeAnim: Comum.slug($('#f-anim').value) || 'andar', alturaCorpo: +$('#f-altura').value, escalaJogo: +$('#f-escala').value, fps: +$('#f-fps').value,
      quadrosPorFolha: +$('#f-quadros').value || undefined, corDestaque: $('#f-destaque').checked ? hexParaCor($('#f-cor').value) : undefined,
      gerarIdle: $('#f-idle').checked, quadrosIdle: +$('#f-idle-q').value } };
    const t0 = performance.now();
    try {
      $('#progresso-txt').textContent = 'Lendo as folhas…';
      for (const f of folhas) dados.folhas[f.dir] = await ImagemWeb.paraNucleo(f.arquivo);
      resultado = await Tarefas.rodar('produzir', dados, (txt, parte) => { $('#progresso-txt').textContent = txt; $('#progresso').style.width = Math.round(parte * 100) + '%'; });
      $('#progresso').style.width = '100%';
      $('#progresso-txt').textContent = 'Pronto em ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s';
      mostrar(dados.opcoes);
    } catch (e) { $('#progresso-txt').textContent = 'Erro: ' + e.message; console.error(e); }
    $('#b-produzir').disabled = false;
  };

  function mostrar(op) {
    $('#s-resultado').hidden = false; $('#resultado').innerHTML = '';
    $('#avisos').hidden = !resultado.avisos.length; $('#avisos').innerHTML = resultado.avisos.map(esc).join('<br>');
    for (const grupo of ['andar', 'idle']) for (const d in resultado[grupo]) {
      const r = resultado[grupo][d]; const conf = resultado.conferencia[(grupo === 'andar' ? 'andar_' : 'parado_') + d];
      const ok = conf.every(x => x.ok);
      const div = document.createElement('div'); div.className = 'cartao';
      div.innerHTML = `<div class="cabecalho" style="margin-bottom:6px"><b>${grupo === 'andar' ? esc(op.nomeAnim) : 'parado (idle)'} · ${Comum.DIRECOES[d]}</b><span class="selo ${ok ? 'ok' : 'falha'}">${conf.filter(x => x.ok).length}/${conf.length} regras</span></div>
        <canvas class="mini-palco"></canvas><details style="margin-top:8px"><summary class="mudo">Conferência</summary><div class="lista">${conf.map(x => `<div class="regra ${x.ok ? 'ok' : 'falha'}"><span class="icone">${x.ok ? '✔' : '✘'}</span><div><b>${esc(x.nome)}</b><span>${esc(x.texto)}</span></div></div>`).join('')}</div></details>`;
      $('#resultado').appendChild(div);
      const fw = resultado.largura, n = r.folha.w / fw; const folha = ImagemWeb.bytesParaCanvas(r.folha.w, r.folha.h, r.folha.bytes);
      const qs = []; for (let k = 0; k < n; k++) { const c = ImagemWeb.canvas(fw, r.folha.h); c.getContext('2d').drawImage(folha, k * fw, 0, fw, r.folha.h, 0, 0, fw, r.folha.h); qs.push(c); }
      const palco = new Palco(div.querySelector('canvas'), { fundo: 'grama' });
      palco.definir({ quadros: qs, fps: grupo === 'andar' ? op.fps : (resultado.jsonIdle.fps || 5.5), pivo: resultado.pivo, pontos: r.pontos });
      r._quadrosCanvas = qs; r._folhaCanvas = folha;
    }
    $('#s-resultado').scrollIntoView({ behavior: 'smooth' });
  }

  async function arquivosDoResultado() {
    const arq = {}; const anim = Comum.slug($('#f-anim').value) || 'andar';
    for (const grupo of ['andar', 'idle']) for (const d in resultado[grupo]) { const r = resultado[grupo][d]; arq[r.arquivo] = await ImagemWeb.canvasParaPNG(r._folhaCanvas); }
    arq[idPers + '_' + anim + '.json'] = JSON.stringify(resultado.jsonAndar, null, 1);
    if (resultado.jsonIdle) arq[idPers + '_parado.json'] = JSON.stringify(resultado.jsonIdle, null, 1);
    // guarda também as folhas originais (preservar originais — skill de equipamentos, seção 15)
    for (const f of folhas) arq['fonte/' + anim + '_' + f.dir + '.' + (f.arquivo.name.split('.').pop() || 'png')] = f.arquivo;
    return { arq, anim };
  }
  $('#b-salvar').onclick = async () => {
    const { arq, anim } = await arquivosDoResultado();
    const p = existente || { id: idPers, nome: $('#f-nome').value.trim(), categoria: $('#f-cat').value, especie: $('#f-especie').value.trim() || 'personagem',
      arquetipo: $('#f-arq').value, descricao: '', status: 'Em produção', pastaJogo: 'art/' + idPers,
      slots: $('#f-cat').value === 'heroi' ? ['head', 'neck', 'shoulders', 'chest', 'back', 'hands', 'waist', 'legs', 'feet', 'main_hand', 'off_hand', 'accessories'] : ['pele', 'carapaca', 'ornamento', 'accessories'],
      animacoes: {}, rig: {}, revisado: {}, equipamentos: [], habilidades: [], drops: [] };
    p.animacoes = p.animacoes || {}; p.animacoes[anim] = idPers + '_' + anim + '.json'; if (resultado.jsonIdle) p.animacoes.parado = idPers + '_parado.json';
    if (p.rig) { delete p.rig[anim]; if (resultado.jsonIdle) delete p.rig.parado; }
    await Armazem.salvar(p, arq, 'Linha de produção: ' + anim + ' (' + folhas.length + ' direções)' + (resultado.jsonIdle ? ' + parado' : ''));
    $('#fb').innerHTML = 'Salvo ✔ <a href="personagem.html?id=' + encodeURIComponent(idPers) + '">Abrir o personagem →</a>';
  };
  $('#b-jogo').onclick = async () => {
    const { arq } = await arquivosDoResultado(); const pasta = (existente && existente.pastaJogo) || 'art/' + idPers; const envio = {};
    for (const k in arq) if (!k.startsWith('fonte/')) envio[pasta + '/' + k] = arq[k];
    const r = await Armazem.enviarParaJogo(envio, idPers + '_para_o_jogo.zip');
    $('#fb').textContent = r.ok ? (r.pasta ? 'Enviado para ' + r.pasta + '\\' + pasta.replace(/\//g, '\\') + ' ✔ (o arquivo antigo ficou como .bak)' : 'Baixado ' + r.zip + ' ✔') : r.motivo;
  };
  $('#b-zip').onclick = async () => {
    const { arq } = await arquivosDoResultado(); const zip = new JSZip(); for (const k in arq) if (!k.startsWith('fonte/')) zip.file(k, arq[k]);
    Armazem.baixar(await zip.generateAsync({ type: 'blob' }), idPers + '_animacoes.zip');
  };
  validar();
})();
