#!/usr/bin/env node
'use strict';
/*
 * Testes automáticos do núcleo (rodam no GitHub a cada envio e no computador com "npm run testar").
 * Sem dependências: só Node.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const N = require('../nucleo/nucleo.js');
const PNG = require('../nucleo/png.js');

const RAIZ = path.resolve(__dirname, '..', '..');
const ler = arq => { const p = PNG.ler(fs.readFileSync(arq)); return N.deBytes(p.largura, p.altura, p.dados); };
let falhas = 0, total = 0;
function teste(nome, fn) {
  total++; const t0 = Date.now();
  try { fn(); console.log('  ✔ ' + nome + ' (' + (Date.now() - t0) + ' ms)'); }
  catch (e) { falhas++; console.log('  ✘ ' + nome + '\n      ' + (e && e.message)); }
}

console.log('Estúdio Defenda e Ataque — testes do núcleo ' + N.VERSAO);

teste('PNG: grava e lê de volta sem perder nada', () => {
  const im = N.criar(5, 3); for (let i = 0; i < im.d.length; i++) im.d[i] = ((i * 37) % 256) / 255;
  const b = PNG.gravar(5, 3, N.paraBytes(im)); const p = PNG.ler(b);
  assert.deepStrictEqual(Array.from(p.dados), Array.from(N.paraBytes(im)));
});

teste('Fundo branco: some, e o desenho fica', () => {
  const im = N.criar(40, 40); for (let i = 0; i < 1600; i++) { im.d.set([1, 1, 1, 1], i * 4); }
  for (let y = 10; y < 30; y++) for (let x = 12; x < 28; x++) im.d.set([0.1, 0.1, 0.12, 1], (y * 40 + x) * 4);
  const r = N.removerFundo(im).imagem;
  assert.strictEqual(r.d[3], 0, 'canto deveria ficar transparente');
  assert.strictEqual(r.d[(20 * 40 + 20) * 4 + 3], 1, 'miolo deveria ficar opaco');
});

teste('Suavizar: tira o serrilhado de um quadrado duro', () => {
  const im = N.criar(30, 30); for (let y = 8; y < 22; y++) for (let x = 8; x < 22; x++) im.d.set([0.2, 0.2, 0.2, 1], (y * 30 + x) * 4);
  assert.ok(N.bordasDuras(im) > 0.9); assert.ok(N.bordasDuras(N.suavizar(im)) < 0.25);
});

const receita = path.join(RAIZ, 'app/dados/personagens/mago/fonte/receita.json');
if (fs.existsSync(receita)) {
  const rc = JSON.parse(fs.readFileSync(receita, 'utf8')); const base = path.dirname(receita);
  const folhas = {}; for (const d in rc.folhas) folhas[d] = ler(path.join(base, rc.folhas[d]));
  let res;
  teste('Linha de produção: mago v2 (4 direções + idle)', () => { res = N.produzir(folhas, rc); });
  if (res) {
    teste('Mesmo quadro e pivô em todas as direções', () => {
      for (const d in res.andar) { assert.strictEqual(res.andar[d].quadros.length, rc.quadrosCiclo || 6, d); res.andar[d].quadros.forEach(q => { assert.strictEqual(q.w, res.largura); assert.strictEqual(q.h, res.altura); }); }
    });
    teste('Conferência das skills: todas as regras passam', () => {
      const ruins = []; for (const k in res.conferencia) for (const r of res.conferencia[k]) if (!r.ok) ruins.push(k + ': ' + r.nome + ' (' + r.texto + ')');
      assert.deepStrictEqual(ruins, []);
    });
    teste('JSON no formato que o mago.gd lê', () => {
      for (const j of [res.jsonAndar, res.jsonIdle]) {
        for (const c of ['quadros', 'colunas', 'largura_quadro', 'altura_quadro', 'pivo_px', 'escala_jogo', 'direcoes']) assert.ok(c in j, 'falta ' + c);
        for (const d of N.DIRECOES) { assert.ok(j.direcoes[d], 'falta direção ' + d); assert.strictEqual(j.direcoes[d].ponta_cajado_px.length, j.quadros, 'ponta do cajado por quadro'); }
      }
      assert.ok(res.jsonIdle.duracao_s >= 2 && res.jsonIdle.duracao_s <= 3, 'idle lento: respiração de 2 a 3 s');
      assert.ok(res.jsonAndar.distancia_ciclo_px > 0 && res.jsonAndar.quadros_desenhados === 6, 'andar informa distância do ciclo e quadros desenhados');
    });
    teste('Rig: proposta tem todos os pontos e pé no chão', () => {
      const L = N.proporLandmarks(res.andar.frente.quadros[0], { corDestaque: rc.corDestaque });
      for (const n of N.LANDMARKS) assert.ok(L[n], 'falta ' + n);
      assert.ok(Math.abs(L.foot_contact_left[1] - res.pivo[1]) <= 6, 'pé perto do pivô');
      assert.ok(L.head_top[1] < L.neck_base[1] && L.neck_base[1] < L.hip_center[1] && L.hip_center[1] < L.knee_left[1], 'ordem de cima para baixo');
    });
    teste('Intervalos automáticos: sem branco, pé firme e quadros desenhados preservados', () => {
      const q = res.andar.frente.quadros, passo = q.length / 6;
      assert.ok(passo >= 1 && Number.isInteger(passo));
      const conf = N.conferir(q); for (const r of conf) assert.ok(r.ok, r.nome + ': ' + r.texto);
    });
    teste('Equipamento rígido acompanha a âncora', () => {
      const item = N.criar(10, 40); for (let i = 0; i < 400; i++) item.d.set([0.6, 0.4, 0.2, 1], i * 4);
      const q = res.andar.frente.quadros; const P0 = N.proporLandmarks(q[0]), P3 = N.proporLandmarks(q[3]);
      const it = { imagem: item, pega: [5, 20], ancora: 'hand_main', escala: 1, ordem: 'frente' };
      const c0 = N.posicionarItem(it, P0, q[0].w, q[0].h), c3 = N.posicionarItem(it, P3, q[3].w, q[3].h);
      const centro = c => { let sx = 0, sy = 0, n = 0; for (let i = 0; i < c.w * c.h; i++) if (c.d[i * 4 + 3] > 0.5) { sx += i % c.w; sy += (i / c.w) | 0; n++; } return [sx / n, sy / n]; };
      const a = centro(c0), b = centro(c3);
      assert.ok(Math.hypot(a[0] - P0.hand_main[0], a[1] - P0.hand_main[1]) < 1.5 && Math.hypot(b[0] - P3.hand_main[0], b[1] - P3.hand_main[1]) < 1.5);
    });
  }
}

const pranchaPecas = path.join(RAIZ, 'docs/referencias/mago/02_pecas_equipamento_mago.png');
if (fs.existsSync(pranchaPecas)) teste('Recortar peças: prancha de equipamentos vira 5 itens', () => {
  const pecas = N.separarPecas(ler(pranchaPecas)); assert.strictEqual(pecas.length, 5);
});

console.log((total - falhas) + '/' + total + ' testes ok');
process.exitCode = falhas ? 1 : 0;
void os;
