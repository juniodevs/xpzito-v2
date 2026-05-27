import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { TimerStore } from './timerStore';
import {
  initMediaHandler,
  createMediaDirs,
  getAudioLibrary,
  getBotLibrary,
  uploadSprite,
  uploadTransition,
  uploadRandomAudios,
  deleteSprite,
  deleteTransition,
  deleteRandomAudio
} from './mediaHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let configWindow: BrowserWindow | null = null;

const timerStore = new TimerStore();

const DIST = path.join(__dirname, '../..');
const DIST_REACT = path.join(DIST, 'dist-react');
const PRELOAD = path.join(DIST, 'dist-electron', 'preload', 'index.mjs');
const INDEX_HTML = path.join(DIST_REACT, 'index.html');

const isDev = !app.isPackaged;
const APP_DIR = isDev
  ? process.cwd()
  : path.dirname(app.getPath('exe'));

if (!isDev) {
  app.setPath('userData', path.join(APP_DIR, 'userdata'));
}

const MEDIA_DIR = path.join(APP_DIR, 'media');
const LOCAL_PORT = 4005;

// Initialise the media handler with resolved paths
initMediaHandler(MEDIA_DIR, LOCAL_PORT);

let wss: WebSocketServer | null = null;

function startLocalServer() {
  const serverApp = express();
  serverApp.use(cors());

  serverApp.use('/media', express.static(MEDIA_DIR));

  const reactDistPath = path.join(__dirname, '../../dist-react');
  serverApp.use(express.static(reactDistPath));

  serverApp.get('/api/audioLibrary', async (_req, res) => {
    res.json(await getAudioLibrary());
  });

  serverApp.get('/api/botLibrary', async (_req, res) => {
    res.json(await getBotLibrary());
  });

  const server = createServer(serverApp);
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ channel: 'timer:sync', payload: timerStore.getState() }));
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.channel === 'timer:ack-trigger') {
          timerStore.acknowledgeTrigger();
        } else if (data.channel === 'timer:test') {
          broadcast('timer:preview', null);
        }
      } catch (e) {}
    });
  });

  server.listen(LOCAL_PORT, () => {
    console.log(`[LocalServer] Servindo mídias e WebSockets na porta ${LOCAL_PORT}`);
  });
}

app.whenReady().then(async () => {
  await createMediaDirs();

  startLocalServer();

  createConfigWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createConfigWindow();
    }
  });

  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    title: 'XPzito - Control Panel',
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  configWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  configWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    configWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#/config');
  } else {
    configWindow.loadFile(INDEX_HTML, { hash: '/config' });
  }
}

function broadcast(channel: string, ...args: any[]) {
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.webContents.send(channel, ...args);
  }

  if (wss) {
    const msg = JSON.stringify({ channel, args });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(msg);
      }
    });
  }
}

function setupIpcHandlers() {
  ipcMain.on('timer:test', () => {
    console.log('[Main] Test event triggered! Broadcasting preview...');
    broadcast('timer:preview', null);
  });

  ipcMain.handle('timer:start', (_, payload: { durationSeconds: number }) => {
    timerStore.start(payload.durationSeconds);
    return timerStore.getState();
  });

  ipcMain.handle('timer:cancel', () => {
    timerStore.cancel();
    return timerStore.getState();
  });

  ipcMain.handle('timer:pause', () => {
    timerStore.pause();
    return timerStore.getState();
  });

  ipcMain.handle('timer:resume', () => {
    timerStore.resume();
    return timerStore.getState();
  });

  ipcMain.handle('timer:ack-trigger', () => {
    timerStore.acknowledgeTrigger();
    return timerStore.getState();
  });

  ipcMain.handle('timer:viewer-preferences', (_, payload) => {
    timerStore.updateViewerPreferences(payload);
    return timerStore.getState();
  });

  ipcMain.handle('timer:status', () => {
    return timerStore.getState();
  });

  timerStore.on('timer:update', (state) => {
    broadcast('timer:update', state);
  });

  timerStore.on('timer:trigger', () => {
    broadcast('timer:finished');
  });

  // ─── Media IPC handlers ───────────────────────────────────────────────────

  ipcMain.handle('media:audioLibrary', async () => getAudioLibrary());

  ipcMain.handle('media:botLibrary', async () => getBotLibrary());

  ipcMain.handle('media:uploadSprite', async (_, { variant, fileName, buffer }) =>
    uploadSprite(variant, fileName, buffer)
  );

  ipcMain.handle('media:uploadTransition', async (_, { direction, fileName, buffer }) =>
    uploadTransition(direction, fileName, buffer)
  );

  ipcMain.handle('media:uploadRandomAudios', async (_, { filesData }) =>
    uploadRandomAudios(filesData)
  );

  ipcMain.handle('media:deleteSprite', async (_, { variant }) =>
    deleteSprite(variant)
  );

  ipcMain.handle('media:deleteTransition', async (_, { direction }) =>
    deleteTransition(direction)
  );

  ipcMain.handle('media:deleteRandomAudio', async (_, { fileName }) =>
    deleteRandomAudio(fileName)
  );
}
