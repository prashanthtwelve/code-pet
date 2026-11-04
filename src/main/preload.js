const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petWindow', {
  mouseOverPet: () => ipcRenderer.send('pet:mouse-over'),
  mouseOutPet: () => ipcRenderer.send('pet:mouse-out'),
  onStateChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('pet:state-changed', listener);
    return () => ipcRenderer.removeListener('pet:state-changed', listener);
  },
});
