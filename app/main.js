'use strict';
// Estúdio Defenda e Ataque — processo principal (Electron).
// Serve o aplicativo pelo protocolo estudio:// (assim fetch, workers e módulos funcionam sem servidor)
// e dá acesso seguro a duas pastas: a do projeto do Estúdio (Documentos) e a pasta do jogo escolhida pelo usuário.
const { app, BrowserWindow, protocol, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'estudio', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
]);

// o nome do app tem acento (Estúdio) e vai no User-Agent; cabeçalho HTTP não aceita acento -> versão sem acento
app.userAgentFallback = app.userAgentFallback.normalize('NFD').replace(/[^\x20-\x7E]/g, '');

const RAIZ_APP = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8',
};
const raizDados = () => path.join(app.getPath('documents'), 'Estúdio Defenda e Ataque');
const arqConfig = () => path.join(app.getPath('userData'), 'config.json');
function config() { try { return JSON.parse(fs.readFileSync(arqConfig(), 'utf8')); } catch { return {}; } }
function salvarConfig(c) { fs.mkdirSync(path.dirname(arqConfig()), { recursive: true }); fs.writeFileSync(arqConfig(), JSON.stringify(c, null, 1)); }

// impede sair da pasta permitida com "..", caminhos absolutos etc.
function dentro(raiz, rel) {
  const alvo = path.resolve(raiz, String(rel || '').replace(/^[/\\]+/, ''));
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) throw new Error('Caminho fora da pasta permitida: ' + rel);
  return alvo;
}
function listar(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listar(p, base) : [{ caminho: path.relative(base, p).split(path.sep).join('/'), tamanho: fs.statSync(p).size }];
  });
}

function registrarIPC() {
  ipcMain.handle('dados:raiz', () => raizDados());
  ipcMain.handle('dados:listar', (_e, rel) => listar(dentro(raizDados(), rel || '')));
  ipcMain.handle('dados:ler', (_e, rel) => { const p = dentro(raizDados(), rel); return fs.existsSync(p) ? fs.readFileSync(p) : null; });
  ipcMain.handle('dados:gravar', (_e, rel, bytes) => { const p = dentro(raizDados(), rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(bytes)); return true; });
  ipcMain.handle('dados:apagar', (_e, rel) => {
    // "apagar" manda para a lixeira do Windows (dá para recuperar)
    const p = dentro(raizDados(), rel); if (fs.existsSync(p)) return shell.trashItem(p).then(() => true); return false;
  });
  ipcMain.handle('dados:abrirPasta', (_e, rel) => { const p = dentro(raizDados(), rel || ''); fs.mkdirSync(p, { recursive: true }); return shell.openPath(p); });
  ipcMain.handle('jogo:pasta', () => config().pastaJogo || null);
  ipcMain.handle('jogo:escolher', async () => {
    const r = await dialog.showOpenDialog({ title: 'Escolha a pasta do jogo (onde está o project.godot)', properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null;
    const c = config(); c.pastaJogo = r.filePaths[0]; salvarConfig(c); return c.pastaJogo;
  });
  ipcMain.handle('jogo:gravar', (_e, rel, bytes) => {
    const raiz = config().pastaJogo; if (!raiz) throw new Error('Escolha a pasta do jogo primeiro.');
    const p = dentro(raiz, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    // guarda o arquivo anterior como .bak (preservar originais)
    if (fs.existsSync(p) && !fs.existsSync(p + '.bak')) fs.copyFileSync(p, p + '.bak');
    fs.writeFileSync(p, Buffer.from(bytes)); return p;
  });
  ipcMain.handle('jogo:ler', (_e, rel) => { const raiz = config().pastaJogo; if (!raiz) return null; const p = dentro(raiz, rel); return fs.existsSync(p) ? fs.readFileSync(p) : null; });
  ipcMain.handle('jogo:listar', (_e, rel) => { const raiz = config().pastaJogo; if (!raiz) return []; return listar(dentro(raiz, rel || '')); });
}

function criarJanela() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 640, backgroundColor: '#11131a',
    title: 'Estúdio Defenda e Ataque', icon: path.join(RAIZ_APP, 'icone.png'),
    webPreferences: { preload: path.join(RAIZ_APP, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadURL('estudio://app/index.html');
  // links externos abrem no navegador do sistema
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith('estudio://')) shell.openExternal(url); return { action: url.startsWith('estudio://') ? 'allow' : 'deny' }; });
  return win;
}

app.whenReady().then(() => {
  protocol.handle('estudio', req => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname);
    let arq;
    try {
      if (u.host === 'app') arq = dentro(RAIZ_APP, rel);
      else if (u.host === 'dados') arq = dentro(raizDados(), rel);
      else if (u.host === 'jogo' && config().pastaJogo) arq = dentro(config().pastaJogo, rel);
      else return new Response('não encontrado', { status: 404 });
    } catch { return new Response('proibido', { status: 403 }); }
    if (!fs.existsSync(arq) || fs.statSync(arq).isDirectory()) return new Response('não encontrado', { status: 404 });
    const tipo = TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream';
    return new Response(fs.readFileSync(arq), { status: 200, headers: { 'content-type': tipo, 'cache-control': 'no-cache' } });
  });
  registrarIPC();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Arquivo', submenu: [
      { label: 'Abrir pasta dos personagens', click: () => { fs.mkdirSync(raizDados(), { recursive: true }); shell.openPath(raizDados()); } },
      { type: 'separator' }, { role: 'quit', label: 'Sair' }] },
    { label: 'Exibir', submenu: [{ role: 'reload', label: 'Recarregar' }, { role: 'togglefullscreen', label: 'Tela cheia' }, { role: 'resetZoom', label: 'Tamanho normal' }, { role: 'zoomIn', label: 'Aumentar' }, { role: 'zoomOut', label: 'Diminuir' }, { type: 'separator' }, { role: 'toggleDevTools', label: 'Ferramentas de desenvolvedor' }] },
    { label: 'Ajuda', submenu: [{ label: 'Repositório no GitHub', click: () => shell.openExternal('https://github.com/LSamuelS0/estudio-defenda-e-ataque') }] },
  ]));
  const win = criarJanela();
  if (process.env.ESTUDIO_AUTOTESTE) autoteste(win, process.env.ESTUDIO_AUTOTESTE);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});

