/* Trabalho pesado fora da tela (Web Worker): a interface não trava enquanto a linha de produção roda. */
/* global EstudioNucleo */
importScripts('../nucleo/nucleo.js');
const N = EstudioNucleo;

function paraImagem(f) { return N.deBytes(f.w, f.h, f.bytes); }
function empacotar(im) { const b = N.paraBytes(im); return { w: im.w, h: im.h, bytes: b }; }

self.onmessage = (ev) => {
  const { id, tipo, dados } = ev.data;
  try {
    if (tipo === 'produzir') {
      const folhas = {}; for (const d in dados.folhas) folhas[d] = paraImagem(dados.folhas[d]);
      const corpoInteiro = {}; for (const d in (dados.corpoInteiro || {})) corpoInteiro[d] = paraImagem(dados.corpoInteiro[d]);
      const res = N.produzir(folhas, { ...dados.opcoes, corpoInteiro, aoProgresso: (texto, parte) => self.postMessage({ id, progresso: { texto, parte } }) });
      const saida = { largura: res.largura, altura: res.altura, pivo: res.pivo, conferencia: res.conferencia, avisos: res.avisos, jsonAndar: res.jsonAndar, jsonIdle: res.jsonIdle, andar: {}, idle: {} };
      const transf = [];
      for (const grupo of ['andar', 'idle']) for (const d in res[grupo]) {
        const f = empacotar(res[grupo][d].folha); transf.push(f.bytes.buffer);
        saida[grupo][d] = { folha: f, arquivo: res[grupo][d].arquivo, pontos: res[grupo][d].pontos, base: res[grupo][d].base };
      }
      self.postMessage({ id, resultado: saida }, transf);
    } else if (tipo === 'conferir') {
      const qs = dados.quadros.map(paraImagem);
      self.postMessage({ id, resultado: N.conferir(qs, dados.opcoes || {}) });
    } else if (tipo === 'landmarks') {
      const qs = dados.quadros.map(paraImagem);
      self.postMessage({ id, resultado: qs.map(q => N.proporLandmarks(q, dados.opcoes || {})) });
    } else if (tipo === 'compor') {
      // compõe todos os quadros com os itens equipados
      const qs = dados.quadros.map(paraImagem);
      const itens = dados.itens.map(it => ({ ...it, imagem: paraImagem(it.imagem) }));
      const out = qs.map((q, k) => empacotar(N.comporQuadro(q, dados.landmarks[k], itens)));
      self.postMessage({ id, resultado: out }, out.map(o => o.bytes.buffer));
    } else if (tipo === 'semFundo') {
      const im = N.removerFundo(paraImagem(dados.imagem), { sombraChao: false }).imagem;
      // corta o espaço vazio em volta
      let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
      for (let i = 0; i < im.w * im.h; i++) if (im.d[i * 4 + 3] > 0.02) { const x = i % im.w, y = (i / im.w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const r = x1 < 0 ? im : N.suavizar(N.recortar(im, Math.max(0, x0 - 3), Math.max(0, y0 - 3), Math.min(im.w, x1 + 4) - Math.max(0, x0 - 3), Math.min(im.h, y1 + 4) - Math.max(0, y0 - 3)));
      const o = empacotar(r); self.postMessage({ id, resultado: o }, [o.bytes.buffer]);
    } else if (tipo === 'pecas') {
      const pecas = N.separarPecas(paraImagem(dados.imagem)).map(pc => empacotar(pc.imagem));
      self.postMessage({ id, resultado: pecas }, pecas.map(o => o.bytes.buffer));
    } else if (tipo === 'gesto') {
      // animação procedural por segmentos por cima do idle (cada quadro parte do anterior)
      const bases = dados.bases.map(paraImagem);
      const r = N.animarSegmentos(bases[0], dados.landmarks, { segmentos: dados.segmentos, bases, ordemPeca: dados.ordemPeca });
      const out = r.quadros.map(empacotar);
      self.postMessage({ id, resultado: { quadros: out, regra: r.regra, conferencia: r.conferencia, aprovado: r.aprovado, pontos: r.pontos } }, out.map(o => o.bytes.buffer));
    } else if (tipo === 'suavizar') {
      const out = dados.quadros.map(q => empacotar(N.suavizar(paraImagem(q))));
      self.postMessage({ id, resultado: out }, out.map(o => o.bytes.buffer));
    }
  } catch (e) {
    self.postMessage({ id, erro: (e && e.message) || String(e) });
  }
};
