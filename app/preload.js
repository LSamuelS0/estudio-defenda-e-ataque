'use strict';
// Ponte segura entre a interface e o disco (só as funções abaixo ficam visíveis para as páginas).
const { contextBridge, ipcRenderer } = require('electron');
const ch = (nome) => (...a) => ipcRenderer.invoke(nome, ...a);
contextBridge.exposeInMainWorld('estudioDesktop', {
  dados: { raiz: ch('dados:raiz'), listar: ch('dados:listar'), ler: ch('dados:ler'), gravar: ch('dados:gravar'), apagar: ch('dados:apagar'), abrirPasta: ch('dados:abrirPasta') },
  jogo: { pasta: ch('jogo:pasta'), escolher: ch('jogo:escolher'), gravar: ch('jogo:gravar'), ler: ch('jogo:ler'), listar: ch('jogo:listar') },
});
