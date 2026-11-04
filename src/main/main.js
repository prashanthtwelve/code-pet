const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  powerMonitor,
  screen,
  Tray,
} = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createStateMachine } = require('./state');
const { createEventServer } = require('./event-server');
const { createSleepWatcher } = require('./sleep-watcher');
const { loadConfig, saveConfig } = require('./config');
const { scanPets } = require('./pet-catalog');
const { restorePosition, dragPosition, isPointOverPet } = require('./window-position');
const { getUserDataDirectory } = require('./user-data-path');
const { createGhostTrayPng } = require('./tray-icon');

const WINDOW_SIZE = 200;
let config;
let configPath;
let petWindow;
let tray;
let stateMachine;
let eventServer;
let sleepWatcher;
let positionSaveTimer;
let selectedPet;
let availablePets = [];
let paused = false;
let dragOrigin;

function persistConfig() {
  if (configPath && config) saveConfig(configPath, config);
}

function sendSettings() {
  if (!petWindow || petWindow.isDestroyed() || !selectedPet) return;
  petWindow.webContents.send('pet:settings-changed', {
    petName: config.petName,
    spriteBaseUrl: pathToFileURL(`${selectedPet.directory}${path.sep}`).href,
  });
}

function choosePet(pet) {
  selectedPet = pet;
  config.selectedPet = pet.key;
  config.petName = pet.name;
  persistConfig();
  sendSettings();
  tray.setToolTip(config.petName);
  buildTrayMenu();
}

function buildTrayMenu() {
  if (!tray) return;
  const petOptions = availablePets.length
    ? availablePets.map((pet) => ({
      label: `${pet.name} (${pet.source})`,
      type: 'radio',
      checked: selectedPet?.directory === pet.directory,
      click: () => choosePet(pet),
    }))
    : [{ label: 'No pets found', enabled: false }];

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: paused ? 'Resume' : 'Pause', click: togglePause },
    { label: 'Choose Pet', submenu: petOptions },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
}

function togglePause() {
  paused = !paused;
  if (petWindow && !petWindow.isDestroyed()) {
    if (paused) petWindow.hide();
    else petWindow.show();
  }
  buildTrayMenu();
}

function persistWindowPosition() {
  if (positionSaveTimer) clearTimeout(positionSaveTimer);
  positionSaveTimer = setTimeout(() => {
    positionSaveTimer = undefined;
    if (petWindow && !petWindow.isDestroyed()) {
      const [x, y] = petWindow.getPosition();
      config.position = { x, y };
      persistConfig();
    }
  }, 250);
}

function createWindow() {
  const savedPosition = config.position;
  const display = savedPosition
    ? screen.getDisplayMatching({ ...savedPosition, width: WINDOW_SIZE, height: WINDOW_SIZE })
    : screen.getPrimaryDisplay();
  const position = restorePosition(savedPosition, display.workArea, WINDOW_SIZE);

  petWindow = new BrowserWindow({
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    ...position,
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

  petWindow.on('move', persistWindowPosition);
  petWindow.webContents.once('did-finish-load', sendSettings);
  petWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.platform !== 'linux') {
    petWindow.setIgnoreMouseEvents(true, { forward: true });
  }
}

function createTray() {
  const image = nativeImage.createFromBuffer(createGhostTrayPng());
  tray = new Tray(image);
  tray.setToolTip(config.petName);
  buildTrayMenu();
}

function createPetCatalog() {
  const appPets = path.resolve(__dirname, '../../assets/pets');
  const userPets = path.join(app.getPath('userData'), 'pets');
  availablePets = scanPets([
    { directory: appPets, source: 'Built-in' },
    { directory: userPets, source: 'User' },
  ]);
  selectedPet = availablePets.find((pet) => pet.key === config.selectedPet || pet.name === config.selectedPet)
    || availablePets.find((pet) => pet.name === 'ghost')
    || availablePets[0];
  if (selectedPet && config.selectedPet !== selectedPet.key) {
    config.selectedPet = selectedPet.key;
    persistConfig();
  }
}

function setupWindowIpc() {
  ipcMain.handle('pet:get-settings', () => ({
    state: stateMachine.getState(),
    petName: config.petName,
    spriteBaseUrl: selectedPet ? pathToFileURL(`${selectedPet.directory}${path.sep}`).href : '',
  }));

  ipcMain.on('pet:mouse-over', () => {
    if (!paused && process.platform !== 'linux' && petWindow && !petWindow.isDestroyed()) {
      petWindow.setIgnoreMouseEvents(false);
    }
  });
  ipcMain.on('pet:mouse-out', () => {
    if (!paused && process.platform !== 'linux' && !dragOrigin && petWindow && !petWindow.isDestroyed()) {
      petWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });
  ipcMain.on('pet:drag-start', (event, point) => {
    if (paused || !petWindow || petWindow.isDestroyed()) return;
    dragOrigin = { pointer: point, position: petWindow.getPosition() };
    if (process.platform !== 'linux') petWindow.setIgnoreMouseEvents(false);
  });
  ipcMain.on('pet:drag-move', (event, point) => {
    if (!dragOrigin || !petWindow || petWindow.isDestroyed()) return;
    const position = dragPosition({
      position: { x: dragOrigin.position[0], y: dragOrigin.position[1] },
      pointer: dragOrigin.pointer,
    }, point);
    petWindow.setPosition(position.x, position.y);
  });
  ipcMain.on('pet:drag-end', (event, point) => {
    dragOrigin = undefined;
    if (process.platform !== 'linux' && !paused && petWindow && !petWindow.isDestroyed()) {
      const cursor = point || screen.getCursorScreenPoint();
      const bounds = petWindow.getBounds();
      const insidePet = isPointOverPet(cursor, bounds);
      petWindow.setIgnoreMouseEvents(!insidePet, { forward: true });
    }
  });
}

app.whenReady().then(() => {
  const userDataDirectory = getUserDataDirectory();
  require('node:fs').mkdirSync(userDataDirectory, { recursive: true });
  app.setPath('userData', userDataDirectory);
  configPath = path.join(userDataDirectory, 'config.json');
  config = loadConfig(configPath);
  createPetCatalog();
  persistConfig();
  stateMachine = createStateMachine({
    duration: config.reactionDurationMs,
    onChange: (state) => {
      if (petWindow && !petWindow.isDestroyed()) {
        petWindow.webContents.send('pet:state-changed', state);
      }
    },
  });
  setupWindowIpc();
  createWindow();
  createTray();

  eventServer = createEventServer(stateMachine, { port: config.port });
  eventServer.on('error', (error) => console.error('Event server error:', error));
  const environmentThreshold = Number(process.env.CODE_PET_IDLE_THRESHOLD_SECONDS);
  sleepWatcher = createSleepWatcher({
    getIdleTime: () => powerMonitor.getSystemIdleTime(),
    thresholdSeconds: Number.isFinite(environmentThreshold) && environmentThreshold > 0
      ? environmentThreshold
      : config.idleThresholdSeconds,
    onSleep: () => stateMachine.setState('sleep'),
    onWake: () => stateMachine.setState('waking', { temporary: true, duration: 2000 }),
  });
  sleepWatcher.start();
});

app.on('before-quit', () => {
  if (positionSaveTimer) clearTimeout(positionSaveTimer);
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition();
    config.position = { x, y };
  }
  persistConfig();
  if (stateMachine) stateMachine.dispose();
  if (sleepWatcher) sleepWatcher.stop();
  if (eventServer) eventServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
