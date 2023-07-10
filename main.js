const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const sharp = require('sharp');
const pipeline = require('stream');
const Jimp = require('jimp');

let mainWindow;
const createWindow = () => {

  // Create the browser window.
    mainWindow = new BrowserWindow({
    width: 400,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Set to false since we bundled renderer code with webpack
      contextIsolation: true,
      enableRemoteModule: false,
      preload: __dirname + '/preload.js',
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
};

ipcMain.handle('save-file', async (event, filePaths, frameDelay) => {
  console.log('save-file');
  try {
    // show save file dialog
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'GIF', extensions: ['gif'] }],
    });

    if (result.canceled) {
      console.log('user canceled');
      return null;
    }
    if (result.filePath === '') {
      console.log('no file path');
      return null;
    }
    console.log("save file filepath is: "+result.filePath);

    const filePath = result.filePath;

    // create gif
    const gifCreated = await createGIF(filePaths,filePath, frameDelay, mainWindow);
    mainWindow.webContents.send('mainprocess-response', 'done');
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
});

async function createGIF(filePaths, filePath, frameDelay, mainWindow) {
  const firstImagePath = filePaths[0];
  const firstImage = await Jimp.read(firstImagePath);
  const width = firstImage.bitmap.width;
  const height = firstImage.bitmap.height;

  const gif = new GIFEncoder(width, height);
  gif.setRepeat(0);  // 0 for repeat, -1 for no-repeat
  gif.setDelay(frameDelay); // frame delay in ms
  gif.start();

  const stream = gif.createReadStream();
  stream.pipe(fs.createWriteStream(filePath));

  for (let i = 0; i < filePaths.length; i++) {
    const imagePath = filePaths[i];
    const image = await Jimp.read(imagePath);
    image.resize(width, height);
    const imageData = image.bitmap.data; // Here we get raw pixel data
    gif.addFrame(imageData);
    let progress = filePaths.length > 1 ? i / (filePaths.length - 1) : 1;
    mainWindow.webContents.send('progress', progress);
  }

  gif.finish();
  return true;
}

ipcMain.on('request-mainprocess-action', (event, arg) => {
  console.log("request-mainprocess-action");
  console.log(arg);
  //creategif(arg).then(() =>{
  mainWindow.webContents.send('mainprocess-response', 'done');
});

ipcMain.handle('open-file', async (event) => {
  console.log('open-file');
  // show open file dialog and select multiple files
  const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
  if (result.canceled) {
    console.log('user canceled');
    return;
  }
  if (result.filePaths.length === 0) {
    console.log('no files selected');
    return;
  }
  console.log("open file paths: "+result.filePaths);
  return result;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
