/* Peças comuns das páginas: barra do topo, nomes em português, utilidades. */
window.Comum = (() => {
  const SLOTS = {
    head: 'Cabeça', neck: 'Pescoço', shoulders: 'Ombros', chest: 'Peito', back: 'Costas / capa', upper_arms: 'Braços', forearms: 'Antebraços',
    hands: 'Mãos', waist: 'Cintura', legs: 'Pernas', feet: 'Pés', main_hand: 'Mão principal (arma)', off_hand: 'Mão secundária', accessories: 'Acessórios',
    pele: 'Pele', carapaca: 'Carapaça', ornamento: 'Ornamento',
  };
  const DIRECOES = { frente: 'Frente', costas: 'Costas', esquerda: 'Esquerda', direita: 'Direita' };
  const PERFIS = {
    rigid_low_deform: 'Rígido (só gira e move) — armadura, cajado, capacete',
    rigid_preserve_volume: 'Rígido preservando volume — placas',
    moderate: 'Moderado — tecido justo',
    cloth_secondary_motion: 'Tecido solto com atraso — capa, manto',
    flexible: 'Flexível — corpo',
    custom: 'Personalizado',
  };
  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function topo(atual) {
    const links = [['index.html', 'Personagens', 'inicio'], ['producao.html', 'Linha de produção', 'producao'], ['ferramentas/index.html', 'Ferramentas', 'ferramentas'], ['guia.html', 'Guia', 'guia']];
    const h = document.createElement('header'); h.className = 'topo';
    h.innerHTML = `<a class="marca" href="index.html"><span class="marca-simbolo">✦</span><span><b>DEFENDA E ATAQUE</b><small>ESTÚDIO</small></span></a>
      <nav aria-label="Seções">${links.map(([u, t, id]) => `<a href="${u}"${id === atual ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
    document.body.prepend(h);
  }
  function slug(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'personagem'; }
  async function miniatura(p, alvo) {
    // anima o "parado" de frente (ou o primeiro que existir) num canvas pequeno
    try {
      const ab = await Armazem.abrir(p.id); const nomeJson = p.animacoes && (p.animacoes.parado || p.animacoes.andar); if (!nomeJson) return;
      const meta = await ab.lerJSON(nomeJson); const dir = meta.direcoes.frente ? 'frente' : Object.keys(meta.direcoes)[0];
      const qs = await ImagemWeb.fatiarFolha(await ab.url(meta.direcoes[dir].arquivo), meta);
      const c = document.createElement('canvas'); const s = Math.min(72 / meta.largura_quadro, 88 / meta.altura_quadro) * 2;
      c.width = Math.round(meta.largura_quadro * s); c.height = Math.round(meta.altura_quadro * s); c.style.width = c.width / 2 + 'px';
      alvo.innerHTML = ''; alvo.appendChild(c); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; let k = 0;
      const fps = meta.fps || meta.fps_ref || 8;
      const t = setInterval(() => { if (!c.isConnected) return clearInterval(t); g.clearRect(0, 0, c.width, c.height); g.drawImage(qs[k], 0, 0, c.width, c.height); k = (k + 1) % qs.length; }, 1000 / fps);
    } catch (e) { console.warn('miniatura', p.id, e); }
  }
  return { SLOTS, DIRECOES, PERFIS, esc, topo, slug, miniatura };
})();
