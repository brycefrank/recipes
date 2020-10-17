'use strict'

const Store = require('electron-store')

class DataStore extends Store {
  constructor (settings) {
    super(settings)

    // initialize with todos or empty array
    this.recipes = this.get('recipes') || []
  }

  saveRecipes () {
    // save todos to JSON file
    this.set('recipes', this.recipes)

    // returning 'this' allows method chaining
    return this
  }

  getRecipe (title) {
    for(var i = 0; i < this.recipes.length; i++) {
      const rec_i = this.recipes[i]
      if (rec_i['title'] == title) {
        return(rec_i)
      }
    }
  }

  getRecipes () {
    // set object's todos to todos in JSON file
    this.recipes = this.get('recipes') || []
    return this
  }

  addRecipe (recipe) {
    // TODO just wanted get this going, but many opportunities to clean this up
    // --- First, it assumes there cannot be duplicated keys, it will just write over
    // --- data of a recipe with the same title...should probably throw a warning or something
    // -- Second, its just quite messy, probably relegate to a function

    // check if recipe key is already in recipes...
    // if so just overwrite the recipe indicated by the key
    if (this.recipes.length == 0) {
      this.recipes = [ ...this.recipes, recipe ]
    } else {

      var update = false
      for(var i=0; i < this.recipes.length; i++) {
        // the recipe exists! simply update the delta and tags property
        if(this.recipes[i]['title'] == recipe['title']) {
          update = true
          this.recipes[i]['delta'] = recipe['delta']
          this.recipes[i]['tags'] = recipe['tags']
        }
      }

      if(!update) {
        // no duplicate recipe found, append to the list
        this.recipes = [...this.recipes, recipe]
      }
    }
    return this.saveRecipes()
  }

  deleteRecipe (title) {
    // filter out the target todo
    this.recipes = this.recipes.filter(t => t['title'] !== title)

    return this.saveRecipes()
  }

  parseTitles () {
    // get the the display titles of the recipes
    const titles = this.recipes.map(recipe => {return recipe['title']})
    return titles
  }

}

module.exports = DataStore