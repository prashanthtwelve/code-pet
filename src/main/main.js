const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
const { createStateMachine } = require('./state');
const { createEventServer } = require('./event-server');

let petWindow;
const stateMachine = createStateMachine({
  onChange: (state) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('pet:state-changed', state);
    }
  },
});

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  const size = 200;
  petWindow = new BrowserWindow({
    width: size,
    height: size,
    x: x + width - size,
    y: y + height - size,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  petWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.platform !== 'linux') {
    ipcMain.on('pet:mouse-over', () => petWindow.setIgnoreMouseEvents(false));
    ipcMain.on('pet:mouse-out', () => petWindow.setIgnoreMouseEvents(true, { forward: true }));
    petWindow.setIgnoreMouseEvents(true, { forward: true });
  }
}

let eventServer;
app.whenReady().then(() => {
  createWindow();
  eventServer = createEventServer(stateMachine);
  eventServer.on('error', (error) => console.error('Event server error:', error));
});

app.on('before-quit', () => {
  stateMachine.dispose();
  if (eventServer) eventServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
