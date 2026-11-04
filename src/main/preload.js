const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petWindow', {
  getSettings: () => ipcRenderer.invoke('pet:get-settings'),
  mouseOverPet: () => ipcRenderer.send('pet:mouse-over'),
  mouseOutPet: () => ipcRenderer.send('pet:mouse-out'),
  startDrag: (point) => ipcRenderer.send('pet:drag-start', point),
  moveDrag: (point) => ipcRenderer.send('pet:drag-move', point),
  endDrag: (point) => ipcRenderer.send('pet:drag-end', point),
  onStateChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('pet:state-changed', listener);
    return () => ipcRenderer.removeListener('pet:state-changed', listener);
  },
  onSettingsChanged: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on('pet:settings-changed', listener);
    return () => ipcRenderer.removeListener('pet:settings-changed', listener);
  },
});
