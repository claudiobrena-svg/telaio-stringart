const { app, BrowserWindow, Menu, shell, net, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Aggiornamento automatico: all'avvio l'app scarica la pagina più recente da config.updateUrl.
// Se è una versione più nuova la salva nella cartella dati dell'utente e la usa al posto di quella inclusa.
const BUNDLED = path.join(__dirname, 'index.html');
const CACHE_DIR = path.join(app.getPath('userData'), 'aggiornamento');
const CACHE = path.join(CACHE_DIR, 'index.html');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch { return {}; }
}
function versionOf(html) {
  const m = /<meta name="telaio-version" content="([\d.]+)"/.exec(html || '');
  return m ? m[1] : null;
}
function newer(a, b) {            // true se la versione a è più recente di b
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0;
  }
  return false;
}
function isValidPage(html) {
  return typeof html === 'string' && html.length > 20000 &&
    html.includes('<title>Telaio String Art</title>') && versionOf(html) !== null;
}
function readPage(file) {
  try { const html = fs.readFileSync(file, 'utf8'); return isValidPage(html) ? html : null; } catch { return null; }
}
function currentPage() {
  const bundled = readPage(BUNDLED), cached = readPage(CACHE);
  const bv = versionOf(bundled) || '0';
  if (cached && newer(versionOf(cached), bv)) return { file: CACHE, version: versionOf(cached) };
  return { file: BUNDLED, version: bv };
}

async function checkForUpdate(win, running) {
  const url = readConfig().updateUrl;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await net.fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) return;
    const html = await res.text();
    if (!isValidPage(html)) return;
    const v = versionOf(html);
    if (!newer(v, running.version)) return;
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE + '.tmp', html, 'utf8');
    fs.renameSync(CACHE + '.tmp', CACHE);
    if (process.env.TELAIO_TEST) { console.log('UPDATED_TO ' + v); return; }
    const { response } = await dialog.showMessageBox(win, {
      type: 'info', buttons: ['Aggiorna ora', 'Più tardi'], defaultId: 0, cancelId: 1,
      title: 'Aggiornamento disponibile',
      message: `È pronta la versione ${v} di Telaio String Art.`,
      detail: 'L\'aggiornamento è già stato scaricato. Se scegli "Più tardi" verrà usato al prossimo avvio. Salva il progetto prima di aggiornare, se ci stai lavorando.'
    });
    if (response === 0) win.loadFile(CACHE);
  } catch (e) {
    // senza internet o con il link non raggiungibile si continua con la versione già presente
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 950, minWidth: 900, minHeight: 600,
    title: 'Telaio String Art', backgroundColor: '#f6f5f2',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  const page = currentPage();
  win.loadFile(page.file);
  win.webContents.once('did-finish-load', () => checkForUpdate(win, page));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
