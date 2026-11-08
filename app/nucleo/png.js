'use strict';
// Leitura e escrita de PNG sem dependências (Node). Usado pela linha de comando e pelos testes.
// Lê PNG 8 bits (cinza, cinza+alfa, RGB, RGBA, paleta) sem entrelaçamento; grava RGBA 8 bits.
const zlib = require('zlib');

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function ler(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('Arquivo não é PNG');
  let p = 8, w = 0, h = 0, prof = 0, tipo = 0, entrel = 0, paleta = null, trns = null;
  const dados = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const nome = buf.toString('ascii', p + 4, p + 8);
    const corpo = buf.subarray(p + 8, p + 8 + len);
    if (nome === 'IHDR') { w = corpo.readUInt32BE(0); h = corpo.readUInt32BE(4); prof = corpo[8]; tipo = corpo[9]; entrel = corpo[12]; }
    else if (nome === 'PLTE') paleta = corpo;
    else if (nome === 'tRNS') trns = corpo;
    else if (nome === 'IDAT') dados.push(corpo);
    else if (nome === 'IEND') break;
    p += 12 + len;
  }
  if (prof !== 8) throw new Error('PNG com ' + prof + ' bits por canal não suportado (use 8 bits)');
  if (entrel) throw new Error('PNG entrelaçado não suportado');
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipo];
  const cru = zlib.inflateSync(Buffer.concat(dados));
  const lin = w * canais, bpp = canais;
  const px = new Uint8Array(w * h * canais);
  let ant = new Uint8Array(lin);
  for (let y = 0; y < h; y++) {
    const f = cru[y * (lin + 1)]; const ent = cru.subarray(y * (lin + 1) + 1, (y + 1) * (lin + 1));
    const sai = px.subarray(y * lin, (y + 1) * lin);
    for (let x = 0; x < lin; x++) {
      const a = x >= bpp ? sai[x - bpp] : 0, b = ant[x], c = x >= bpp ? ant[x - bpp] : 0;
      let v = ent[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      sai[x] = v & 255;
    }
    ant = sai;
  }
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r, g, b, a = 255;
    if (tipo === 0) { r = g = b = px[i]; }
    else if (tipo === 4) { r = g = b = px[i * 2]; a = px[i * 2 + 1]; }
    else if (tipo === 2) { r = px[i * 3]; g = px[i * 3 + 1]; b = px[i * 3 + 2]; }
    else if (tipo === 6) { r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2]; a = px[i * 4 + 3]; }
    else { const k = px[i]; r = paleta[k * 3]; g = paleta[k * 3 + 1]; b = paleta[k * 3 + 2]; if (trns && k < trns.length) a = trns[k]; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a;
  }
  return { largura: w, altura: h, dados: rgba };
}

function pedaco(nome, corpo) {
  const len = Buffer.alloc(4); len.writeUInt32BE(corpo.length);
  const nc = Buffer.concat([Buffer.from(nome, 'ascii'), corpo]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(nc));
  return Buffer.concat([len, nc, c]);
}

function gravar(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const lin = w * 4; const cru = Buffer.alloc((lin + 1) * h);
  for (let y = 0; y < h; y++) {
    // filtro "Sub": comprime bem as áreas transparentes
    cru[y * (lin + 1)] = 1;
    for (let x = 0; x < lin; x++) {
      const v = rgba[y * lin + x], a = x >= 4 ? rgba[y * lin + x - 4] : 0;
      cru[y * (lin + 1) + 1 + x] = (v - a) & 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pedaco('IHDR', ihdr), pedaco('IDAT', zlib.deflateSync(cru, { level: 9 })), pedaco('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { ler, gravar };
