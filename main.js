const path = require('path')
const { app, ipcMain } = require('electron')
const env = process.env.NODE_ENV || 'development';
const Window = require('./Window')
const DataStore = require('./DataStore');
const fs = require('fs');
const SearchIndex = require('./SearchIndex');

// Data storage
const dataName = 'RecipesMain'
var recipesData = new DataStore({name: dataName})
const dataPath = path.join(app.getPath('appData'), app.getName(), 'RecipesMain.JSON');

// Search engine
const searchIndex = new SearchIndex(recipesData)

if (env === 'development') { 
    try { 
      require('electron-reload')(__dirname); 
    } catch (_) { console.log(_); }     
} 

function selectRecipe(window, titles, recipe) {
    window.send('update-titles', titles, recipe['title'])
    window.send('render-delta', recipe['delta']) 
    window.send('update-title-bar', recipe['title'])
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
    mainWindow.send('update-titles', titles)
  })

  ipcMain.on('delete-recipe', (event, title) => {
    recipesData = recipesData.deleteRecipe(title)    
    const titles = recipesData.getRecipes().parseTitles()
    mainWindow.send('update-titles', titles)

    // Load the first recipe
    const first_recipe = recipesData.recipes[0]
    // FIXME what if there are no recipes?
    selectRecipe(mainWindow, titles, first_recipe)
  })

  ipcMain.on('save-recipe', (event, recipe) => {
    recpiesData = recipesData.addRecipe(recipe)
    const titles = recipesData.getRecipes().parseTitles()

    // Update the titles in the navbar
    mainWindow.send('update-titles', titles)
  });


  ipcMain.on('load-recipe', (event, title) => {
    // When a recipeis lodaed we render the delta in the editor,
    // update the title bar, and highlight the selected recipe in the navbar
    const titles = recipesData.getRecipes().parseTitles()
    const recipe = recipesData.getRecipe(title)
    selectRecipe(mainWindow, titles, recipe)
  })

  ipcMain.on('update-search', (event, query) => {
    const result = searchIndex.index.search(query, {
      expand: true
    })

    var matched_titles = []
    result.forEach(res => {
      // titles is listed is stored as 'ref' in the searchIndex
      matched_titles.push(res['ref'])
    })

    mainWindow.send('update-titles', matched_titles)
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