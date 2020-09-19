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

// Sends the recipe titles to the renderer
// TODO this could be made part of the mainWindow methods...
function send_titles(mainWindow) {
  // Parse the json files for their titles...
  storage.getAll(function(error, data){
    //data is an object containing key/value pairs
    // TODO there is a way to make this look more elegant...
    var titles = [];
    for(var key in data){
      titles.push(data[key]['title'])
    }
    mainWindow.webContents.send('recipe-titles', titles)
  })
}

function main () {
  let mainWindow = new Window({
    file: path.join('renderer', 'index.html')
  })

  mainWindow.webContents.openDevTools()

  // Once the main window is displayed, send the list of recipes to
  // the renderer
  mainWindow.once('show', () => {
    send_titles(mainWindow)
  })

  ipcMain.on('save-delta', (event, data) => {
    var key = data['key']
    delete data.key //remove the key
    
    storage.set(key, data, function( error ) {
      if(error) throw error;
    })

    // FIXME I think this is some asynchronous problem, we have to somehow
    // wait for storage.set to happen, then send the titles. how?
    send_titles(mainWindow)

  });
}

app.on('ready', main)

app.on('window-all-closed', function () {
  app.quit()
})