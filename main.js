const path = require('path')
const { app, ipcMain } = require('electron')
const env = process.env.NODE_ENV || 'development';
const Window = require('./Window')
const DataStore = require('./DataStore');
const fs = require('fs');

const dataName = 'RecipesMain'
var recipesData = new DataStore({name: dataName})
const dataPath = path.join(app.getPath('appData'), app.getName(), 'RecipesMain.JSON');

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
    const titles = recipesData.getRecipes().parseTitles()
    mainWindow.send('recipe-titles', titles)
  })

  ipcMain.on('delete-recipe', (event, recipe) => {
    
  })

  ipcMain.on('save-recipe', (event, recipe) => {
    recpiesdata = recipesData.addRecipe(recipe)
    const titles = recipesData.getRecipes().parseTitles()

    // Update the titles in the navbar
    mainWindow.send('recipe-titles', titles)
  });


  ipcMain.on('load-recipe', (event, key) => {
    // When a recipeis lodaed we render the delta in the editor,
    // update the title bar, and highlight the selected recipe in the navbar
    const recipe = recipesData.getRecipe(key)
    mainWindow.send('render-delta', recipe['delta'])
    mainWindow.send('update-title-bar', recipe['title'])
    mainWindow.send('highlight-title', recipe['title'])
  })

}

app.on('ready', main)

app.on('window-all-closed', function () {
  //if (fs.existsSync(dataPath)) {
  //    fs.unlink(dataPath, (err) => {
  //        if (err) {
  //            console.log(err);
  //            return;
  //        }
  //        console.log("File succesfully deleted");
  //    });
  //} else {
  //    console.log("This file doesn't exist, cannot delete");
  //}

  app.quit()
})