const path = require('path')
const { app, dialog, ipcMain, screen } = require('electron')
const env = process.env.NODE_ENV || 'development';
const Window = require('./modules/Window')
const RecipeStore = require('./modules/RecipeStore');
const SettingsStore = require('./modules/SettingsStore');
const TagsStore = require('./modules/TagsStore');
const fs = require('fs');
const SearchIndex = require('./modules/SearchIndex');

// Recipe storage
const dataName = 'RecipesMain'
var recipesData = new RecipeStore({name: dataName})

// Tag storage
const tagsName = 'TagsMain'
var tagsData = new TagsStore({name: tagsName})

// Settings storage
const settingsName = 'Settings'
var settingsData = new SettingsStore({name: settingsName})

// Search engine
const searchIndex = new SearchIndex(recipesData)

if (env === 'development') { 
    try { 
      require('electron-reload')(__dirname); 
    } catch (_) { console.log(_); }     
} 

const sortTags = (tags) => {
  var nonDivIxs = []
  var sourceIxs = []
  var seasonIxs = []

  for(const [ix, tag] of Object.entries(tags)){
    if(tag.division == 'division-source') {
      sourceIxs.push(ix)
    } else if (tag.division == 'division-season'){
      seasonIxs.push(ix)
    } else {
      nonDivIxs.push(ix)
    }
  }

  var tagSort = [].concat(sourceIxs, seasonIxs, nonDivIxs)

  var outTags = []
  tagSort.forEach((ix) => (outTags.push(tags[ix])))

  return(outTags)
}

function selectRecipe(window, recipeTitle, sort_tags = true) {
  const recipe = recipesData.recipes[recipeTitle]
  var recipeTags = recipe['tags']

  if(sort_tags) {
    recipeTags = sortTags(recipe.tags)
  }

  settingsData.setSelectedRecipe(recipeTitle)
  window.send('load-recipe', recipe['delta'], recipeTags, recipeTitle, recipe['makeLater'])

  // Refresh the navbar with the new recipeTitle attached
  const recipeList = recipesData.getRecipes().parseTitles()
  window.send('refresh-navbar', recipeTitle, recipeList) 
}

// TODO this is a little redundant, maybe remove and put it back in the save-recipe event
function saveRecipe(recipeTitle, recipe) {
  recpiesData = recipesData.addRecipe(recipeTitle, recipe)

  // Update the tagsData
  tagsData.updateTags(recipe)
}

function main () {
  // Specific to me, this sets up loading on an external monitor
  const displays = screen.getAllDisplays()
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })

  let mainWindow = new Window({
    file: path.join('renderer', 'index.html'),
    x: externalDisplay.bounds.x + 50,
    y: externalDisplay.bounds.y + 50,
  })

  mainWindow.webContents.openDevTools()

  // Once the main window is displayed, send the list of recipes to
  // the renderer
  mainWindow.on('ready-to-show', () => {
    if(recipesData.size() == 0) {
      // No recipe exists, add the template to recipeStore and select
      newRecipe = {
        delta: '',
        tags: []
      }

      recipesData.addRecipe('New Recipe', newRecipe)
      selectRecipe(mainWindow, 'New Recipe')

    } else {
      const recipeList = recipesData.parseTitles()

      // TODO what if there are no recipes?
      mainWindow.send('display-recipe-list',recipeList)

      // TODO reimplement last selected recipe
      const lastRecipeTitle = recipesData.parseTitles()[0]
      selectRecipe(mainWindow, lastRecipeTitle)
      tagsData.organizeTags(recipesData.recipes)
    }
  })

  ipcMain.on('delete-recipe', (event, recipeTitle) => {
    const options = {
      buttons: ['Yes', 'No', 'Cancel'],
      message: 'Do you really want to delete?'
    }

    dialog.showMessageBox(options).then((data) => {
      if(data.response == 0) {
        recipesData = recipesData.deleteRecipe(recipeTitle)    
        mainWindow.send('recipe-deleted', recipeTitle)

        // Load the first recipe
        const firstRecipeTitle = recipesData.parseTitles()[0]
        // FIXME what if there are no recipes?
        selectRecipe(mainWindow, firstRecipeTitle)
      }
    })
  })

  ipcMain.on('save-recipe', (evt, recipeTitle, recipe) => {
    // TODO this is where we can add parts for modifying vs. saving recipes
    saveRecipe(recipeTitle, recipe)
    selectRecipe(mainWindow, recipeTitle)
  });

  ipcMain.on('attempt-load-recipe', (evt, recipeTitle) => {
    mainWindow.send('attempt-load-recipe', recipeTitle)
  })

  ipcMain.on('confirm-leave-recipe', (evt, newRecipeTitle, currentRecipe, loaded) => {
    const res = dialog.showMessageBox(null, {
      type: 'question',
      message: 'You have not saved, are you sure you want to change recipes?',
      buttons: ['Save', 'Proceed without Saving', 'Cancel']
    })

    res.then((returnVal) => {
      const index = returnVal.response
      if        (index == 0) { // Save and continue
        saveRecipe(currentRecipe.title, currentRecipe)
        selectRecipe(mainWindow, newRecipeTitle)
      } else if (index == 1) { // Proceed without Saving
        selectRecipe(mainWindow, newRecipeTitle)
      }
    })
  })

  ipcMain.on('load-recipe', (evt, recipeTitle, loaded) => {
    // When a recipe is loaded we render the delta in the editor,
    // update the title bar, and highlight the selected recipe in the navbar
    selectRecipe(mainWindow, recipeTitle)
  })

  ipcMain.on('new-recipe', (evt) => {
    // TODO create a new recipe template
    newRecipe = {
      delta: '',
      tags: []
    }

    recipesData.addRecipe('New Recipe', newRecipe)
    selectRecipe(mainWindow, 'New Recipe')
  })

  ipcMain.on('get-recipe-titles', (event) => {
    const titles = recipesData.getRecipes().parseTitles()
    mainWindow.send('display-recipe-list', titles)
  })

  ipcMain.on('update-search', (event, query) => {
    if(query == '') {
      // the content bar is blank, just send the main titles
      const titles = recipesData.getRecipes().parseTitles()
      mainWindow.send('display-recipe-list', titles)
    } else {
      const result = searchIndex.index.search(query, { expand: true })

      var matched_titles = []
      result.forEach(res => {
        // titles are listed as stored as 'ref' in the searchIndex
        matched_titles.push(res['ref'])
      })
      mainWindow.send('display-recipe-list', matched_titles)
    }
  })


  ipcMain.on('get-tags-nav', (event) => {
    // sortTags assumes the tags are arranged in a list of objects, we make that here
    var tagArray = []
    for(const [tagTitle, tagObj] of Object.entries(tagsData.tags)) {
      const tagObjFmt = {}

      tagObjFmt['value'] = tagTitle
      tagObjFmt['division'] = tagObj.division

      tagArray.push(tagObjFmt)
    }


    mainWindow.send('display-tags', sortTags(tagArray))
  })

  ipcMain.on('get-tag-recipe-list', (event, tag) => {
    mainWindow.send('display-tag-recipe-list', tagsData.tags[tag].recipes)
  })

  ipcMain.on('set-tag-division', (event, tagName, division) => {
    tagsData.setTagDivision(tagName, division)
    mainWindow.send('update-tag-division')
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

  // Reset all the recipes data
  //recipesData.recipes = {}
  //recipesData.saveRecipes()

  app.quit()
})