// Teste de fumaça do aplicativo de verdade (usado no GitHub): abre as telas principais,
// espera a conferência do mago terminar e grava o resultado num JSON.
async function autoteste(win, saida) {
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const r = { ok: false, etapas: [] };
  const ir = async url => { await win.loadURL(url); await esperar(1500); };
  const js = c => win.webContents.executeJavaScript(c);
  try {
    await ir('estudio://app/index.html');
    r.etapas.push({ tela: 'inicio', personagens: await js('document.querySelectorAll(".personagem").length'), desktop: await js('!!window.estudioDesktop') });
    await ir('estudio://app/personagem.html?id=mago');
    let conf = ''; for (let i = 0; i < 60 && !/Sem serrilhado/.test(conf); i++) { await esperar(500); conf = await js('document.querySelector("#conf-ver").innerText'); }
    r.etapas.push({ tela: 'personagem', conferencia: conf.split('\n').filter(l => /^[✔✘]/.test(l.trim())).length || (conf.match(/Sem serrilhado|Firme|Loop|movimento|Ritmo|fundo|Volume/g) || []).length });
    await js('document.querySelector("[data-aba=rig]").click()'); let pts = 0;
    for (let i = 0; i < 60 && !pts; i++) { await esperar(500); pts = await js('document.querySelectorAll("#rig-lista [data-l]").length'); }
    r.etapas.push({ tela: 'rig', pontos: pts });
    await js('document.querySelector("#rig-salvar").click()'); await esperar(1500);
    r.etapas.push({ tela: 'rig-salvo', arquivo: fs.existsSync(path.join(raizDados(), 'personagens', 'mago', 'personagem.json')) });
    await ir('estudio://app/ferramentas/index.html#movimento'); await esperar(2500);
    const img = await win.webContents.capturePage(); fs.writeFileSync(saida.replace(/\.json$/, '') + '.png', img.toPNG());
    r.ok = r.etapas[0].desktop && r.etapas[1].conferencia >= 7 && r.etapas[2].pontos >= 15 && r.etapas[3].arquivo;
  } catch (e) { r.erro = String(e && e.stack || e); }
  fs.writeFileSync(saida, JSON.stringify(r, null, 1)); app.exit(r.ok ? 0 : 1);
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
