const path = require('path')
const { app, dialog, ipcMain, Menu, MenuItem } = require('electron')
const env = process.env.NODE_ENV || 'development';
const Window = require('./Window')
const DataStore = require('./DataStore');
const TagsStore = require('./TagsStore');
const fs = require('fs');
const SearchIndex = require('./SearchIndex');

// Recipe storage
const dataName = 'RecipesMain'
var recipesData = new DataStore({name: dataName})
const dataPath = path.join(app.getPath('appData'), app.getName(), 'RecipesMain.JSON');

// Tag storage
const tagsName = 'TagsMain'
var tagsData = new TagsStore({name: tagsName})
const tagsPath = path.join(app.getPath('appData'), app.getName(), 'TagsMain.JSON');

// Search engine
const searchIndex = new SearchIndex(recipesData)

//// Menu
//const menu = new Menu()
//menu.append(new MenuItem({
//  label: 'Save',
//  accelerator: 'CmdOrCtrl+S',
//  click: () => {console.log('this')}
//}))
//
//Menu.setApplicationMenu(menu)

if (env === 'development') { 
    try { 
      require('electron-reload')(__dirname); 
    } catch (_) { console.log(_); }     
} 

function selectRecipe(window, recipe) {
  window.send('render-delta', recipe['delta']) 
  window.send('render-tags', recipe['tags']) 
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

    // TODO what if there are no recipes?
    selectRecipe(mainWindow, recipesData.recipes[0])
    tagsData.organizeTags(recipesData.recipes)
  })

  ipcMain.on('delete-recipe', (event, title) => {
    const options = {
      buttons: ['Yes', 'No', 'Cancel'],
      message: 'Do you really want to delete?'
    }

    dialog.showMessageBox(options).then((data) => {
      if(data.response == 0) {
        recipesData = recipesData.deleteRecipe(title)    
        const titles = recipesData.getRecipes().parseTitles()
        mainWindow.send('update-titles', titles)

        // Load the first recipe
        const first_recipe = recipesData.recipes[0]
        // FIXME what if there are no recipes?
        selectRecipe(mainWindow, first_recipe)
      }
    })
  })

  ipcMain.on('save-recipe', (event, recipe) => {
    recpiesData = recipesData.addRecipe(recipe)
    const titles = recipesData.getRecipes().parseTitles()

    // Update the titles in the navbar
    mainWindow.send('update-titles', titles, recipe['title'])

    // Update the tagsData
    tagsData.updateTags(recipe)

  });


  ipcMain.on('load-recipe', (event, title) => {
    // When a recipeis lodaed we render the delta in the editor,
    // update the title bar, and highlight the selected recipe in the navbar
    const titles = recipesData.getRecipes().parseTitles()
    const recipe = recipesData.getRecipe(title)
    selectRecipe(mainWindow, recipe)
  })

  ipcMain.on('get-recipe-titles', (event) => {
    const titles = recipesData.getRecipes().parseTitles()
    mainWindow.send('update-titles', titles)
  })

  ipcMain.on('update-search', (event, query) => {
    if(query == '') {
      // the content bar is blank, just send the main titles
      const titles = recipesData.getRecipes().parseTitles()
      mainWindow.send('update-titles', titles)
    } else {
      const result = searchIndex.index.search(query, { expand: true })

      var matched_titles = []
      result.forEach(res => {
        // titles is listed is stored as 'ref' in the searchIndex
        matched_titles.push(res['ref'])
      })
      mainWindow.send('update-titles', matched_titles)
    }
  })


  ipcMain.on('get-tags-nav', (event) => {
    mainWindow.send('update-tags-nav', tagsData.tags)
  })

  ipcMain.on('get-tag-recipe-list', (event, tag) => {
    mainWindow.send('tag-recipe-list', tagsData.tags[tag])
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