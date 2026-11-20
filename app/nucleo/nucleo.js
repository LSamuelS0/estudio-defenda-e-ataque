/*
 * Núcleo do Estúdio Defenda e Ataque — processamento de imagem sem dependências.
 * Roda igual no aplicativo (navegador/Electron) e na linha de comando (Node).
 *
 * Imagem de trabalho: { w, h, d: Float32Array(w*h*4) } com RGBA de 0 a 1 (alfa reto, não pré-multiplicado).
 * Máscara: Uint8Array(w*h) com 0/1.
 *
 * Regras seguidas (skill única skills/animacao-2d-pincel):
 *  - nenhum fundo branco, papel ou franja clara;
 *  - borda macia (sem serrilhado), redução com alfa pré-multiplicado;
 *  - âncora firme: quadros alinhados pelo pé (pivô) e pelo eixo da cabeça;
 *  - originais preservados: nada aqui altera a imagem de entrada.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.EstudioNucleo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSAO = '1.0.0';

  // ---------------------------------------------------------------- imagem básica
  function criar(w, h) { return { w, h, d: new Float32Array(w * h * 4) }; }
  function deBytes(w, h, bytes) {
    const im = criar(w, h);
    for (let i = 0; i < bytes.length; i++) im.d[i] = bytes[i] / 255;
    return im;
  }
  function paraBytes(im) {
    const b = new Uint8ClampedArray(im.w * im.h * 4);
    for (let i = 0; i < b.length; i++) b[i] = Math.round(im.d[i] * 255);
    return b;
  }
  function recortar(im, x0, y0, w, h) {
    const o = criar(w, h);
    for (let y = 0; y < h; y++) {
      const sy = y + y0; if (sy < 0 || sy >= im.h) continue;
      for (let x = 0; x < w; x++) {
        const sx = x + x0; if (sx < 0 || sx >= im.w) continue;
        const a = (sy * im.w + sx) * 4, b = (y * w + x) * 4;
        o.d[b] = im.d[a]; o.d[b + 1] = im.d[a + 1]; o.d[b + 2] = im.d[a + 2]; o.d[b + 3] = im.d[a + 3];
      }
    }
    return o;
  }
  // cola "src" sobre "dst" em (ox, oy) com mistura alfa (src por cima)
  function colar(dst, src, ox, oy) {
    for (let y = 0; y < src.h; y++) {
      const dy = y + oy; if (dy < 0 || dy >= dst.h) continue;
      for (let x = 0; x < src.w; x++) {
        const dx = x + ox; if (dx < 0 || dx >= dst.w) continue;
        const s = (y * src.w + x) * 4, t = (dy * dst.w + dx) * 4;
        const sa = src.d[s + 3]; if (sa <= 0) continue;
        const da = dst.d[t + 3], oa = sa + da * (1 - sa);
        for (let c = 0; c < 3; c++) dst.d[t + c] = (src.d[s + c] * sa + dst.d[t + c] * da * (1 - sa)) / oa;
        dst.d[t + 3] = oa;
      }
    }
  }
  function canalAlfa(im) { const a = new Float32Array(im.w * im.h); for (let i = 0; i < a.length; i++) a[i] = im.d[i * 4 + 3]; return a; }
  function hsv(im, i) {
    const r = im.d[i * 4], g = im.d[i * 4 + 1], b = im.d[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return { mx, mn, sat: (mx - mn) / Math.max(mx, 1e-3) };
  }

  // ---------------------------------------------------------------- máscaras
  // rótulos de componentes conexos (vizinhança 8 por padrão)
  function rotular(m, w, h, viz8 = true) {
    const lab = new Int32Array(w * h); const areas = [0]; const caixas = [null];
    const pilha = new Int32Array(w * h); let n = 0;
    for (let i = 0; i < w * h; i++) {
      if (!m[i] || lab[i]) continue;
      n++; let topo = 0; pilha[topo++] = i; lab[i] = n;
      let area = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      while (topo) {
        const p = pilha[--topo]; area++;
        const px = p % w, py = (p / w) | 0;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; if (!viz8 && dx && dy) continue;
          const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx; if (m[q] && !lab[q]) { lab[q] = n; pilha[topo++] = q; }
        }
      }
      areas.push(area); caixas.push({ x0, y0, x1, y1 });
    }
    return { lab, n, areas, caixas };
  }
  function rotulosNaBorda(lab, w, h) {
    const s = new Set();
    for (let x = 0; x < w; x++) { s.add(lab[x]); s.add(lab[(h - 1) * w + x]); }
    for (let y = 0; y < h; y++) { s.add(lab[y * w]); s.add(lab[y * w + w - 1]); }
    s.delete(0); return s;
  }
  // dilatação binária em cruz (4 vizinhos), "it" vezes
  function dilatar(m, w, h, it = 1) {
    let a = m;
    for (let k = 0; k < it; k++) {
      const b = new Uint8Array(a);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (a[i]) continue;
        if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) b[i] = 1;
      }
      a = b;
    }
    return a === m ? new Uint8Array(m) : a;
  }
  function erodir(m, w, h, it = 1) {
    const inv = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) inv[i] = m[i] ? 0 : 1;
    const d = dilatar(inv, w, h, it); for (let i = 0; i < d.length; i++) d[i] = d[i] ? 0 : 1; return d;
  }
  function fechar(m, w, h, it = 1) { return erodir(dilatar(m, w, h, it), w, h, it); }
  function preencherBuracos(m, w, h) {
    const inv = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) inv[i] = m[i] ? 0 : 1;
    const r = rotular(inv, w, h, false); const borda = rotulosNaBorda(r.lab, w, h);
    const o = new Uint8Array(m); for (let i = 0; i < o.length; i++) if (inv[i] && !borda.has(r.lab[i])) o[i] = 1;
    return o;
  }
  function maiorComponente(m, w, h) {
    const r = rotular(m, w, h); let best = 0;
    for (let k = 1; k <= r.n; k++) if (!best || r.areas[k] > r.areas[best]) best = k;
    const o = new Uint8Array(m.length); if (best) for (let i = 0; i < o.length; i++) o[i] = r.lab[i] === best ? 1 : 0;
    return o;
  }
  // desfoque gaussiano separável em um canal
  function gauss(arr, w, h, sigma) {
    const r = Math.max(1, Math.ceil(sigma * 3)); const k = []; let s = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); s += v; }
    for (let i = 0; i < k.length; i++) k[i] /= s;
    const t = new Float32Array(w * h), o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0; for (let j = -r; j <= r; j++) { const xx = Math.min(w - 1, Math.max(0, x + j)); v += arr[y * w + xx] * k[j + r]; }
      t[y * w + x] = v;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0; for (let j = -r; j <= r; j++) { const yy = Math.min(h - 1, Math.max(0, y + j)); v += t[yy * w + x] * k[j + r]; }
      o[y * w + x] = v;
    }
    return o;
  }
  // para cada pixel, índice do pixel "fonte" mais próximo (busca em largura a partir das fontes)
  function maisProximo(fonte, w, h) {
    const idx = new Int32Array(w * h).fill(-1); const fila = new Int32Array(w * h); let ini = 0, fim = 0;
    for (let i = 0; i < w * h; i++) if (fonte[i]) { idx[i] = i; fila[fim++] = i; }
    while (ini < fim) {
      const p = fila[ini++]; const x = p % w, y = (p / w) | 0;
      const viz = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of viz) if (q >= 0 && idx[q] < 0) { idx[q] = idx[p]; fila[fim++] = q; }
    }
    return idx;
  }

  // ---------------------------------------------------------------- 1. tirar o fundo
  function corDoFundo(im) {
    // mediana das bordas da imagem (papel branco, verde, cinza...)
    const rs = [], gs = [], bs = []; const add = i => { rs.push(im.d[i * 4]); gs.push(im.d[i * 4 + 1]); bs.push(im.d[i * 4 + 2]); };
    for (let x = 0; x < im.w; x += 2) { add(x); add((im.h - 1) * im.w + x); }
    for (let y = 0; y < im.h; y += 2) { add(y * im.w); add(y * im.w + im.w - 1); }
    const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
    return [med(rs), med(gs), med(bs)];
  }
  function temTransparencia(im) {
    let t = 0, n = 0;
    for (let x = 0; x < im.w; x += 3) { n += 2; if (im.d[x * 4 + 3] < 0.5) t++; if (im.d[((im.h - 1) * im.w + x) * 4 + 3] < 0.5) t++; }
    return t / n > 0.6;
  }

  /**
   * Remove o fundo (papel branco ou cor lisa) de uma folha desenhada.
   * - fundo = pixels parecidos com a cor da borda e ligados à borda;
   * - buracos fechados da cor do fundo também saem (papel entre perna e cajado),
   *   exceto olhos (anel escuro, pequenos) e brilhos coloridos (anel saturado);
   * - borda: o alfa vem da distância de cor ao fundo e a cor é "descontaminada" (sem franja clara);
   * - sombra no chão (cinza claro no pé) vira sombra escura translúcida.
   */
  function removerFundo(im, op = {}) {
    const w = im.w, h = im.h, N = w * h;
    const o = { tolerancia: 0.16, borda: 0.38, sombraChao: false, ...op };
    const out = criar(w, h); out.d.set(im.d);
    if (temTransparencia(im)) {
      // já vem recortada: só garante que pixel transparente não tenha cor de papel
      for (let i = 0; i < N; i++) if (out.d[i * 4 + 3] < 0.02) out.d[i * 4 + 3] = 0;
      return { imagem: out, fundo: corDoFundo(im), jaTransparente: true };
    }
    const bg = o.cor || corDoFundo(im);
    const dist = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const dr = im.d[i * 4] - bg[0], dg = im.d[i * 4 + 1] - bg[1], db = im.d[i * 4 + 2] - bg[2];
      dist[i] = Math.sqrt((dr * dr + dg * dg + db * db) / 3);
    }
    const parecido = new Uint8Array(N); for (let i = 0; i < N; i++) parecido[i] = dist[i] < o.tolerancia ? 1 : 0;
    const r = rotular(parecido, w, h, false); const borda = rotulosNaBorda(r.lab, w, h);
    const fundo = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (borda.has(r.lab[i])) fundo[i] = 1;
    // buracos fechados da cor do papel
    const bgClaro = Math.max(bg[0], bg[1], bg[2]) > 0.7;
    for (let k = 1; k <= r.n; k++) {
      if (borda.has(k) || r.areas[k] < 10) continue;
      const c = r.caixas[k]; const pad = 7;
      const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad), x1 = Math.min(w - 1, c.x1 + pad), y1 = Math.min(h - 1, c.y1 + pad);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1; const reg = new Uint8Array(bw * bh);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (r.lab[y * w + x] === k) reg[(y - y0) * bw + (x - x0)] = 1;
      const d3 = dilatar(reg, bw, bh, 6), d1 = dilatar(reg, bw, bh, 2);
      let n = 0, esc = 0, sat = 0;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const j = y * bw + x; if (!d3[j] || d1[j]) continue;
        const s = hsv(im, (y + y0) * w + x + x0); n++;
        if (s.mx < 0.32) esc++;
        if (s.sat > 0.35 && s.mx > 0.3) sat++;
      }
      if (!n) continue;
      const along = Math.max(c.x1 - c.x0 + 1, c.y1 - c.y0 + 1) / Math.max(1, Math.min(c.x1 - c.x0 + 1, c.y1 - c.y0 + 1));
      // olhos (e brilhos pequenos) ficam; frestas de papel fora da cabeça saem depois, em limparPapel
      const olho = esc / n > 0.35 && r.areas[k] < 900 && along < 4;
      const brilho = sat / n > 0.3;
      if (olho || brilho) continue;
      for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (r.lab[y * w + x] === k) fundo[y * w + x] = 1;
    }
    // caixa do desenho para achar a sombra no chão
    let ymax = 0, ymin = h; for (let i = 0; i < N; i++) if (!fundo[i]) { const y = (i / w) | 0; if (y > ymax) ymax = y; if (y < ymin) ymin = y; }
    const alturaFig = Math.max(1, ymax - ymin);
    const juntoFundo = dilatar(fundo, w, h, 1);
    for (let i = 0; i < N; i++) {
      const p = i * 4;
      if (fundo[i]) { out.d[p + 3] = 0; continue; }
      const s = hsv(im, i); const y = (i / w) | 0;
      // sombra do chão (cinza claro perto do pé): padrão é TIRAR — a sombra é desenhada pelo jogo
      if (bgClaro && s.sat < 0.12 && s.mx > 0.55 && s.mx < Math.max(bg[0], bg[1], bg[2]) - 0.03 && y > ymax - alturaFig * 0.16) {
        if (o.sombraChao !== true) { out.d[p + 3] = 0; continue; }
      }
      // miolo mais escuro da sombra (cinza sem cor bem no pé, abaixo das solas)
      if (o.sombraChao !== true && bgClaro && s.sat < 0.14 && s.mx > 0.38 && y > ymax - alturaFig * 0.12) { out.d[p + 3] = 0; continue; }
      if (false) {
        out.d[p] = 0.09; out.d[p + 1] = 0.08; out.d[p + 2] = 0.07;
        out.d[p + 3] = Math.min(0.45, Math.max(0.15, (0.95 - s.mx) * 1.4));
        continue;
      }
      if (juntoFundo[i]) {
        // descontamina a cor da borda: c = a*cor + (1-a)*fundo
        const a = Math.min(1, dist[i] / o.borda);
        if (a < 0.03) { out.d[p + 3] = 0; continue; }
        for (let c = 0; c < 3; c++) out.d[p + c] = Math.min(1, Math.max(0, (im.d[p + c] - (1 - a) * bg[c]) / a));
        out.d[p + 3] = a;
      } else out.d[p + 3] = 1;
    }
    return { imagem: out, fundo: bg, jaTransparente: false };
  }

  // ---------------------------------------------------------------- 2. separar quadros
  function faixasVazias(ocup, minVazio) {
    // trechos ocupados separados por pelo menos "minVazio" posições vazias
    const seg = []; let ini = -1, vazio = 0;
    for (let i = 0; i < ocup.length; i++) {
      if (ocup[i] > 0) { if (ini < 0) ini = i; vazio = 0; }
      else if (ini >= 0) { vazio++; if (vazio >= minVazio) { seg.push({ ini, fim: i - vazio }); ini = -1; vazio = 0; } }
    }
    if (ini >= 0) seg.push({ ini, fim: ocup.length - 1 - vazio });
    return seg;
  }
  /**
   * Separa uma folha em quadros. Linhas: por faixas horizontais vazias.
   * Colunas: por faixas verticais vazias; se os bonecos se encostam (cajado, manto),
   * acha as cabeças na faixa de cima e corta na coluna mais vazia entre duas cabeças.
   * Retorna [{x, y, w, h}] na ordem de leitura.
   */
  function separarQuadros(im, op = {}) {
    const w = im.w, h = im.h; const a = canalAlfa(im);
    const corpo = new Uint8Array(w * h); for (let i = 0; i < a.length; i++) corpo[i] = a[i] > 0.5 ? 1 : 0;
    const linhasOc = new Float32Array(h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) linhasOc[y] += corpo[y * w + x];
    let linhas = faixasVazias(linhasOc.map(v => (v > 2 ? v : 0)), Math.max(4, h * 0.02)).filter(s => s.fim - s.ini > h * 0.08);
    if (!linhas.length) linhas = [{ ini: 0, fim: h - 1 }];
    const quadros = [];
    const porLinha = op.quadrosPorLinha || 0;
    for (const L of linhas) {
      const y0 = L.ini, y1 = L.fim, lh = y1 - y0 + 1;
      const occ = new Float32Array(w);
      for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) occ[x] += corpo[y * w + x];
      let cols = faixasVazias(occ.map(v => (v > 1 ? v : 0)), Math.max(3, w * 0.006)).filter(s => s.fim - s.ini > 6);
      const larguras = cols.map(s => s.fim - s.ini).sort((p, q) => p - q);
      const largMed = larguras.length ? larguras[larguras.length >> 1] : w;
      const precisaCabecas = (porLinha && cols.length !== porLinha) || cols.some(s => s.fim - s.ini > largMed * 1.6);
      if (precisaCabecas) {
        // cabeças: faixa do topo (28% da altura do desenho)
        let topo = y1; for (let y = y0; y <= y1; y++) if (linhasOc[y] > 2) { topo = y; break; }
        let base = y0; for (let y = y1; y >= y0; y--) if (linhasOc[y] > 2) { base = y; break; }
        const banda = new Uint8Array(w); const yb = topo + Math.round((base - topo) * 0.28);
        for (let y = topo; y <= yb; y++) for (let x = 0; x < w; x++) if (corpo[y * w + x]) banda[x] = 1;
        // fecha buracos pequenos na faixa (fechamento 1D)
        const fech = new Uint8Array(banda); const R = 8;
        for (let x = 0; x < w; x++) if (!banda[x]) {
          let e = false, d = false; for (let k = 1; k <= R; k++) { if (x - k >= 0 && banda[x - k]) e = true; if (x + k < w && banda[x + k]) d = true; }
          if (e && d) fech[x] = 1;
        }
        let blobs = []; let ini = -1;
        for (let x = 0; x <= w; x++) {
          if (x < w && fech[x]) { if (ini < 0) ini = x; }
          else if (ini >= 0) { blobs.push({ c: (ini + x - 1) / 2, t: x - ini }); ini = -1; }
        }
        if (porLinha) blobs = blobs.sort((p, q) => q.t - p.t).slice(0, porLinha);
        else { const tm = blobs.map(b => b.t).sort((p, q) => p - q)[blobs.length >> 1] || 0; blobs = blobs.filter(b => b.t > tm * 0.35); }
        const cent = blobs.map(b => b.c).sort((p, q) => p - q);
        const pesoCorpo = new Float32Array(w);
        for (let x = 0; x < w; x++) pesoCorpo[x] = occ[x] * 4;
        const cortes = [0];
        for (let k = 0; k < cent.length - 1; k++) {
          const lo = Math.round(cent[k] + (cent[k + 1] - cent[k]) * 0.3), hi = Math.round(cent[k] + (cent[k + 1] - cent[k]) * 0.7);
          let m = lo; for (let x = lo; x <= hi; x++) if (pesoCorpo[x] < pesoCorpo[m]) m = x;
          cortes.push(m);
        }
        cortes.push(w - 1);
        cols = []; for (let k = 0; k < cortes.length - 1; k++) cols.push({ ini: cortes[k], fim: cortes[k + 1] });
      }
      for (const c of cols) quadros.push({ x: c.ini, y: y0, w: c.fim - c.ini + 1, h: lh });
    }
    return quadros;
  }

  // ---------------------------------------------------------------- 3. medidas de um quadro
  function corParecida(im, i, alvo, tol) {
    const r = im.d[i * 4], g = im.d[i * 4 + 1], b = im.d[i * 4 + 2];
    // compara matiz e saturação, não brilho (o cristal tem miolo claro e borda escura)
    const s = hsv(im, i); if (s.sat < 0.25 || s.mx < 0.3) return false;
    const n = Math.hypot(r, g, b) || 1, m = Math.hypot(alvo[0], alvo[1], alvo[2]) || 1;
    const cos = (r * alvo[0] + g * alvo[1] + b * alvo[2]) / (n * m);
    return cos > 1 - tol;
  }
  /**
   * Medidas para alinhar e animar: pé (y mais baixo do corpo), topo, eixo da cabeça (x médio da faixa de cima)
   * e o "ponto de destaque" (centro do maior pedaço da cor de destaque, ex.: cristal azul do cajado).
   */
  function medir(im, op = {}) {
    const w = im.w, h = im.h, N = w * h;
    const vis = new Uint8Array(N); for (let i = 0; i < N; i++) vis[i] = im.d[i * 4 + 3] > 0.5 ? 1 : 0;
    const corpo = maiorComponente(vis, w, h);
    let topo = h, pe = -1, x0 = w, x1 = -1, area = 0;
    for (let i = 0; i < N; i++) if (corpo[i]) { const y = (i / w) | 0, x = i % w; area++; if (y < topo) topo = y; if (y > pe) pe = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (pe < 0) return null;
    const alt = pe - topo;
    let sx = 0, n = 0; const yc = topo + alt * 0.2;
    for (let y = topo; y <= yc; y++) for (let x = 0; x < w; x++) if (corpo[y * w + x]) { sx += x; n++; }
    const cabecaX = n ? sx / n : (x0 + x1) / 2;
    // apoio: centro dos pixels da faixa mais baixa (4% da altura)
    let fx = 0, fn = 0; for (let y = Math.round(pe - alt * 0.04); y <= pe; y++) for (let x = 0; x < w; x++) if (corpo[y * w + x]) { fx += x; fn++; }
    const apoioX = fn ? fx / fn : cabecaX;
    let destaque = null;
    if (op.corDestaque) {
      const m = new Uint8Array(N); for (let i = 0; i < N; i++) if (im.d[i * 4 + 3] > 0.5 && corParecida(im, i, op.corDestaque, op.tolDestaque || 0.06)) m[i] = 1;
      const g = maiorComponente(fechar(m, w, h, 2), w, h);
      let gx = 0, gy = 0, gn = 0; for (let i = 0; i < N; i++) if (g[i] && m[i]) { gx += i % w; gy += (i / w) | 0; gn++; }
      if (gn > 6) destaque = [gx / gn, gy / gn];
    }
    return { topo, pe, alt, x0, x1, area, cabecaX, apoioX, destaque, corpo };
  }

  // ---------------------------------------------------------------- 4. redimensionar (Lanczos, alfa pré-multiplicado)
  function lanczos(x, a = 3) { if (x === 0) return 1; if (Math.abs(x) >= a) return 0; const px = Math.PI * x; return (a * Math.sin(px) * Math.sin(px / a)) / (px * px); }
  function redimensionar(im, nw, nh) {
    const pm = (src, w, h, nw2, horizontal) => {
      const dst = new Float32Array((horizontal ? nw2 * h : w * nw2) * 4);
      const n = horizontal ? w : h, nn = nw2, esc = n / nn, sup = Math.max(1, esc) * 3;
      for (let i = 0; i < nn; i++) {
        const c = (i + 0.5) * esc - 0.5; const ini = Math.floor(c - sup), fim = Math.ceil(c + sup);
        const pesos = []; let soma = 0;
        for (let j = ini; j <= fim; j++) { const p = lanczos((j - c) / Math.max(1, esc)); pesos.push(p); soma += p; }
        const outros = horizontal ? h : w;
        for (let o = 0; o < outros; o++) {
          let r = 0, g = 0, b = 0, a = 0;
          for (let j = ini, k = 0; j <= fim; j++, k++) {
            const jj = Math.min(n - 1, Math.max(0, j)); const p = pesos[k] / soma;
            const idx = (horizontal ? o * w + jj : jj * w + o) * 4;
            r += src[idx] * p; g += src[idx + 1] * p; b += src[idx + 2] * p; a += src[idx + 3] * p;
          }
          const t = (horizontal ? o * nn + i : i * w + o) * 4;
          dst[t] = r; dst[t + 1] = g; dst[t + 2] = b; dst[t + 3] = a;
        }
      }
      return dst;
    };
    const w = im.w, h = im.h; const pre = new Float32Array(im.d.length);
    for (let i = 0; i < w * h; i++) { const a = im.d[i * 4 + 3]; pre[i * 4] = im.d[i * 4] * a; pre[i * 4 + 1] = im.d[i * 4 + 1] * a; pre[i * 4 + 2] = im.d[i * 4 + 2] * a; pre[i * 4 + 3] = a; }
    const hz = pm(pre, w, h, nw, true); const vt = pm(hz, nw, h, nh, false);
    const out = criar(nw, nh);
    for (let i = 0; i < nw * nh; i++) {
      const a = Math.min(1, Math.max(0, vt[i * 4 + 3]));
      out.d[i * 4 + 3] = a < 0.004 ? 0 : a;
      for (let c = 0; c < 3; c++) out.d[i * 4 + c] = a > 0.004 ? Math.min(1, Math.max(0, vt[i * 4 + c] / a)) : 0;
    }
    return out;
  }

  // ---------------------------------------------------------------- 5. suavizar borda (porta de suavizar_bordas.py)
  function bordasDuras(im) {
    const w = im.w, h = im.h; let borda = 0, dura = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = im.d[i * 4 + 3]; if (a <= 8 / 255) continue;
      const tr = j => im.d[j * 4 + 3] <= 8 / 255;
      if ((x > 0 && tr(i - 1)) || (x < w - 1 && tr(i + 1)) || (y > 0 && tr(i - w)) || (y < h - 1 && tr(i + w)) || x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        borda++; if (a > 235 / 255) dura++;
      }
    }
    return borda ? dura / borda : 0;
  }
  function suavizar(im, sigma = 0.85) {
    const w = im.w, h = im.h, N = w * h; const a = canalAlfa(im);
    let max = 0; for (let i = 0; i < N; i++) if (a[i] > max) max = a[i];
    const out = criar(w, h); out.d.set(im.d); if (max <= 0) return out;
    const b = gauss(a, w, h, sigma);
    const transp = new Uint8Array(N); for (let i = 0; i < N; i++) transp[i] = a[i] < 0.05 ? 1 : 0;
    const vizT = dilatar(transp, w, h, 1);
    const duro = new Uint8Array(N); for (let i = 0; i < N; i++) duro[i] = a[i] > 0.9 && vizT[i] ? 1 : 0;
    const zona = dilatar(duro, w, h, 2);
    const fonte = new Uint8Array(N); for (let i = 0; i < N; i++) fonte[i] = a[i] >= 0.5 ? 1 : 0;
    const prox = maisProximo(fonte, w, h);
    for (let i = 0; i < N; i++) {
      if (!zona[i] || !(a[i] > 0.9 || a[i] < 0.05)) continue;
      let v = Math.min(1, Math.max(0, (b[i] - 0.18) / 0.64)); v = v * v * (3 - 2 * v);
      if (v > a[i] + 0.02 && prox[i] >= 0) for (let c = 0; c < 3; c++) out.d[i * 4 + c] = im.d[prox[i] * 4 + c];
      out.d[i * 4 + 3] = v;
    }
    return out;
  }

  // ---------------------------------------------------------------- 5b. franja clara na borda
  /**
   * Arte com contorno de tinta não tem pixel claro e sem cor na borda: isso é papel misturado.
   * Na faixa de 2 px junto ao transparente, pixel claro e cinza recebe a cor do miolo mais perto
   * (ou some, se for só papel). Brilhos coloridos (cristal) ficam.
   */
  function limparFranja(im, op = {}) {
    const w = im.w, h = im.h, N = w * h; const out = criar(w, h); out.d.set(im.d);
    const transp = new Uint8Array(N); for (let i = 0; i < N; i++) transp[i] = im.d[i * 4 + 3] < 0.05 ? 1 : 0;
    const faixa = dilatar(transp, w, h, op.largura || 2);
    const miolo = new Uint8Array(N); const longe = dilatar(transp, w, h, (op.largura || 2) + 1);
    for (let i = 0; i < N; i++) if (!longe[i] && im.d[i * 4 + 3] > 0.9) miolo[i] = 1;
    const prox = maisProximo(miolo, w, h);
    for (let i = 0; i < N; i++) {
      if (transp[i] || !faixa[i]) continue; const s = hsv(im, i);
      if (s.mx < 0.55 || s.sat > 0.18) continue;
      const j = prox[i];
      if (j < 0 || Math.hypot((j % w) - (i % w), ((j / w) | 0) - ((i / w) | 0)) > 6) { out.d[i * 4 + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) out.d[i * 4 + c] = im.d[j * 4 + c];
      // borda clara e semitransparente era só papel: fica mais transparente
      if (im.d[i * 4 + 3] < 0.9) out.d[i * 4 + 3] = im.d[i * 4 + 3] * 0.6;
    }
    return out;
  }

  // ---------------------------------------------------------------- 6. tirar resto de papel e franja depois do recorte
  function limparPapel(im, med, op = {}) {
    const w = im.w, h = im.h, N = w * h; const out = criar(w, h); out.d.set(im.d);
    // mantém o corpo principal, a sombra e o que encosta nele (cajado, cristal)
    const vis = new Uint8Array(N); for (let i = 0; i < N; i++) vis[i] = im.d[i * 4 + 3] > 0.05 ? 1 : 0;
    const r = rotular(vis, w, h); const perto = dilatar(med.corpo, w, h, 3); const manter = new Set();
    for (let i = 0; i < N; i++) if (perto[i] && r.lab[i]) manter.add(r.lab[i]);
    // a sombra no chão (escura translúcida) fica, se estiver perto do pé
    // (a sombra no chão não é mais guardada: o jogo desenha a sombra. Só fica se pedirem sombraChao)
    if (op.sombraChao) for (let k = 1; k <= r.n; k++) { const c = r.caixas[k]; if (c.y0 > med.pe - med.alt * 0.12 && c.y1 < med.pe + med.alt * 0.12) manter.add(k); }
    for (let i = 0; i < N; i++) if (!manter.has(r.lab[i])) out.d[i * 4 + 3] = 0;
    // brancos de papel encostados no fundo (fora da cabeça) saem; olhos dentro do capuz ficam
    const transp = new Uint8Array(N); for (let i = 0; i < N; i++) transp[i] = out.d[i * 4 + 3] < 0.05 ? 1 : 0;
    const rt = rotular(transp, w, h, false); const bb = rotulosNaBorda(rt.lab, w, h);
    const fora = new Uint8Array(N); for (let i = 0; i < N; i++) fora[i] = bb.has(rt.lab[i]) ? 1 : 0;
    const perFora = dilatar(fora, w, h, 2);
    const yCab = med.topo + med.alt * 0.3;
    for (let i = 0; i < N; i++) {
      if (out.d[i * 4 + 3] < 0.05) continue; const s = hsv(out, i); const y = (i / w) | 0;
      if (s.mx > 0.82 && s.sat < 0.12 && perFora[i] && y > yCab) out.d[i * 4 + 3] = 0;
    }
    // frestas de papel presas entre cajado e manto: manchas quase brancas fora da cabeça.
    // Ficam só as que são "miolo de brilho": a borda em volta é colorida (o cristal azul), não tinta escura.
    const cor = new Uint8Array(N), claro = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (out.d[i * 4 + 3] < 0.05) continue; const s = hsv(out, i);
      if (s.sat > 0.3 && s.mx > 0.35) cor[i] = 1;
      if (s.mx > 0.78 && s.sat < 0.12) claro[i] = 1;
    }
    const rc = rotular(claro, w, h);
    const tirar = new Uint8Array(N);
    for (let k = 1; k <= rc.n; k++) {
      if (rc.areas[k] < (op.minFresta || 3)) continue;
      const c = rc.caixas[k]; const x0 = Math.max(0, c.x0 - 3), y0 = Math.max(0, c.y0 - 3), x1 = Math.min(w - 1, c.x1 + 3), y1 = Math.min(h - 1, c.y1 + 3);
      let n = 0, colorido = 0, escuro = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const q = y * w + x; if (rc.lab[q] === k || out.d[q * 4 + 3] < 0.05) continue;
        // só a vizinhança imediata (até 3 px) da mancha
        let perto = false; for (let dy = -3; dy <= 3 && !perto; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < h && xx < w && rc.lab[yy * w + xx] === k) { perto = true; break; } }
        if (!perto) continue; n++; if (cor[q]) colorido++; if (Math.max(out.d[q * 4], out.d[q * 4 + 1], out.d[q * 4 + 2]) < 0.25) escuro++;
      }
      if (op.depurar) op.depurar.push({ k, area: rc.areas[k], yrel: +((c.y0 - med.topo) / med.alt).toFixed(2), cor: +(colorido / n).toFixed(2), esc: +(escuro / n).toFixed(2), x: c.x0, y: c.y0 });
      const yrel = (c.y0 - med.topo) / med.alt, limiteArea = 0.0028 * med.alt * med.alt;
      const larg = c.x1 - c.x0 + 1, alt = c.y1 - c.y0 + 1, alongado = Math.max(larg, alt) / Math.max(1, Math.min(larg, alt));
      const cf = n ? colorido / n : 0;
      // miolo de brilho (cristal): cercado de cor, ou bem no alto com alguma cor em volta
      if ((cf > 0.45 || (cf > 0.25 && yrel < 0.15)) && rc.areas[k] < limiteArea) continue;
      // olho: pequeno, pouco alongado, na faixa do rosto
      if (yrel > 0.08 && yrel < 0.34 && rc.areas[k] < limiteArea && alongado < 2.8 && cf < 0.2) continue;
      for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (rc.lab[y * w + x] === k) tirar[y * w + x] = 1;
    }
    // a franja clara em volta da fresta (mistura de papel com tinta) sai junto
    const volta = dilatar(tirar, w, h, 2);
    for (let i = 0; i < N; i++) {
      if (tirar[i]) { out.d[i * 4 + 3] = 0; continue; }
      if (volta[i] && !cor[i]) { const s = hsv(out, i); if (s.mx > 0.55 && s.sat < 0.16) out.d[i * 4 + 3] = 0; }
    }
    return out;
  }

  // ---------------------------------------------------------------- 7. montar folha alinhada
  /**
   * Monta uma folha de animação a partir de vários quadros já recortados.
   * op: { alturaCorpo (px do topo ao pé na folha), largura, altura (do quadro; auto se ausente),
   *       alinharX: 'cabeca' | 'apoio' | 'centro', corDestaque, margem }
   */
  function montarFolha(quadros, op = {}) {
    const o = { alturaCorpo: 240, alinharX: 'cabeca', margem: 14, suavizar: true, ...op };
    const meds = quadros.map(q => medir(q, o));
    const alts = meds.filter(Boolean).map(m => m.alt).sort((p, q) => p - q);
    const esc = o.escala || o.alturaCorpo / alts[alts.length >> 1];
    const reduzidos = quadros.map((q, k) => {
      const lim = limparPapel(q, meds[k], o);
      const nw = Math.max(1, Math.round(q.w * esc)), nh = Math.max(1, Math.round(q.h * esc));
      return redimensionar(lim, nw, nh);
    });
    // tamanho do quadro: cabe o maior desenho centrado no eixo e apoiado no pé
    const ref = k => { const m = meds[k]; return o.alinharX === 'apoio' ? m.apoioX : o.alinharX === 'centro' ? (m.x0 + m.x1) / 2 : m.cabecaX; };
    let esq = 0, dir = 0, cima = 0, baixo = 0;
    reduzidos.forEach((r, k) => {
      const m = meds[k]; const rx = ref(k) * esc, py = m.pe * esc;
      let x0 = r.w, x1 = 0, y0 = r.h, y1 = 0;
      for (let i = 0; i < r.w * r.h; i++) if (r.d[i * 4 + 3] > 0.01) { const x = i % r.w, y = (i / r.w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      esq = Math.max(esq, rx - x0); dir = Math.max(dir, x1 - rx); cima = Math.max(cima, py - y0); baixo = Math.max(baixo, y1 - py);
    });
    const meia = Math.ceil(Math.max(esq, dir) + o.margem);
    const W = o.largura || meia * 2; const H = o.altura || Math.ceil(cima + baixo + o.margem * 2);
    const PX = o.pivo ? o.pivo[0] : Math.round(W / 2), PY = o.pivo ? o.pivo[1] : Math.round(H - baixo - o.margem);
    const folha = criar(W * quadros.length, H); const pontos = []; const finais = [];
    reduzidos.forEach((r, k) => {
      const m = meds[k]; const ox = Math.round(PX - ref(k) * esc), oy = Math.round(PY - m.pe * esc);
      let q = criar(W, H); colar(q, r, ox, oy);
      if (o.suavizar) q = suavizar(limparFranja(q));
      finais.push(q); colar(folha, q, k * W, 0);
      pontos.push(m.destaque ? [+(m.destaque[0] * esc + ox - PX).toFixed(1), +(m.destaque[1] * esc + oy - PY).toFixed(1)] : null);
    });
    return { folha, quadros: finais, largura: W, altura: H, pivo: [PX, PY], escala: esc, pontos, medidas: meds.map(m => m && { alt: m.alt, cabecaX: m.cabecaX, pe: m.pe }) };
  }

  // ---------------------------------------------------------------- 8. idle (respiração) a partir de um quadro
  function amostrar(im, x, y, c) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; let v = 0;
    for (const [dx, dy, p] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
      const xx = x0 + dx, yy = y0 + dy; if (xx < 0 || yy < 0 || xx >= im.w || yy >= im.h) continue;
      v += im.d[(yy * im.w + xx) * 4 + c] * p;
    }
    return v;
  }
  function amostrarRGBA(im, x, y) {
    // bilinear com alfa pré-multiplicado (sem franja escura)
    const a = amostrar(im, x, y, 3); if (a < 0.002) return [0, 0, 0, 0];
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; const rgb = [0, 0, 0];
    for (const [dx, dy, p] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
      const xx = x0 + dx, yy = y0 + dy; if (xx < 0 || yy < 0 || xx >= im.w || yy >= im.h) continue;
      const i = (yy * im.w + xx) * 4, al = im.d[i + 3] * p; rgb[0] += im.d[i] * al; rgb[1] += im.d[i + 1] * al; rgb[2] += im.d[i + 2] * al;
    }
    return [rgb[0] / a, rgb[1] / a, rgb[2] / a, a];
  }
  /**
   * Idle de respiração em loop perfeito: pé fixo; peito e ombros sobem com entrada/saída lentas;
   * capuz/cabeça atrasa (continuação); barra da roupa balança atrasada; ponto de destaque pulsa um brilho.
   */
  function gerarIdle(base, op = {}) {
    const o = { quadros: 12, duracao: 2.2, subida: 3, alargar: 0.012, balanco: 0.9, brilho: [0.47, 0.75, 1], ...op };
    const W = base.w, H = base.h; const [PX, PY] = o.pivo;
    let topo = H; for (let i = 0; i < W * H; i++) if (base.d[i * 4 + 3] > 0.16) { topo = Math.min(topo, (i / W) | 0); }
    const pe = PY, tam = Math.max(1, pe - topo);
    const out = criar(W * o.quadros, H); const pontos = []; const quadros = [];
    for (let k = 0; k < o.quadros; k++) {
      const wv = (2 * Math.PI * k) / o.quadros;
      const resp = (1 - Math.cos(wv)) / 2, atras = (1 - Math.cos(wv - 0.7)) / 2;
      const q = criar(W, H);
      for (let y = 0; y < H; y++) {
        const hh = Math.min(1, Math.max(0, (pe - y) / tam));
        const sobe = o.subida * resp * Math.pow(Math.min(1, Math.max(0, (hh - 0.08) / 0.5)), 1.2) + o.subida * 0.4 * atras * Math.min(1, Math.max(0, (hh - 0.72) / 0.28));
        const larg = 1 + o.alargar * resp * Math.exp(-(((hh - 0.62) / 0.12) ** 2));
        const barra = o.balanco * Math.sin(wv - 1.1) * Math.min(1, Math.max(0, (0.28 - hh) / 0.2)) * (hh > 0.06 ? 1 : 0);
        for (let x = 0; x < W; x++) {
          const v = amostrarRGBA(base, PX + (x - PX) / larg - barra, y + sobe); const i = (y * W + x) * 4;
          q.d[i] = v[0]; q.d[i + 1] = v[1]; q.d[i + 2] = v[2]; q.d[i + 3] = v[3];
        }
      }
      const pt = o.pontos ? o.pontos : null;
      if (pt) {
        const tx = PX + pt[0], ty = PY + pt[1] - o.subida * resp; const raio = 7 + 2 * resp, forca = 0.25 + 0.2 * resp;
        for (let y = Math.max(0, Math.floor(ty - raio * 3)); y < Math.min(H, ty + raio * 3); y++) for (let x = Math.max(0, Math.floor(tx - raio * 3)); x < Math.min(W, tx + raio * 3); x++) {
          const g = Math.exp(-(((x - tx) ** 2 + (y - ty) ** 2) / (2 * raio * raio))) * forca; const i = (y * W + x) * 4;
          if (q.d[i + 3] < 0.04) { q.d[i] = o.brilho[0]; q.d[i + 1] = o.brilho[1]; q.d[i + 2] = o.brilho[2]; q.d[i + 3] = Math.max(q.d[i + 3], g * 0.55); }
          else for (let c = 0; c < 3; c++) q.d[i + c] = Math.min(1, q.d[i + c] + g * o.brilho[c] * q.d[i + 3]);
        }
        pontos.push([+pt[0].toFixed(1), +(pt[1] - o.subida * resp).toFixed(1)]);
      } else pontos.push(null);
      quadros.push(q); colar(out, q, k * W, 0);
    }
    return { folha: out, quadros, fps: +(o.quadros / o.duracao).toFixed(3), duracao: o.duracao, pontos };
  }
  // quadro "de pé": o de pés mais juntos (menor largura na faixa de baixo)
  function quadroMaisNeutro(quadros) {
    let best = 0, bw = Infinity;
    quadros.forEach((q, k) => {
      const m = medir(q); if (!m) return; let x0 = q.w, x1 = 0;
      for (let y = Math.round(m.pe - m.alt * 0.1); y <= m.pe; y++) for (let x = 0; x < q.w; x++) if (m.corpo[y * q.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      if (x1 - x0 < bw) { bw = x1 - x0; best = k; }
    });
    return best;
  }

  // ---------------------------------------------------------------- 8b. mais quadros: intervalos por fluxo óptico
  // Para cada par de quadros desenhados, estima para onde cada pedaço do desenho andou (fluxo, do grosso para o fino)
  // e cria quadros intermediários deformando os dois desenhos até o meio do caminho e misturando.
  // Não é um desenho novo: é um "intervalo" automático. Funciona bem em passos pequenos; poses muito diferentes pedem quadro desenhado.
  function _cinza(im, f) {
    const w = Math.max(1, Math.round(im.w / f)), h = Math.max(1, Math.round(im.h / f)); const r = redimensionar(im, w, h); const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const a = r.d[i * 4 + 3]; g[i] = (0.3 * r.d[i * 4] + 0.59 * r.d[i * 4 + 1] + 0.11 * r.d[i * 4 + 2]) * a * 0.6 + a * 0.4; }
    return { w, h, g };
  }
  function fluxo(A, B, op = {}) {
    const niveis = op.niveis || [8, 4, 2, 1]; let fx = null, fy = null, pw = 0, ph = 0;
    for (const f of niveis) {
      const a = _cinza(A, f), b = _cinza(B, f); const w = a.w, h = a.h;
      const nx = new Float32Array(w * h), ny = new Float32Array(w * h);
      if (fx) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.min(pw - 1, Math.floor(x * pw / w)), sy = Math.min(ph - 1, Math.floor(y * ph / h)); nx[y * w + x] = fx[sy * pw + sx] * w / pw; ny[y * w + x] = fy[sy * pw + sx] * h / ph; }
      const R = op.raio || 3, P = 2; const ox = new Float32Array(w * h), oy = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; const bx = Math.round(nx[i]), by = Math.round(ny[i]);
        // pixels vazios nos dois quadros não precisam de fluxo
        let tem = 0; for (let dy = -P; dy <= P; dy++) for (let dx = -P; dx <= P; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < h && xx < w) tem += a.g[yy * w + xx]; }
        if (tem < 0.05) { ox[i] = nx[i]; oy[i] = ny[i]; continue; }
        let melhor = Infinity, mx = bx, my = by;
        for (let sy = -R; sy <= R; sy++) for (let sx = -R; sx <= R; sx++) {
          const ux = bx + sx, uy = by + sy; let sad = 0;
          for (let dy = -P; dy <= P; dy++) for (let dx = -P; dx <= P; dx++) {
            const ya = y + dy, xa = x + dx; if (ya < 0 || xa < 0 || ya >= h || xa >= w) continue;
            const yb = ya + uy, xb = xa + ux; const vb = (yb < 0 || xb < 0 || yb >= h || xb >= w) ? 0 : b.g[yb * w + xb];
            sad += Math.abs(a.g[ya * w + xa] - vb);
          }
          sad += 0.002 * (sx * sx + sy * sy); // prefere o caminho mais curto (suave)
          if (sad < melhor) { melhor = sad; mx = ux; my = uy; }
        }
        ox[i] = mx; oy[i] = my;
      }
      fx = gauss(ox, w, h, 1.2); fy = gauss(oy, w, h, 1.2); pw = w; ph = h;
    }
    // sobe o fluxo para a resolução cheia
    const W = A.w, H = A.h; const FX = new Float32Array(W * H), FY = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gx = Math.min(pw - 1.001, Math.max(0, (x + 0.5) * pw / W - 0.5)), gy = Math.min(ph - 1.001, Math.max(0, (y + 0.5) * ph / H - 0.5));
      const x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0; const k = (xx, yy) => yy * pw + xx;
      const bil = F => (F[k(x0, y0)] * (1 - tx) + F[k(x0 + 1, y0)] * tx) * (1 - ty) + (F[k(x0, y0 + 1)] * (1 - tx) + F[k(x0 + 1, y0 + 1)] * tx) * ty;
      FX[y * W + x] = bil(fx) * W / pw; FY[y * W + x] = bil(fy) * H / ph;
    }
    return { fx: FX, fy: FY };
  }
  function intervalo(A, B, fAB, fBA, t) {
    const W = A.w, H = A.h; const out = criar(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = amostrarRGBA(A, x - t * fAB.fx[i], y - t * fAB.fy[i]);
      const b = amostrarRGBA(B, x - (1 - t) * fBA.fx[i], y - (1 - t) * fBA.fy[i]);
      // mistura puxada para o desenho mais perto no tempo: menos "fantasma" duplo nos intervalos
      let wb = t * t / (t * t + (1 - t) * (1 - t));
      // onde os dois desenhos discordam (perna que some atrás da outra, cajado que cruza), não mistura:
      // usa só o desenho mais perto no tempo, para não aparecer contorno duplo
      const dif = Math.abs(a[3] - b[3]) + (a[3] > 0.3 && b[3] > 0.3 ? (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3 : 0);
      if (dif > 0.35) wb = t <= 0.5 ? 0 : 1;
      const wa = 1 - wb;
      const al = a[3] * wa + b[3] * wb; const o = i * 4;
      if (al < 0.004) continue;
      for (let c = 0; c < 3; c++) out.d[o + c] = (a[c] * a[3] * wa + b[c] * b[3] * wb) / al;
      out.d[o + 3] = al;
    }
    return out;
  }
  /** Multiplica os quadros de um ciclo em loop: fator 2 -> 6 vira 12; fator 4 -> 24; fator 5 -> 30. */
  function interpolarCiclo(quadros, fator, op = {}) {
    if (fator <= 1) return quadros.slice();
    const n = quadros.length; const out = [];
    for (let k = 0; k < n; k++) {
      const A = quadros[k], B = quadros[(k + 1) % n]; out.push(A);
      if (op.loop === false && k === n - 1) break;
      const fAB = fluxo(A, B, op), fBA = fluxo(B, A, op);
      for (let j = 1; j < fator; j++) out.push(suavizar(intervalo(A, B, fAB, fBA, j / fator)));
    }
    return out;
  }

  // ---------------------------------------------------------------- 9. conferência pelas regras das skills
  function conferir(quadros, op = {}) {
    const o = { tipo: 'personagem', ...op };
    const W = quadros[0].w; const res = [];
    // serrilhado
    const serr = quadros.map(bordasDuras); const sm = serr.reduce((a, b) => a + b, 0) / serr.length;
    res.push({ id: 'serrilhado', nome: 'Sem serrilhado', valor: sm, meta: '< 25% de borda dura', ok: sm < 0.25, texto: (sm * 100).toFixed(1) + '% de borda dura' });
    // firmeza: apoio (pé) não desliza
    const meds = quadros.map(q => medir(q));
    if (o.tipo === 'personagem' && meds.every(Boolean)) {
      const ys = meds.map(m => m.pe), xs = meds.map(m => m.apoioX);
      const dy = Math.max(...ys) - Math.min(...ys);
      const der = dy / W;
      res.push({ id: 'firmeza', nome: 'Firme no lugar (pé)', valor: der, meta: '< 2% da largura', ok: der < 0.02, texto: 'pé varia ' + dy + ' px (' + (der * 100).toFixed(1) + '%)' });
      void xs;
    }
    // emenda do loop e ritmo
    if (quadros.length > 2) {
      const dif = (p, q) => { let s = 0; for (let i = 0; i < p.w * p.h; i++) s += Math.abs(p.d[i * 4 + 3] - q.d[i * 4 + 3]); return s / (p.w * p.h); };
      const saltos = []; for (let k = 0; k < quadros.length - 1; k++) saltos.push(dif(quadros[k], quadros[k + 1]));
      const media = saltos.reduce((a, b) => a + b, 0) / saltos.length; const emenda = dif(quadros[quadros.length - 1], quadros[0]);
      const r = media > 0 ? emenda / media : 0;
      res.push({ id: 'emenda', nome: 'Loop sem emenda', valor: r, meta: '≤ 1,6× o salto médio', ok: r <= 1.6, texto: r.toFixed(2) + '× o salto médio' });
      const mov = saltos.concat([emenda]); const mx = Math.max(...mov), mn = Math.min(...mov);
      res.push({ id: 'movimento', nome: 'Sempre em movimento', valor: mn, meta: 'nenhum quadro repetido', ok: mn > 1e-4, texto: mn > 1e-4 ? 'todos os quadros mudam' : 'há quadros iguais (parece congelado)' });
      // tranco = pico ISOLADO: um salto muito maior que os dois vizinhos (aceleração/desaceleração suave não conta)
      const ordenados = mov.slice().sort((a, b) => a - b); const med = ordenados[ordenados.length >> 1] || 1e-9;
      let pior = 0; const n = mov.length;
      for (let k = 0; k < n; k++) { const viz = (mov[(k - 1 + n) % n] + mov[(k + 1) % n]) / 2; if (mov[k] > med) pior = Math.max(pior, mov[k] / Math.max(viz, med * 0.25, 1e-9)); }
      res.push({ id: 'ritmo', nome: 'Ritmo sem tranco', valor: pior, meta: 'nenhum salto ≥ 2,5× os vizinhos', ok: pior < 2.5, texto: 'maior pico ' + pior.toFixed(2) + '× os vizinhos' + (mx / med > 3 ? ' (variação suave de velocidade ok)' : '') });
    }
    // fundo branco: branco opaco encostado no transparente, e buracos brancos grandes
    let franja = 0, borda = 0, buracos = 0;
    for (const q of quadros) {
      const N = q.w * q.h; const tr = new Uint8Array(N); for (let i = 0; i < N; i++) tr[i] = q.d[i * 4 + 3] < 0.05 ? 1 : 0;
      const vz = dilatar(tr, q.w, q.h, 1);
      const br = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        if (tr[i]) continue; const s = hsv(q, i); const branco = s.mx > 0.88 && s.sat < 0.08 && q.d[i * 4 + 3] > 0.6;
        if (vz[i]) { borda++; if (branco) franja++; }
        br[i] = branco ? 1 : 0;
      }
      const r = rotular(br, q.w, q.h); for (let k = 1; k <= r.n; k++) if (r.areas[k] > 400) buracos++;
    }
    const fr = borda ? franja / borda : 0;
    res.push({ id: 'fundo', nome: 'Nenhum fundo branco', valor: fr, meta: 'franja < 2% e sem manchas brancas grandes', ok: fr < 0.02 && buracos === 0, texto: (fr * 100).toFixed(1) + '% de franja clara' + (buracos ? ', ' + buracos + ' mancha(s) branca(s)' : '') });
    // volume: área do desenho estável
    const areas = quadros.map(q => { let s = 0; for (let i = 0; i < q.w * q.h; i++) s += q.d[i * 4 + 3]; return s; });
    const am = areas.reduce((a, b) => a + b, 0) / areas.length; const pulso = am ? (Math.max(...areas) - Math.min(...areas)) / am : 0;
    const lim = o.tipo === 'personagem' ? 0.15 : 0.45;
    res.push({ id: 'volume', nome: 'Volume estável', valor: pulso, meta: '< ' + lim * 100 + '% de variação de área', ok: pulso < lim, texto: (pulso * 100).toFixed(1) + '% de variação' });
    return res;
  }

  // ---------------------------------------------------------------- 10. rig: pontos do corpo propostos automaticamente
  // pontos do mapa anatômico (docs/referencias/mago): cabeça, pescoço, ombros, cotovelos, punhos, tronco, cintura, quadril, joelhos, tornozelos, pés
  const LANDMARKS = ['head_top', 'head_center', 'neck_base', 'shoulder_left', 'shoulder_right', 'elbow_left', 'elbow_right', 'wrist_left', 'wrist_right', 'chest_center', 'waist_center', 'hip_center', 'hand_main', 'knee_left', 'knee_right', 'ankle_left', 'ankle_right', 'foot_contact_left', 'foot_contact_right'];
  // hierarquia (Raiz -> Cabeça / Tronco / Quadril), como na prancha de rigging
  const HIERARQUIA = [
    { id: 'root', nome: 'Raiz', pai: null }, { id: 'hip_center', nome: 'Quadril', pai: 'root' }, { id: 'waist_center', nome: 'Cintura', pai: 'hip_center' },
    { id: 'chest_center', nome: 'Tronco', pai: 'waist_center' }, { id: 'neck_base', nome: 'Pescoço', pai: 'chest_center' }, { id: 'head_center', nome: 'Cabeça', pai: 'neck_base' },
    { id: 'head_top', nome: 'Topo da cabeça', pai: 'head_center' },
    { id: 'shoulder_left', nome: 'Ombro esq.', pai: 'chest_center' }, { id: 'elbow_left', nome: 'Cotovelo esq.', pai: 'shoulder_left' }, { id: 'wrist_left', nome: 'Punho esq.', pai: 'elbow_left' },
    { id: 'shoulder_right', nome: 'Ombro dir.', pai: 'chest_center' }, { id: 'elbow_right', nome: 'Cotovelo dir.', pai: 'shoulder_right' }, { id: 'wrist_right', nome: 'Punho dir.', pai: 'elbow_right' },
    { id: 'hand_main', nome: 'Mão da arma', pai: 'wrist_right' },
    { id: 'knee_left', nome: 'Joelho esq.', pai: 'hip_center' }, { id: 'ankle_left', nome: 'Tornozelo esq.', pai: 'knee_left' }, { id: 'foot_contact_left', nome: 'Pé esq.', pai: 'ankle_left' },
    { id: 'knee_right', nome: 'Joelho dir.', pai: 'hip_center' }, { id: 'ankle_right', nome: 'Tornozelo dir.', pai: 'knee_right' }, { id: 'foot_contact_right', nome: 'Pé dir.', pai: 'ankle_right' },
  ];
  const NOMES_LANDMARK = {
    head_top: 'Topo da cabeça', head_center: 'Centro da cabeça', neck_base: 'Base do pescoço', shoulder_left: 'Ombro esquerdo',
    shoulder_right: 'Ombro direito', chest_center: 'Centro do peito', waist_center: 'Cintura', hip_center: 'Quadril',
    elbow_left: 'Cotovelo esquerdo', elbow_right: 'Cotovelo direito', wrist_left: 'Punho esquerdo', wrist_right: 'Punho direito',
    ankle_left: 'Tornozelo esquerdo', ankle_right: 'Tornozelo direito',
    hand_main: 'Mão do cajado/arma', knee_left: 'Joelho esquerdo', knee_right: 'Joelho direito',
    foot_contact_left: 'Apoio do pé esquerdo', foot_contact_right: 'Apoio do pé direito',
  };
  /**
   * Proposta de landmarks a partir da silhueta (a pessoa revisa depois — skill de equipamentos, item 5.3).
   * Usa proporções do herói (cabeça grande) e a largura real da silhueta em cada altura.
   */
  // ---------------------------------------------------------------- 10b. rig girado a partir da frente
  // O rig é um só: o da frente. Costas e laterais saem dele girando o corpo em torno do eixo vertical
  // e encaixando na silhueta da vista. Depois a pessoa faz o pente-fino.
  // Profundidade de cada ponto (fração da altura do corpo; + = para a frente do personagem).
  const PROFUNDIDADE = {
    head_top: 0, head_center: 0.015, neck_base: 0, shoulder_left: -0.01, shoulder_right: -0.01,
    elbow_left: -0.015, elbow_right: -0.015, wrist_left: 0.005, wrist_right: 0.005, hand_main: 0.015,
    chest_center: 0.045, waist_center: 0.035, hip_center: 0.015, knee_left: 0.02, knee_right: 0.02,
    ankle_left: -0.012, ankle_right: -0.012, foot_contact_left: 0.035, foot_contact_right: 0.035,
  };
  /** Medidas da silhueta de um quadro: topo, base e centro do tronco (linha do peito). */
  function medidasSilhueta(im) {
    const w = im.w, h = im.h; let topo = h, base = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (im.d[(y * w + x) * 4 + 3] > 0.3) { if (y < topo) topo = y; base = y; break; }
    if (base < 0) return null;
    const centro = f => { const y = Math.round(topo + (base - topo) * f); let a = -1, b = -1; for (let x = 0; x < w; x++) if (im.d[(y * w + x) * 4 + 3] > 0.3) { if (a < 0) a = x; b = x; } return a < 0 ? w / 2 : (a + b) / 2; };
    // centro da silhueta em cada linha (para encaixar os pontos de perfil no corpo)
    const centros = new Array(h).fill(null);
    for (let y = topo; y <= base; y++) { let a = -1, b = -1; for (let x = 0; x < w; x++) if (im.d[(y * w + x) * 4 + 3] > 0.3) { if (a < 0) a = x; b = x; } if (a >= 0) centros[y] = (a + b) / 2; }
    return { topo, base, alt: base - topo, cx: (centro(0.42) + centro(0.5)) / 2, centros };
  }
  /** Pontos que ficam atrás do corpo na vista de perfil: o lado do corpo que fica longe da câmera. */
  function ladoOculto(frente, mf, vista) {
    if (vista !== 'direita' && vista !== 'esquerda') return [];
    const limite = mf.alt * 0.04;
    // olhando para a direita da tela, o lado que estava à direita na frente vai para trás (e vice-versa)
    return Object.keys(frente).filter(n => { const lat = frente[n][0] - mf.cx; return vista === 'direita' ? lat > limite : lat < -limite; });
  }
  /**
   * Gira o rig da frente (um quadro) para outra vista e encaixa na silhueta.
   * frente: { ponto: [x,y] }, mf / ma: medidasSilhueta da frente e da vista alvo.
   */
  function girarRig(frente, mf, ma, vista) {
    const s = ma.alt / mf.alt, P = {};
    for (const n in frente) {
      const [x, y] = frente[n]; const lat = x - mf.cx, prof = (PROFUNDIDADE[n] || 0) * mf.alt;
      let nx;
      if (vista === 'costas') nx = ma.cx - lat * s;            // meia-volta: o lado esquerdo da tela vira o direito
      const ny = ma.topo + (y - mf.topo) * s;
      // de perfil, cada ponto vai para o centro do corpo na sua altura e avança/recua conforme a profundidade
      const linha = ma.centros ? ma.centros[Math.max(0, Math.min(ma.centros.length - 1, Math.round(ny)))] : null;
      const meio = linha != null ? linha : ma.cx;
      if (vista === 'direita') nx = meio + prof * s;            // olhando para a direita da tela
      else if (vista === 'esquerda') nx = meio - prof * s;      // olhando para a esquerda da tela
      else if (vista !== 'costas') nx = ma.cx + lat * s;
      P[n] = [+nx.toFixed(1), +ny.toFixed(1)];
    }
    return P;
  }
  function proporLandmarks(q, op = {}) {
    const m = medir(q, op); if (!m) return null;
    const w = q.w; const linha = f => {
      const y = Math.round(m.topo + m.alt * f); let a = w, b = -1, s = 0, n = 0;
      for (let x = 0; x < w; x++) if (m.corpo[y * w + x]) { if (x < a) a = x; if (x > b) b = x; s += x; n++; }
      return { y, a, b, c: n ? s / n : m.cabecaX };
    };
    const P = {};
    P.head_top = [m.cabecaX, m.topo];
    const hc = linha(0.14); P.head_center = [hc.c, hc.y];
    const nk = linha(0.3); P.neck_base = [nk.c, nk.y];
    const sh = linha(0.36); const meio = (sh.a + sh.b) / 2, larg = (sh.b - sh.a) * 0.32;
    P.shoulder_left = [meio - larg, sh.y]; P.shoulder_right = [meio + larg, sh.y];
    const ch = linha(0.44); P.chest_center = [ch.c, ch.y];
    const wa = linha(0.56); P.waist_center = [wa.c, wa.y];
    const hp = linha(0.64); P.hip_center = [hp.c, hp.y];
    const kn = linha(0.8); const km = (kn.a + kn.b) / 2, kl = (kn.b - kn.a) * 0.22;
    P.knee_left = [km - kl, kn.y]; P.knee_right = [km + kl, kn.y];
    // apoios: pixels mais baixos à esquerda e à direita do centro do pé
    let le = null, ri = null;
    for (let y = m.pe; y > m.pe - m.alt * 0.08 && (!le || !ri); y--) for (let x = 0; x < w; x++) {
      if (!m.corpo[y * w + x]) continue; if (x < m.apoioX && !le) le = [x, y]; if (x >= m.apoioX && !ri) ri = [x, y];
    }
    P.foot_contact_left = le || [m.apoioX - 6, m.pe]; P.foot_contact_right = ri || [m.apoioX + 6, m.pe];
    const an = linha(0.93); P.ankle_left = [Math.min(P.foot_contact_left[0] + 3, an.c), an.y]; P.ankle_right = [Math.max(P.foot_contact_right[0] - 3, an.c), an.y];
    // braços: cotovelo e punho descem pela borda da silhueta, um pouco para dentro
    const cot = linha(0.47), pun = linha(0.58); const dentro = (sh.b - sh.a) * 0.08;
    P.elbow_left = [cot.a + dentro, cot.y]; P.elbow_right = [cot.b - dentro, cot.y];
    P.wrist_left = [pun.a + dentro, pun.y]; P.wrist_right = [pun.b - dentro, pun.y];
    // mão principal: perto do destaque, descendo pelo cabo até a altura do peito
    P.hand_main = m.destaque ? [m.destaque[0], Math.max(m.destaque[1], ch.y)] : [sh.b, ch.y];
    for (const k in P) P[k] = [+P[k][0].toFixed(1), +P[k][1].toFixed(1)];
    return P;
  }

  // ---------------------------------------------------------------- 11. equipamento rígido preso a âncoras
  /**
   * Desenha um item (imagem com ponto de pega) preso a um landmark, girando pela linha entre dois landmarks
   * (deformação "rigid_low_deform": só gira e move, não estica). Retorna a imagem do item já posicionada.
   * item: { imagem, pega:[x,y], ancora:'hand_main', mira:'head_top'|null, anguloExtra:graus, escala }
   */
  function posicionarItem(item, P, W, H, op = {}) {
    const out = criar(W, H); const ancoraBase = P[item.ancora]; if (!ancoraBase) return out;
    const a = [ancoraBase[0] + (item.offsetX || 0), ancoraBase[1] + (item.offsetY || 0)];
    let ang = (item.anguloExtra || 0) * Math.PI / 180;
    if (item.mira && P[item.mira]) {
      const b = P[item.mira]; const base = item.miraBase != null ? item.miraBase : -90;
      ang += Math.atan2(b[1] - ancoraBase[1], b[0] - ancoraBase[0]) - base * Math.PI / 180;
    }
    const esc = (item.escala || 1) * (op.escala || 1); const cs = Math.cos(-ang), sn = Math.sin(-ang);
    const im = item.imagem; const [gx, gy] = item.pega;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - a[0]) / esc, dy = (y - a[1]) / esc;
      const sx = dx * cs - dy * sn + gx, sy = dx * sn + dy * cs + gy;
      if (sx < -1 || sy < -1 || sx > im.w || sy > im.h) continue;
      const v = amostrarRGBA(im, sx, sy); const i = (y * W + x) * 4;
      out.d[i] = v[0]; out.d[i + 1] = v[1]; out.d[i + 2] = v[2]; out.d[i + 3] = v[3];
    }
    return out;
  }
  /**
   * Compõe corpo + itens na ordem de desenho. "Ocultar, não apagar": o corpo original não muda;
   * a máscara só esconde o corpo onde o item cobre (alfa do item com folga de N px).
   */
  function comporQuadro(corpo, P, itens, op = {}) {
    const W = corpo.w, H = corpo.h; const atras = [], frente = [];
    for (const it of itens) (it.ordem === 'atras' ? atras : frente).push(it);
    const out = criar(W, H);
    const colocados = new Map();
    for (const it of itens) colocados.set(it, posicionarItem(it, P, W, H, op));
    for (const it of atras) colar(out, colocados.get(it), 0, 0);
    // corpo com máscara dos itens que cobrem (ocultar)
    const corpoM = criar(W, H); corpoM.d.set(corpo.d);
    if (op.corpoVisivel === false) for (let i = 3; i < corpoM.d.length; i += 4) corpoM.d[i] = 0;
    for (const it of frente) {
      if (!it.mascara) continue; const pos = colocados.get(it);
      const cob = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) cob[i] = pos.d[i * 4 + 3] > 0.6 ? 1 : 0;
      const er = it.folga ? erodir(cob, W, H, it.folga) : cob;
      for (let i = 0; i < W * H; i++) if (er[i]) corpoM.d[i * 4 + 3] = 0;
    }
    colar(out, corpoM, 0, 0);
    for (const it of frente) colar(out, colocados.get(it), 0, 0);
    return out;
  }

  // ---------------------------------------------------------------- 11c. animação procedural por segmentos
  /*
   * Regra do projeto (Lucas, 08/11): o ciclo é dividido em segmentos (ex.: 30 quadros = 5 x 6).
   * Cada segmento tem uma pose de chegada (chave). Dentro do segmento a parte anda com aceleração e
   * desaceleração (slow in / slow out) e cada quadro PARTE DO QUADRO ANTERIOR, somando só o pedaço novo
   * do movimento — então a mão nunca "volta" no meio do segmento.
   * Camadas: mão (+ cajado rígido preso nela) -> braço (deformação suave) -> roupa (atraso, continuação).
   */
  const suave = t => t * t * (3 - 2 * t); // aceleração e desaceleração
  /**
   * Monta a trilha acumulativa: para cada quadro, o deslocamento total da parte.
   * segmentos: [{ quadros: 6, ate: [dx, dy], giro: graus }]  ("ate" = posição de chegada em relação ao descanso)
   */
  function trilhaSegmentos(segmentos) {
    const trilha = []; let atual = { x: 0, y: 0, g: 0 };
    for (const seg of segmentos) {
      const ini = { ...atual }; const fim = { x: seg.ate[0], y: seg.ate[1], g: seg.giro || 0 };
      let feito = 0; // fração já percorrida neste segmento
      for (let k = 1; k <= seg.quadros; k++) {
        const alvo = suave(k / seg.quadros); const passo = alvo - feito; feito = alvo;
        // quadro novo = quadro anterior + só o movimento novo
        atual = { x: atual.x + (fim.x - ini.x) * passo, y: atual.y + (fim.y - ini.y) * passo, g: atual.g + (fim.g - ini.g) * passo };
        trilha.push({ x: +atual.x.toFixed(3), y: +atual.y.toFixed(3), g: +atual.g.toFixed(3), segmento: segmentos.indexOf(seg) });
      }
    }
    return trilha;
  }
  /** Confere a regra "não volta": dentro de cada segmento o movimento anda sempre no mesmo sentido. */
  function conferirTrilha(trilha) {
    const ruins = [];
    for (let k = 1; k < trilha.length; k++) {
      const a = trilha[k - 1], b = trilha[k]; if (a.segmento !== b.segmento) continue;
      const c = trilha[k + 1]; if (!c || c.segmento !== b.segmento) continue;
      const d1 = [b.x - a.x, b.y - a.y], d2 = [c.x - b.x, c.y - b.y];
      if (d1[0] * d2[0] + d1[1] * d2[1] < -1e-6) ruins.push(k);
    }
    return { ok: !ruins.length, quadros: ruins };
  }
  /** Peça rígida por cor (ex.: cajado de madeira + cristal + a mão que segura): maior pedaço ligado à âncora. */
  function mascaraRigida(im, ancora, op = {}) {
    const w = im.w, h = im.h, N = w * h; const m = new Uint8Array(N);
    const ehMadeira = (r, g, b, mx, sat) => sat > 0.12 && mx > 0.14 && r >= g && g >= b * 0.9 && r - b > 0.04; // marrom / pele
    for (let i = 0; i < N; i++) {
      if (im.d[i * 4 + 3] < 0.4) continue; const r = im.d[i * 4], g = im.d[i * 4 + 1], b = im.d[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx - mn) / Math.max(mx, 1e-3);
      if (ehMadeira(r, g, b, mx, sat) || (b > r + 0.08 && sat > 0.25)) m[i] = 1;
    }
    const f = fechar(m, w, h, 2); const r = rotular(f, w, h);
    // pedaço que passa mais perto da âncora
    let melhor = 0, dm = Infinity; const [ax, ay] = ancora;
    for (let i = 0; i < N; i++) if (r.lab[i]) { const d = Math.hypot(i % w - ax, ((i / w) | 0) - ay); if (d < dm && r.areas[r.lab[i]] > (op.minArea || 60)) { dm = d; melhor = r.lab[i]; } }
    const out = new Uint8Array(N); if (!melhor || dm > (op.raio || 18)) return out;
    for (let i = 0; i < N; i++) if (r.lab[i] === melhor && m[i]) out[i] = 1;
    // peça comprida (cajado, lança, espada): acha o eixo e segue a haste inteira, inclusive a parte escura
    // e o contorno de tinta, até o desenho acabar — para não sobrar pedaço do cajado no lugar antigo
    let sx = 0, sy = 0, n = 0; for (let i = 0; i < N; i++) if (out[i]) { sx += i % w; sy += (i / w) | 0; n++; }
    if (n > 20) {
      const cx = sx / n, cy = sy / n; let xx = 0, yy = 0, xy = 0;
      for (let i = 0; i < N; i++) if (out[i]) { const dx = i % w - cx, dy = ((i / w) | 0) - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
      const tr = xx + yy, det = xx * yy - xy * xy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr - l1;
      if (l1 > 16 * Math.max(l2, 1)) {
        let ux = xy, uy = l1 - xx; const nn = Math.hypot(ux, uy) || 1; ux /= nn; uy /= nn; if (Math.abs(ux) < 1e-6 && Math.abs(uy) < 1e-6) { ux = 0; uy = 1; }
        const meia = Math.max(2.5, Math.sqrt(l2 / n) * 1.6 + 1.5);
        for (const sentido of [1, -1]) {
          let vazio = 0;
          for (let t = 0; vazio < 6 && t < Math.max(w, h); t++) {
            const px = cx + ux * t * sentido, py = cy + uy * t * sentido; if (px < 0 || py < 0 || px >= w || py >= h) break;
            let achou = false;
            for (let k = -Math.ceil(meia); k <= Math.ceil(meia); k++) {
              const qx = Math.round(px - uy * k), qy = Math.round(py + ux * k); if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
              const q = qy * w + qx; if (im.d[q * 4 + 3] > 0.3) { out[q] = 1; achou = true; }
            }
            vazio = achou ? 0 : vazio + 1;
          }
        }
      }
    }
    return dilatar(out, w, h, 1);
  }
  /** Tira a peça rígida e tapa o buraco por dentro do corpo com a cor dos vizinhos (para a peça poder andar). */
  function separarCamada(im, mascara) {
    const w = im.w, h = im.h, N = w * h; const camada = criar(w, h), resto = criar(w, h); resto.d.set(im.d);
    for (let i = 0; i < N; i++) if (mascara[i]) { for (let c = 0; c < 4; c++) camada.d[i * 4 + c] = im.d[i * 4 + c]; resto.d[i * 4 + 3] = 0; }
    // buraco por dentro do corpo: tem corpo dos dois lados (horizontal ou vertical) -> preenche
    const fonte = new Uint8Array(N); for (let i = 0; i < N; i++) fonte[i] = !mascara[i] && im.d[i * 4 + 3] > 0.8 ? 1 : 0;
    const prox = maisProximo(fonte, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!mascara[i]) continue;
      const lado = (dx, dy) => { for (let k = 1; k < 14; k++) { const xx = x + dx * k, yy = y + dy * k; if (xx < 0 || yy < 0 || xx >= w || yy >= h) return false; const j = yy * w + xx; if (!mascara[j]) return im.d[j * 4 + 3] > 0.5; } return false; };
      if ((lado(-1, 0) && lado(1, 0)) || (lado(0, -1) && lado(0, 1))) { const j = prox[i]; if (j >= 0) { for (let c = 0; c < 3; c++) resto.d[i * 4 + c] = im.d[j * 4 + c]; resto.d[i * 4 + 3] = 1; } }
    }
    return { camada, resto };
  }
  /** Deforma a imagem com pontos de controle (campo suave, peso pelo inverso da distância). */
  /** Esticamento máximo do campo (variação do deslocamento por pixel). > 0,35 = malha arrastando ("borracha"). */
  function esticamento(im, pontos) {
    const W = im.w, H = im.h; const campo = (x, y) => { let sx = 0, sy = 0, sw = 0; for (const p of pontos) { const d2 = (x - p.x) ** 2 + (y - p.y) ** 2; const wgt = 1 / ((d2 + 16) * (d2 + 16)); sx += p.dx * wgt; sy += p.dy * wgt; sw += wgt; } return [sx / sw, sy / sw]; };
    let pior = 0;
    for (let y = 2; y < H - 2; y += 3) for (let x = 2; x < W - 2; x += 3) {
      if (im.d[(y * W + x) * 4 + 3] < 0.3) continue;
      const a = campo(x, y), b = campo(x + 2, y), c = campo(x, y + 2);
      pior = Math.max(pior, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, Math.hypot(c[0] - a[0], c[1] - a[1]) / 2);
    }
    return pior;
  }
  function deformar(im, pontos) {
    const W = im.w, H = im.h; const out = criar(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let sx = 0, sy = 0, sw = 0;
      for (const p of pontos) { const d2 = (x - p.x) ** 2 + (y - p.y) ** 2; const wgt = 1 / ((d2 + 16) * (d2 + 16)); sx += p.dx * wgt; sy += p.dy * wgt; sw += wgt; }
      const v = amostrarRGBA(im, x - sx / sw, y - sy / sw); const i = (y * W + x) * 4; out.d[i] = v[0]; out.d[i + 1] = v[1]; out.d[i + 2] = v[2]; out.d[i + 3] = v[3];
    }
    return out;
  }
  function transformarRigido(im, piv, dx, dy, graus) {
    const W = im.w, H = im.h; const out = criar(W, H); const a = -graus * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ux = x - piv[0] - dx, uy = y - piv[1] - dy;
      const v = amostrarRGBA(im, ux * cs - uy * sn + piv[0], ux * sn + uy * cs + piv[1]); const i = (y * W + x) * 4;
      out.d[i] = v[0]; out.d[i + 1] = v[1]; out.d[i + 2] = v[2]; out.d[i + 3] = v[3];
    }
    return out;
  }
  /**
   * Gera os quadros do gesto a partir de UM quadro de descanso e seus landmarks.
   * op: { segmentos, mao: 'hand_main', pecaRigida: true, atrasoRoupa: 2, forcaRoupa: 0.35, ordemPeca: 'frente' }
   */
  function animarSegmentos(base, P, op = {}) {
    const segmentos = op.segmentos || GESTOS.mao_frente_tras.segmentos;
    const trilha = trilhaSegmentos(segmentos); const mao = P[op.mao || 'hand_main'];
    // "bases": quadros de descanso que já respiram (idle). O gesto anda POR CIMA deles: nada fica congelado.
    const bases = op.bases && op.bases.length ? op.bases : [base];
    const camadas = bases.map(b => { const mask = op.pecaRigida === false ? new Uint8Array(b.w * b.h) : mascaraRigida(b, mao); return separarCamada(b, mask); });
    const fixos = ['head_top', 'head_center', 'neck_base', 'chest_center', 'hip_center', 'knee_left', 'knee_right', 'ankle_left', 'ankle_right', 'foot_contact_left', 'foot_contact_right'];
    const atraso = op.atrasoRoupa == null ? 2 : op.atrasoRoupa, forca = op.forcaRoupa == null ? 0.35 : op.forcaRoupa;
    const quadros = []; let piorG = 0;
    trilha.forEach((t, k) => {
      const tr = trilha[(k - atraso + trilha.length) % trilha.length]; // roupa chega depois (continuação)
      const pts = [];
      for (const n of fixos) if (P[n]) pts.push({ x: P[n][0], y: P[n][1], dx: 0, dy: 0 });
      pts.push({ x: mao[0], y: mao[1], dx: t.x, dy: t.y });
      for (const n of ['wrist_left', 'wrist_right']) if (P[n] && Math.hypot(P[n][0] - mao[0], P[n][1] - mao[1]) < 40) pts.push({ x: P[n][0], y: P[n][1], dx: t.x * 0.85, dy: t.y * 0.85 });
      for (const n of ['elbow_left', 'elbow_right']) if (P[n] && Math.hypot(P[n][0] - mao[0], P[n][1] - mao[1]) < 70) pts.push({ x: P[n][0], y: P[n][1], dx: t.x * 0.6, dy: t.y * 0.6 });
      // ombro do lado da mão acompanha um pouco: o braço gira, não estica (regra: malha não arrasta)
      const ombro = ['shoulder_left', 'shoulder_right'].filter(n => P[n]).sort((a, b) => Math.hypot(P[a][0] - mao[0], P[a][1] - mao[1]) - Math.hypot(P[b][0] - mao[0], P[b][1] - mao[1]))[0];
      if (ombro) pts.push({ x: P[ombro][0], y: P[ombro][1], dx: t.x * 0.45, dy: t.y * 0.45 });
      if (P.waist_center) pts.push({ x: P.waist_center[0] + (mao[0] - P.waist_center[0]) * 0.6, y: P.waist_center[1] + 18, dx: tr.x * forca, dy: tr.y * forca * 0.3 });
      const { camada, resto } = camadas[k % camadas.length];
      if (k % 5 === 0) piorG = Math.max(piorG, esticamento(resto, pts));
      const corpo = deformar(resto, pts);
      const peca = transformarRigido(camada, mao, t.x, t.y, t.g);
      const q = criar(base.w, base.h);
      if (op.ordemPeca === 'atras') { colar(q, peca, 0, 0); colar(q, corpo, 0, 0); } else { colar(q, corpo, 0, 0); colar(q, peca, 0, 0); }
      quadros.push(suavizar(limparFranja(q)));
    });
    const regra = conferirTrilha(trilha); const conf = conferir(quadros);
    conf.push({ id: 'malha', nome: 'Sem malha arrastada', valor: piorG, meta: 'esticamento < 0,35 (tecido: deformação moderada)', ok: piorG < 0.35, texto: 'esticamento ' + piorG.toFixed(2) });
    conf.push({ id: 'nao_volta', nome: 'Movimento não volta na etapa', valor: regra.quadros.length, meta: '0 quadros voltando', ok: regra.ok, texto: regra.ok ? 'ok' : regra.quadros.length + ' quadro(s) voltando' });
    return { quadros, trilha, regra, conferencia: conf, aprovado: conf.every(r => r.ok), pontos: trilha.map(t => [t.x, t.y]) };
  }
  /**
   * Caminhada procedural a partir de UMA pose de descanso (regra das etapas):
   * cada passo = 3 etapas (contato -> descida -> passagem -> contato do outro pé); ciclo = 2 passos = 6 etapas.
   * 30 quadros -> 6 etapas de 5; 24 quadros -> 6 etapas de 4. Cada quadro parte do anterior (acumulativo).
   * Camadas: pés/pernas -> quadril sobe e desce -> mãos balançam ao contrário das pernas (cajado rígido na mão)
   * -> capa com atraso (continuação). Vista lateral: pés vão à frente/atrás; frente/costas: pés sobem e descem.
   */
  function andarProcedural(base, P, op = {}) {
    const total = op.quadros || 30, porEtapa = total / 6; const lado = op.vista === 'esquerda' || op.vista === 'direita';
    const sentido = op.vista === 'esquerda' ? -1 : 1;
    const alt = (P.foot_contact_left[1] + P.foot_contact_right[1]) / 2 - P.head_top[1];
    const A = { passo: (op.passo || (lado ? 0.09 : 0.02)) * alt, ergue: (op.ergue || (lado ? 0.045 : 0.035)) * alt, bob: (op.bob || 0.014) * alt, braco: (op.braco || (lado ? 0.05 : 0.015)) * alt };
    // poses-chave do ciclo (a = pé esquerdo, b = pé direito): [dx, dy] de cada pé, dy do quadril, dx da mão
    const P0 = { a: [A.passo, 0], b: [-A.passo, 0], q: 0, m: -A.braco };          // contato: esquerdo na frente
    const P1 = { a: [A.passo * 0.3, 0], b: [-A.passo * 0.6, -A.ergue * 0.6], q: A.bob, m: -A.braco * 0.4 }; // descida (peso no esquerdo)
    const P2 = { a: [-A.passo * 0.2, 0], b: [A.passo * 0.1, -A.ergue], q: -A.bob, m: 0 };      // passagem (direito no ar)
    const P3 = { a: [-A.passo, 0], b: [A.passo, 0], q: 0, m: A.braco };            // contato: direito na frente
    const P4 = { a: [-A.passo * 0.6, -A.ergue * 0.6], b: [A.passo * 0.3, 0], q: A.bob, m: A.braco * 0.4 };
    const P5 = { a: [A.passo * 0.1, -A.ergue], b: [-A.passo * 0.2, 0], q: -A.bob, m: 0 };
    const chaves = [P0, P1, P2, P3, P4, P5, P0];
    // trilha acumulativa por canal (cada quadro = anterior + pedaço novo, com slow in/out por etapa)
    const canais = ['ax', 'ay', 'bx', 'by', 'q', 'm']; const val = c => k => ({ ax: k.a[0], ay: k.a[1], bx: k.b[0], by: k.b[1], q: k.q, m: k.m })[c];
    const quadrosTrilha = []; let atual = Object.fromEntries(canais.map(c => [c, val(c)(P0)]));
    for (let e = 0; e < 6; e++) {
      const ini = chaves[e], fim = chaves[e + 1]; let feito = 0;
      for (let k = 1; k <= porEtapa; k++) {
        // passos andam em velocidade quase constante (linear com leve suavização), o resto com slow in/out
        const alvo = 0.5 * (k / porEtapa) + 0.5 * suave(k / porEtapa); const passo = alvo - feito; feito = alvo;
        const novo = {}; for (const c of canais) novo[c] = atual[c] + (val(c)(fim) - val(c)(ini)) * passo;
        atual = novo; quadrosTrilha.push({ ...atual, etapa: e });
      }
    }
    // o último quadro é o P0 de novo: gira para o loop começar no contato sem repetir quadro
    quadrosTrilha.unshift(quadrosTrilha.pop());
    const mao = P.hand_main; const mask = mascaraRigida(base, mao); const { camada, resto } = separarCamada(base, mask);
    const bases = op.bases && op.bases.length ? op.bases.map(b => separarCamada(b, mascaraRigida(b, mao))) : [{ camada, resto }];
    const quadros = []; let piorEstica = 0;
    quadrosTrilha.forEach((t, k) => {
      const t2 = quadrosTrilha[(k - 2 + total) % total]; // capa atrasada 2 quadros
      const dxp = v => v * sentido;
      const pts = [];
      // cabeça e tronco: só o sobe-desce do quadril
      for (const n of ['head_top', 'head_center', 'neck_base', 'shoulder_left', 'shoulder_right', 'chest_center', 'waist_center', 'hip_center']) if (P[n]) pts.push({ x: P[n][0], y: P[n][1], dx: 0, dy: t.q });
      // pés e tornozelos (lado: frente/trás; frente/costas: só sobem)
      const pes = [['foot_contact_left', 'ankle_left', 'knee_left', t.ax, t.ay], ['foot_contact_right', 'ankle_right', 'knee_right', t.bx, t.by]];
      for (const [pe, tz, jo, dx, dy] of pes) {
        const fx = lado ? dxp(dx) : 0, fy = lado ? dy : dy + (op.vista === 'costas' ? -1 : 1) * dx * 0.25;
        if (P[pe]) pts.push({ x: P[pe][0], y: P[pe][1], dx: fx, dy: fy });
        if (P[tz]) pts.push({ x: P[tz][0], y: P[tz][1], dx: fx, dy: fy * 0.9 });
        if (P[jo]) pts.push({ x: P[jo][0], y: P[jo][1], dx: fx * 0.5, dy: (fy + t.q) * 0.5 });
      }
      // capa: barra atrasada balança ao contrário do quadril (continuação)
      if (P.hip_center && P.knee_left && P.knee_right) {
        const hy = (P.knee_left[1] + P.knee_right[1]) / 2; const meio = P.hip_center[0];
        const sway = lado ? -dxp((t2.ax + t2.bx) * 0.5) * 0.6 - dxp(A.passo) * 0.15 : (t2.ax - t2.bx) * 0.12;
        for (const off of [-0.45, 0.45]) pts.push({ x: meio + off * Math.abs(P.knee_right[0] - P.knee_left[0]) * 2.2, y: hy, dx: sway, dy: t2.q * 0.6 });
      }
      // mão (e cajado rígido) balança ao contrário das pernas
      const mdx = lado ? dxp(t.m) : 0, mdy = t.q + (lado ? 0 : Math.abs(t.m) * 0.3);
      pts.push({ x: mao[0], y: mao[1], dx: mdx, dy: mdy });
      const { camada: cam, resto: res } = bases[k % bases.length];
      if (k % 5 === 0) piorEstica = Math.max(piorEstica, esticamento(res, pts));
      const corpo = deformar(res, pts); const peca = transformarRigido(cam, mao, mdx, mdy, lado ? -t.m / A.braco * 3 * sentido : 0);
      const q = criar(base.w, base.h);
      if (op.vista === 'costas') { colar(q, peca, 0, 0); colar(q, corpo, 0, 0); } else { colar(q, corpo, 0, 0); colar(q, peca, 0, 0); }
      quadros.push(suavizar(limparFranja(q)));
    });
    // regra da skill: malha não pode arrastar (pé grudado, bota esticada). Reprova sozinho.
    const conf = conferir(quadros); conf.push({ id: 'malha', nome: 'Sem malha arrastada', valor: piorEstica, meta: 'esticamento < 0,35 (tecido: deformação moderada)', ok: piorEstica < 0.35, texto: 'esticamento ' + piorEstica.toFixed(2) });
    return { quadros, trilha: quadrosTrilha, conferencia: conf, aprovado: conf.every(r => r.ok) };
  }

  // gestos prontos (30 quadros = 5 segmentos de 6), deslocamentos em px do quadro do jogo
  const GESTOS = {
    mao_frente_tras: { nome: 'Mão vai à frente, volta, vai atrás (calmo)', segmentos: [
      { quadros: 6, ate: [5, -2], giro: -4 }, { quadros: 6, ate: [0, 0], giro: 0 }, { quadros: 6, ate: [-4, 2], giro: 3 },
      { quadros: 6, ate: [0, 0], giro: 0 }, { quadros: 6, ate: [0, 0], giro: 0 }] },
    cajado_erguer: { nome: 'Ergue o cajado (confiante)', segmentos: [
      { quadros: 6, ate: [1, 1], giro: 2 }, { quadros: 6, ate: [-1, -5], giro: -5 }, { quadros: 6, ate: [-1, -6], giro: -6 },
      { quadros: 6, ate: [0, -2], giro: -2 }, { quadros: 6, ate: [0, 0], giro: 0 }] },
    respiro_cansado: { nome: 'Cajado pesa (cansado)', segmentos: [
      { quadros: 6, ate: [0, 3], giro: 3 }, { quadros: 6, ate: [1, 5], giro: 5 }, { quadros: 6, ate: [1, 5], giro: 5 },
      { quadros: 6, ate: [0, 2], giro: 2 }, { quadros: 6, ate: [0, 0], giro: 0 }] },
  };

  // ---------------------------------------------------------------- 11b. recortar peças de uma folha de itens
  /** Separa cada peça (capuz, calça, bota, cajado…) de uma folha desenhada: tira o fundo e recorta cada desenho grande. */
  function separarPecas(im, op = {}) {
    const sem = removerFundo(im, { ...op, sombraChao: false }).imagem; const w = sem.w, h = sem.h, N = w * h;
    const vis = new Uint8Array(N); for (let i = 0; i < N; i++) vis[i] = sem.d[i * 4 + 3] > 0.5 ? 1 : 0;
    // junta pedaços próximos da mesma peça (par de botas, cristal solto do cajado)
    const junto = fechar(dilatar(vis, w, h, op.juntar || 6), w, h, 2);
    const r = rotular(junto, w, h); const maior = Math.max(1, ...r.areas.slice(1));
    const pecas = [];
    for (let k = 1; k <= r.n; k++) {
      if (r.areas[k] < maior * (op.minRelativo || 0.04)) continue;
      const c = r.caixas[k]; const m = 4; const x0 = Math.max(0, c.x0 - m), y0 = Math.max(0, c.y0 - m);
      const q = recortar(sem, x0, y0, Math.min(w, c.x1 + m + 1) - x0, Math.min(h, c.y1 + m + 1) - y0);
      for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) if (r.lab[(y + y0) * w + x + x0] !== k) q.d[(y * q.w + x) * 4 + 3] = 0;
      pecas.push({ imagem: suavizar(q), x: x0, y: y0, w: q.w, h: q.h });
    }
    return pecas.sort((a, b) => (a.y > b.y + 200 ? 1 : b.y > a.y + 200 ? -1 : a.x - b.x));
  }

  // ---------------------------------------------------------------- 12. JSON para o Godot (formato do mago.gd)
  function jsonGodot(info) {
    const j = {
      quadros: info.quadros, colunas: info.quadros, largura_quadro: info.largura, altura_quadro: info.altura,
      pivo_px: info.pivo, escala_jogo: info.escalaJogo, direcoes: {},
    };
    if (info.fps) j.fps = info.fps; if (info.duracao) j.duracao_s = info.duracao; if (info.fpsRef) j.fps_ref = info.fpsRef;
    if (info.modelo) j.modelo = info.modelo;
    j.gerado_por = 'Estúdio Defenda e Ataque ' + VERSAO;
    for (const d in info.direcoes) {
      const dd = info.direcoes[d]; j.direcoes[d] = { arquivo: dd.arquivo };
      if (dd.pontos && dd.pontos.some(Boolean)) j.direcoes[d].ponta_cajado_px = dd.pontos.map(p => p || [0, 0]);
    }
    return j;
  }

  // ---------------------------------------------------------------- linha de produção completa
  const DIRECOES = ['frente', 'costas', 'esquerda', 'direita'];
  function adivinharDirecao(nome) {
    const n = (nome || '').toLowerCase();
    if (/frente|front|baixo|down|sul/.test(n)) return 'frente';
    if (/costas|back|tras|cima|up|norte/.test(n)) return 'costas';
    if (/esquerda|left|esq/.test(n)) return 'esquerda';
    if (/direita|right|dir/.test(n)) return 'direita';
    return null;
  }
  /**
   * Da folha desenhada ao pacote do jogo, sem passos manuais.
   * folhas: { frente: imagem, costas: imagem, ... }
   * op: { nome, alturaCorpo, escalaJogo, fps, quadrosPorFolha, corDestaque, gerarIdle, quadroIdle:{dir:k}, aoProgresso }
   */
  function produzir(folhas, op = {}) {
    const o = { nome: 'personagem', alturaCorpo: 240, escalaJogo: 0.5, fps: 10, gerarIdle: true, ...op };
    const prog = o.aoProgresso || (() => {});
    const res = { andar: {}, idle: {}, conferencia: {}, avisos: [] };
    const dirs = Object.keys(folhas);
    // 1) recorte e quadros de todas as direções
    const recortes = {};
    dirs.forEach((d, i) => {
      prog('Tirando o fundo: ' + d, i / dirs.length * 0.3);
      const semFundo = removerFundo(folhas[d], o).imagem;
      const caixas = separarQuadros(semFundo, { quadrosPorLinha: o.quadrosPorFolha });
      recortes[d] = caixas.map(c => recortar(semFundo, c.x, c.y, c.w, c.h));
      if (o.quadrosPorFolha && caixas.length !== o.quadrosPorFolha) res.avisos.push(d + ': achei ' + caixas.length + ' quadros (esperava ' + o.quadrosPorFolha + ')');
    });
    // 2) mesma escala para todas as direções (proporção igual entre vistas)
    const alts = []; dirs.forEach(d => recortes[d].forEach(q => { const m = medir(q); if (m) alts.push({ d, alt: m.alt }); }));
    const escalaPorDir = {};
    dirs.forEach(d => { const a = alts.filter(x => x.d === d).map(x => x.alt).sort((p, q) => p - q); escalaPorDir[d] = o.alturaCorpo / a[a.length >> 1]; });
    // 3) monta as folhas com o mesmo quadro (largura/altura/pivô) em todas as direções
    const provas = dirs.map(d => montarFolha(recortes[d], { ...o, escala: escalaPorDir[d], suavizar: false }));
    const W = Math.max(...provas.map(p => p.largura)), H = Math.max(...provas.map(p => p.altura));
    const pivo = [Math.round(W / 2), Math.max(...provas.map(p => p.pivo[1]))];
    dirs.forEach((d, i) => {
      prog('Alinhando e suavizando: ' + d, 0.3 + i / dirs.length * 0.4);
      const f = montarFolha(recortes[d], { ...o, escala: escalaPorDir[d], largura: W, altura: H, pivo });
      let quadros = f.quadros, pontos = f.pontos, folha = f.folha;
      // mais quadros por ciclo (12/24/30): intervalos automáticos entre os quadros desenhados
      const fator = o.quadrosCiclo ? Math.max(1, Math.round(o.quadrosCiclo / f.quadros.length)) : 1;
      if (fator > 1) {
        prog('Criando intervalos (' + f.quadros.length * fator + ' quadros): ' + d, 0.3 + (i + 0.5) / dirs.length * 0.4);
        quadros = interpolarCiclo(f.quadros, fator);
        pontos = []; const n0 = f.pontos.length;
        for (let k = 0; k < n0; k++) for (let j = 0; j < fator; j++) {
          const a = f.pontos[k], b = f.pontos[(k + 1) % n0], t = j / fator;
          pontos.push(a && b ? [+(a[0] + (b[0] - a[0]) * t).toFixed(1), +(a[1] + (b[1] - a[1]) * t).toFixed(1)] : a);
        }
        folha = criar(W * quadros.length, H); quadros.forEach((q, k) => colar(folha, q, k * W, 0));
      }
      res.andar[d] = { folha, quadros, pontos, desenhados: f.quadros.length, arquivo: o.nome + '_' + (o.nomeAnim || 'andar') + '_' + d + '.png' };
      res.conferencia['andar_' + d] = conferir(quadros);
    });
    res.largura = W; res.altura = H; res.pivo = pivo;
    const nAndar = res.andar[dirs[0]].quadros.length, nDesenhados = res.andar[dirs[0]].desenhados;
    // ritmo: com intervalos, o ciclo dura "duracaoCiclo" segundos (padrão 1 s); sem eles, usa o fps pedido
    const fpsAndar = nAndar > nDesenhados ? +(nAndar / (o.duracaoCiclo || 1)).toFixed(3) : o.fps;
    res.jsonAndar = jsonGodot({ quadros: nAndar, largura: W, altura: H, pivo, escalaJogo: o.escalaJogo, fpsRef: fpsAndar, modelo: o.nome, direcoes: res.andar });
    res.jsonAndar.quadros_desenhados = nDesenhados;
    // distância andada em um ciclo completo (o jogo avança 1 quadro a cada distancia_ciclo_px / quadros)
    res.jsonAndar.distancia_ciclo_px = o.distanciaCiclo || 120;
    // 4) idle respirando a partir do quadro mais "de pé" de cada direção (ou da imagem de corpo inteiro)
    if (o.gerarIdle) {
      dirs.forEach((d, i) => {
        prog('Gerando idle: ' + d, 0.7 + i / dirs.length * 0.28);
        // só quadros desenhados servem de base (os intervalos automáticos não)
        const passo = res.andar[d].quadros.length / res.andar[d].desenhados;
        const desenhados = res.andar[d].quadros.filter((_, j) => j % passo === 0);
        let base, k = (o.quadroIdle && o.quadroIdle[d] != null) ? o.quadroIdle[d] : quadroMaisNeutro(desenhados);
        let pt = res.andar[d].pontos[k * passo];
        if (o.corpoInteiro && o.corpoInteiro[d]) {
          const ci = o.corpoInteiro[d]; const sem = removerFundo(ci, o).imagem;
          const f = montarFolha([sem], { ...o, escala: undefined, alturaCorpo: o.alturaCorpo, largura: W, altura: H, pivo });
          base = f.quadros[0]; pt = f.pontos[0];
        } else base = desenhados[k];
        const idle = gerarIdle(base, { pivo, pontos: pt || null, quadros: o.quadrosIdle || 12, duracao: o.duracaoIdle || 2.2 });
        res.idle[d] = { folha: idle.folha, quadros: idle.quadros, pontos: idle.pontos, arquivo: o.nome + '_' + (o.nomeIdle || 'parado') + '_' + d + '.png', base: k };
        res.conferencia['parado_' + d] = conferir(idle.quadros);
        res.fpsIdle = idle.fps; res.duracaoIdle = idle.duracao;
      });
      res.jsonIdle = jsonGodot({ quadros: res.idle[dirs[0]].quadros.length, largura: W, altura: H, pivo, escalaJogo: o.escalaJogo, fps: res.fpsIdle, duracao: res.duracaoIdle, modelo: o.nome, direcoes: res.idle });
    }
    prog('Pronto', 1);
    return res;
  }

  return {
    VERSAO, DIRECOES, LANDMARKS, NOMES_LANDMARK, HIERARQUIA,
    criar, deBytes, paraBytes, recortar, colar, redimensionar,
    rotular, dilatar, erodir, fechar, preencherBuracos, maiorComponente, gauss,
    removerFundo, separarQuadros, medir, limparPapel, limparFranja, montarFolha, suavizar, bordasDuras,
    gerarIdle, quadroMaisNeutro, conferir, fluxo, intervalo, interpolarCiclo, proporLandmarks, posicionarItem, comporQuadro, separarPecas,
    trilhaSegmentos, conferirTrilha, mascaraRigida, separarCamada, deformar, transformarRigido, animarSegmentos, andarProcedural, esticamento, GESTOS,
    jsonGodot, adivinharDirecao, produzir,
    PROFUNDIDADE, medidasSilhueta, ladoOculto, girarRig,
  };
});
