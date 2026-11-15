(async () => {
  Comum.topo('inicio');
  const { esc } = Comum;
  const lista = await Armazem.listar();
  let atalhos = [];
  try { atalhos = (await (await fetch('dados/entidades.json')).json()).atalhos || []; } catch { /* sem atalhos */ }
  const cartao = p => `<a class="cartao personagem" href="personagem.html?id=${encodeURIComponent(p.id)}">
      <div class="miniatura" data-mini="${esc(p.id)}">${p.categoria === 'heroi' ? '♙' : '◉'}</div>
      <div><span class="tipo">${p.categoria === 'heroi' ? 'HERÓI' : 'CRIATURA'} · ${esc((p.especie || '').toUpperCase())}</span>
      <h3>${esc(p.nome)}</h3><p class="mudo">${esc(p.descricao || '')}</p>
      <span class="selo ${p.status === 'No jogo' ? 'ok' : 'ouro'}">${esc(p.status || 'Em produção')}</span> ${p.origem === 'usuario' ? '<span class="selo">editado</span>' : ''}</div></a>`;
  const atalho = a => `<a class="cartao personagem" href="${esc(a.ferramenta)}">
      <div class="miniatura" style="color:${esc(a.cor)};font-size:34px">◉</div>
      <div><span class="tipo">CRIATURA · ${esc(a.especie.toUpperCase())}</span><h3>${esc(a.nome)}</h3><p class="mudo">${esc(a.descricao)}</p>
      <span class="selo">gerador de slimes ↗</span></div></a>`;
  const novo = cat => `<a class="cartao personagem novo" href="producao.html?categoria=${cat}"><div><b>＋ Novo ${cat === 'heroi' ? 'herói' : 'monstro'}</b><p class="mudo">Arraste as folhas desenhadas e o Estúdio faz o resto.</p></div></a>`;
  const herois = lista.filter(p => p.categoria === 'heroi'), monstros = lista.filter(p => p.categoria !== 'heroi');
  document.getElementById('lista-herois').innerHTML = herois.map(cartao).join('') + novo('heroi');
  document.getElementById('lista-monstros').innerHTML = monstros.map(cartao).join('') + atalhos.map(atalho).join('') + novo('monstro');
  document.getElementById('n-herois').textContent = herois.length + ' personagem(ns)';
  document.getElementById('n-monstros').textContent = (monstros.length + atalhos.length) + ' criatura(s)';
  for (const p of lista) { const alvo = document.querySelector(`[data-mini="${CSS.escape(p.id)}"]`); if (alvo) Comum.miniatura(p, alvo); }

  const info = document.getElementById('projeto-info');
  if (Armazem.desktop) {
    const pasta = await Armazem.pastaJogo();
    info.innerHTML = `<p>Seus personagens ficam em <b>Documentos › Estúdio Defenda e Ataque › personagens</b> (uma pasta por personagem, com as folhas, o JSON e o histórico).</p>
      <p>Pasta do jogo: <b id="pasta-jogo">${pasta ? esc(pasta) : 'ainda não escolhida'}</b></p>
      <div class="linha-botoes"><button class="botao" id="abrir-pasta">Abrir pasta dos personagens</button><button class="botao" id="trocar-jogo">${pasta ? 'Trocar' : 'Escolher'} pasta do jogo</button></div>`;
    document.getElementById('abrir-pasta').onclick = () => Armazem.abrirPastaPersonagens();
    document.getElementById('trocar-jogo').onclick = async () => { const p = await Armazem.escolherPastaJogo(); if (p) document.getElementById('pasta-jogo').textContent = p; };
  } else {
    info.innerHTML = `<p>Você está usando o Estúdio no navegador: os personagens ficam guardados neste navegador, e "Enviar para o jogo" baixa um .zip para descompactar na pasta do jogo.</p>
      <p class="mudo">No aplicativo do Windows tudo vai direto para as pastas certas.</p>`;
  }
})().catch(e => { document.querySelector('.pagina').insertAdjacentHTML('beforeend', `<p class="feedback erro">${e.message}</p>`); console.error(e); });
