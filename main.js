const path = require('path')
const { app, ipcMain } = require('electron')
const env = process.env.NODE_ENV || 'development';
const Window = require('./Window')
const DataStore = require('./DataStore');
const fs = require('fs');

const dataName = 'RecipesMain'
const recipesData = new DataStore({name: dataName})
const dataPath = path.join(app.getPath('appData'), app.getName(), 'RecipesMain.JSON');
console.log(dataPath)

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

  // Once the main window is displayed, send the list of recipes to
  // the renderer
  mainWindow.once('show', () => {
  })



  ipcMain.on('save-recipe', (event, recipe) => {
    const updatedRecipes = recipesData.addRecipe(recipe)
    const titles = updatedRecipes.getRecipes().parseTitles()
    mainWindow.send('recipe-titles', titles)
  });
}

app.on('ready', main)

app.on('window-all-closed', function () {
  if (fs.existsSync(dataPath)) {
      fs.unlink(dataPath, (err) => {
          if (err) {
              console.log(err);
              return;
          }
          console.log("File succesfully deleted");
      });
  } else {
      console.log("This file doesn't exist, cannot delete");
  }

  app.quit()
})