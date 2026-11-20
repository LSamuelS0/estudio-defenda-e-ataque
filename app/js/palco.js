/*
 * Palco: toca uma animação (lista de quadros em canvas) com fundo, casca de cebola, pivô,
 * ponto de destaque e landmarks arrastáveis. Usado em Visualização, Edição e na Linha de produção.
 */
window.Palco = class Palco {
  constructor(canvas, op = {}) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.quadros = []; this.k = 0; this.fps = op.fps || 10; this.tocando = true; this.zoom = op.zoom || 0;
    this.fundo = op.fundo || 'escuro'; this.cebola = false; this.mostrarPivo = true; this.mostrarPontos = true; this.silhueta = false; this.mostrarMalha = false; this.mostrarTrajetoria = false; this._silhuetas = new WeakMap();
    this.pivo = [0, 0]; this.pontos = null; this.landmarks = null; this.editavel = false; this.selecionado = null;
    this.aoMudarQuadro = null; this.aoMoverLandmark = null; this.ultimo = 0;
    this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
    new ResizeObserver(() => this.desenhar()).observe(canvas);
    this._eventos();
  }
  definir({ quadros, fps, pivo, pontos, landmarks }) {
    if (quadros) { this.quadros = quadros; this.k = Math.min(this.k, quadros.length - 1); }
    if (fps) this.fps = fps; if (pivo) this.pivo = pivo; if (pontos !== undefined) this.pontos = pontos; if (landmarks !== undefined) this.landmarks = landmarks;
    this.desenhar();
  }
  irPara(k) { if (!this.quadros.length) return; this.k = (k + this.quadros.length) % this.quadros.length; this.desenhar(); this.aoMudarQuadro && this.aoMudarQuadro(this.k); }
  _loop(t) {
    if (this.tocando && this.quadros.length > 1 && t - this.ultimo >= 1000 / this.fps) { this.ultimo = t; this.irPara(this.k + 1); }
    requestAnimationFrame(this._loop);
  }
  _escala() {
    const q = this.quadros[0]; if (!q) return 1;
    const W = this.c.clientWidth, H = this.c.clientHeight;
    return this.zoom || Math.max(0.25, Math.min(W / q.width, H / q.height) * 0.92);
  }
  _origem() { const q = this.quadros[0], e = this._escala(); return [(this.c.clientWidth - q.width * e) / 2, (this.c.clientHeight - q.height * e) / 2, e]; }
  desenhar() {
    const dpr = window.devicePixelRatio || 1; const W = this.c.clientWidth, H = this.c.clientHeight;
    if (this.c.width !== Math.round(W * dpr) || this.c.height !== Math.round(H * dpr)) { this.c.width = Math.round(W * dpr); this.c.height = Math.round(H * dpr); }
    const g = this.g; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fundos: escuro, grama do jogo, xadrez (para ver transparência), claro (para caçar franja branca)
    if (this.fundo === 'xadrez') { const s = 12; for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { g.fillStyle = ((x + y) / s) % 2 ? '#2b2f3a' : '#3a3f4c'; g.fillRect(x, y, s, s); } }
    else { g.fillStyle = { escuro: '#14161d', grama: '#4d6b3c', claro: '#e9e4d8' }[this.fundo] || '#14161d'; g.fillRect(0, 0, W, H); }
    const q = this.quadros[this.k]; if (!q) { g.fillStyle = '#7d7f8a'; g.font = '14px system-ui'; g.textAlign = 'center'; g.fillText('Sem animação', W / 2, H / 2); return; }
    const [ox, oy, e] = this._origem();
    // arte pintada (não é pixel art): sempre suavizar ao ampliar
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // sombra/linha do chão no pivô
    g.strokeStyle = 'rgba(201,169,110,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, oy + this.pivo[1] * e); g.lineTo(W, oy + this.pivo[1] * e); g.stroke();
    if (this.cebola && this.quadros.length > 2) {
      const ant = this.quadros[(this.k - 1 + this.quadros.length) % this.quadros.length], prox = this.quadros[(this.k + 1) % this.quadros.length];
      for (const [img, cor] of [[ant, 'rgba(255,80,80,1)'], [prox, 'rgba(80,220,120,1)']]) {
        const t = document.createElement('canvas'); t.width = img.width; t.height = img.height; const tg = t.getContext('2d');
        tg.drawImage(img, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = cor; tg.fillRect(0, 0, t.width, t.height);
        g.globalAlpha = 0.35; g.drawImage(t, ox, oy, img.width * e, img.height * e); g.globalAlpha = 1;
      }
    }
    if (this.mostrarTrajetoria && this.quadros.length > 1) {
      const centros = this.quadros.map(img => { const tmp=document.createElement('canvas'); tmp.width=img.width; tmp.height=img.height; const c=tmp.getContext('2d',{willReadFrequently:true}); c.drawImage(img,0,0); const dat=c.getImageData(0,0,img.width,img.height).data; let x0=img.width,y0=img.height,x1=0,y1=0,tem=false; for(let y=0;y<img.height;y+=2) for(let x=0;x<img.width;x+=2) if(dat[(y*img.width+x)*4+3]>20){tem=true;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)} return tem?[ox+(x0+x1)*e/2,oy+(y0+y1)*e/2]:null; });
      g.strokeStyle='rgba(201,169,110,.8)';g.lineWidth=1.5;g.beginPath();let iniciou=false;centros.forEach(pt=>{if(!pt)return;if(!iniciou){g.moveTo(pt[0],pt[1]);iniciou=true}else g.lineTo(pt[0],pt[1])});g.stroke();
    }
    if (this.silhueta) {
      let sil=this._silhuetas.get(q); if(!sil){sil=document.createElement('canvas');sil.width=q.width;sil.height=q.height;const sg=sil.getContext('2d');sg.drawImage(q,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#c9a96e';sg.fillRect(0,0,q.width,q.height);this._silhuetas.set(q,sil)}
      g.drawImage(sil,ox,oy,q.width*e,q.height*e);
    } else g.drawImage(q, ox, oy, q.width * e, q.height * e);
    if (this.mostrarPivo) {
      const px = ox + this.pivo[0] * e, py = oy + this.pivo[1] * e; g.strokeStyle = '#c9a96e'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(px - 8, py); g.lineTo(px + 8, py); g.moveTo(px, py - 8); g.lineTo(px, py + 8); g.stroke();
    }
    const pt = this.pontos && this.pontos[this.k];
    if (this.mostrarPontos && pt) { g.strokeStyle = '#7fc3ff'; g.beginPath(); g.arc(ox + (this.pivo[0] + pt[0]) * e, oy + (this.pivo[1] + pt[1]) * e, 6, 0, 7); g.stroke(); }
    const L = (this.mostrarMalha || this.editavel) && this.landmarks && this.landmarks[this.k];
    if (L) {
      const ligar = [['head_top', 'head_center'], ['head_center', 'neck_base'], ['neck_base', 'shoulder_left'], ['neck_base', 'shoulder_right'], ['neck_base', 'chest_center'], ['chest_center', 'waist_center'], ['waist_center', 'hip_center'], ['hip_center', 'knee_left'], ['hip_center', 'knee_right'], ['knee_left', 'foot_contact_left'], ['knee_right', 'foot_contact_right'], ['shoulder_right', 'hand_main']];
      g.strokeStyle = 'rgba(157,139,208,.7)'; g.lineWidth = 1.5; g.beginPath();
      for (const [a, b] of ligar) if (L[a] && L[b]) { g.moveTo(ox + L[a][0] * e, oy + L[a][1] * e); g.lineTo(ox + L[b][0] * e, oy + L[b][1] * e); }
      g.stroke();
      for (const nome in L) {
        const [x, y] = L[nome]; const sel = nome === this.selecionado;
        g.fillStyle = sel ? '#c9a96e' : (this.revisados && this.revisados.has(nome) ? '#8ebd87' : '#9d8bd0');
        g.beginPath(); g.arc(ox + x * e, oy + y * e, sel ? 6 : 4.5, 0, 7); g.fill(); g.strokeStyle = '#11131a'; g.lineWidth = 1.5; g.stroke();
      }
    }
  }
  _eventos() {
    const pos = ev => { const r = this.c.getBoundingClientRect(); const [ox, oy, e] = this._origem(); return [(ev.clientX - r.left - ox) / e, (ev.clientY - r.top - oy) / e, e]; };
    let arrastando = null;
    this.c.addEventListener('pointerdown', ev => {
      if (!this.editavel || !this.landmarks) return; const L = this.landmarks[this.k]; if (!L) return;
      const [x, y, e] = pos(ev); let melhor = null, d = 12 / e;
      for (const n in L) { const dd = Math.hypot(L[n][0] - x, L[n][1] - y); if (dd < d) { d = dd; melhor = n; } }
      if (melhor) { arrastando = melhor; this.selecionado = melhor; this.tocando = false; this.c.setPointerCapture(ev.pointerId); this.desenhar(); this.aoSelecionar && this.aoSelecionar(melhor); }
    });
    this.c.addEventListener('pointermove', ev => {
      if (!arrastando) return; const [x, y] = pos(ev); this.landmarks[this.k][arrastando] = [+x.toFixed(1), +y.toFixed(1)]; this.desenhar();
    });
    this.c.addEventListener('pointerup', () => { if (arrastando) { const n = arrastando; arrastando = null; this.aoMoverLandmark && this.aoMoverLandmark(this.k, n, this.landmarks[this.k][n]); } });
  }
};
