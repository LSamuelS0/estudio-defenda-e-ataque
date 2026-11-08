/* Conversões entre arquivos/imagens do navegador e o formato do núcleo ({w,h,d} em 0..1). */
window.ImagemWeb = (() => {
  const N = window.EstudioNucleo;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  async function carregarBitmap(fonte) {
    if (fonte instanceof Blob) return createImageBitmap(fonte, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const r = await fetch(fonte); if (!r.ok) throw new Error('Não consegui abrir ' + fonte);
    return createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  }
  async function paraNucleo(fonte) {
    const bmp = fonte instanceof ImageBitmap ? fonte : await carregarBitmap(fonte);
    const c = canvas(bmp.width, bmp.height); const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, 0, 0); const d = g.getImageData(0, 0, c.width, c.height);
    return { w: c.width, h: c.height, bytes: d.data };
  }
  function bytesParaCanvas(w, h, bytes) {
    const c = canvas(w, h); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(bytes), w, h), 0, 0); return c;
  }
  function nucleoParaCanvas(im) { return bytesParaCanvas(im.w, im.h, N.paraBytes(im)); }
  function canvasParaPNG(c) { return new Promise(ok => c.toBlob(ok, 'image/png')); }
  /** Lê uma folha + json do jogo e devolve os quadros como canvases separados. */
  async function fatiarFolha(url, meta) {
    const bmp = await carregarBitmap(url); const fw = meta.largura_quadro, fh = meta.altura_quadro;
    const cols = meta.colunas || meta.quadros; const qs = [];
    for (let k = 0; k < meta.quadros; k++) {
      const c = canvas(fw, fh); c.getContext('2d').drawImage(bmp, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh, 0, 0, fw, fh); qs.push(c);
    }
    return qs;
  }
  function canvasParaNucleo(c) { const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height); return N.deBytes(c.width, c.height, d.data); }
  function juntarFolha(quadros) {
    const fw = quadros[0].width, fh = quadros[0].height; const c = canvas(fw * quadros.length, fh); const g = c.getContext('2d');
    quadros.forEach((q, k) => g.drawImage(q, k * fw, 0)); return c;
  }
  return { canvas, carregarBitmap, paraNucleo, bytesParaCanvas, nucleoParaCanvas, canvasParaPNG, fatiarFolha, canvasParaNucleo, juntarFolha };
})();
