#!/usr/bin/env node
'use strict';
/*
 * Linha de comando do Estúdio Defenda e Ataque (sem dependências).
 *
 *   node app/cli/estudio.js produzir <receita.json>      folhas desenhadas -> pacote do jogo (PNG + JSON)
 *   node app/cli/estudio.js conferir <folha.png> <largura_quadro> <altura_quadro> <quadros> [personagem|efeito]
 *   node app/cli/estudio.js suavizar <entrada.png> <saida.png> <largura_quadro> <altura_quadro> <quadros>
 *
 * Receita (exemplo em exemplos/mago-v2/receita.json):
 * { "nome": "mago", "saida": "saida/mago", "folhas": { "frente": "folhas/mago_frente.png", ... },
 *   "alturaCorpo": 240, "escalaJogo": 0.5, "fps": 10, "quadrosPorFolha": 6, "corDestaque": [0.3,0.55,1],
 *   "gerarIdle": true, "corpoInteiro": { "frente": "folhas/mago_corpo_inteiro.png" } }
 * Caminhos relativos são lidos a partir da pasta da receita.
 */
const fs = require('fs');
const path = require('path');
const N = require('../nucleo/nucleo.js');
const PNG = require('../nucleo/png.js');

function lerImagem(arq) { const p = PNG.ler(fs.readFileSync(arq)); return N.deBytes(p.largura, p.altura, p.dados); }
function gravarImagem(arq, im) { fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq, PNG.gravar(im.w, im.h, N.paraBytes(im))); }
function fatiar(im, fw, fh, n) { const q = []; const cols = Math.max(1, Math.floor(im.w / fw)); for (let k = 0; k < n; k++) q.push(N.recortar(im, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh)); return q; }
function imprimirConferencia(titulo, lista) {
  console.log('  ' + titulo);
  for (const r of lista) console.log('    ' + (r.ok ? '✔' : '✘') + ' ' + r.nome.padEnd(24) + r.texto + '   (meta: ' + r.meta + ')');
}

function produzir(arqReceita) {
  const base = path.dirname(path.resolve(arqReceita));
  const rc = JSON.parse(fs.readFileSync(arqReceita, 'utf8'));
  const abs = p => path.resolve(base, p);
  const folhas = {}; for (const d in rc.folhas) folhas[d] = lerImagem(abs(rc.folhas[d]));
  const corpoInteiro = {}; for (const d in (rc.corpoInteiro || {})) corpoInteiro[d] = lerImagem(abs(rc.corpoInteiro[d]));
  const t0 = Date.now();
  const res = N.produzir(folhas, { ...rc, corpoInteiro, aoProgresso: (txt) => process.stdout.write('\r  ' + txt.padEnd(40)) });
  process.stdout.write('\n');
  const saida = abs(rc.saida || 'saida');
  for (const d in res.andar) gravarImagem(path.join(saida, res.andar[d].arquivo), res.andar[d].folha);
  fs.writeFileSync(path.join(saida, rc.nome + '_' + (rc.nomeAnim || 'andar') + '.json'), JSON.stringify(res.jsonAndar, null, 1));
  if (res.jsonIdle) {
    for (const d in res.idle) gravarImagem(path.join(saida, res.idle[d].arquivo), res.idle[d].folha);
    fs.writeFileSync(path.join(saida, rc.nome + '_' + (rc.nomeIdle || 'parado') + '.json'), JSON.stringify(res.jsonIdle, null, 1));
  }
  console.log('Pacote em ' + saida + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s) — quadro ' + res.largura + '×' + res.altura + ', pivô ' + res.pivo.join(','));
  let falhas = 0;
  for (const k in res.conferencia) { imprimirConferencia(k, res.conferencia[k]); falhas += res.conferencia[k].filter(r => !r.ok).length; }
  for (const a of res.avisos) console.log('  aviso: ' + a);
  return falhas;
}

function main() {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === 'produzir') { const f = produzir(a[0]); process.exitCode = f ? 1 : 0; return; }
  if (cmd === 'conferir') {
    const q = fatiar(lerImagem(a[0]), +a[1], +a[2], +a[3]);
    const r = N.conferir(q, { tipo: a[4] || 'personagem' }); imprimirConferencia(path.basename(a[0]), r);
    process.exitCode = r.every(x => x.ok) ? 0 : 1; return;
  }
  if (cmd === 'suavizar') {
    const im = lerImagem(a[0]); const fw = +a[2], fh = +a[3], n = +a[4]; const out = N.criar(im.w, im.h);
    const cols = Math.max(1, Math.floor(im.w / fw));
    fatiar(im, fw, fh, n).forEach((q, k) => N.colar(out, N.suavizar(q), (k % cols) * fw, Math.floor(k / cols) * fh));
    gravarImagem(a[1], out); console.log('ok: ' + a[1]); return;
  }
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 17).join('\n'));
}
main();
