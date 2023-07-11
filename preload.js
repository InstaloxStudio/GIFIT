const { contextBridge, ipcRenderer } = require('electron');
//const GIFEncoder = require('gifencoder');


contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  openFile: async () => {
    const result = await ipcRenderer.invoke('open-file');
    return result.filePaths;
  },
  saveFile: async (imagePaths, frameDelay) => {
    const result = await ipcRenderer.invoke('save-file', imagePaths, frameDelay);
    return result.filePath;
  },
  saveWebP: async (imagePaths, frameDelay) => {
    const result = await ipcRenderer.invoke('save-webp', imagePaths, frameDelay);
    return result.filePath;
  },
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress', (event, progress) => callback(progress));
  }

});
