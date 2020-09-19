const path = require('path')
const { app, ipcMain } = require('electron')
const env = process.env.NODE_ENV || 'development';

const Window = require('./Window')
const storage = require('electron-json-storage')

storage.setDataPath(path.join(__dirname, 'data'))


if (env === 'development') { 
    try { 
      require('electron-reload')(__dirname); 
    } catch (_) { console.log(_); }     
} 

function main () {
  let mainWindow = new Window({
    file: path.join('renderer', 'index.html')
  })

  mainWindow.webContents.openDevTools()

  ipcMain.on('save-delta', (event, data) => {
    storage.set(data['key'], data['delta'], function( error ) {
      if(error) throw error;
    })
  });
}

app.on('ready', main)

app.on('window-all-closed', function () {
  app.quit()
})