const Store = require('electron-store')

class RecipeStore extends Store {
  constructor (settings) {
    super(settings)

    // initialize with todos or empty array
    this.recipes = this.get('recipes') || {}
  }

  saveRecipes () {
    // save todos to JSON file
    this.set('recipes', this.recipes)

    // returning 'this' allows method chaining
    return this
  }

  size() {
    return Object.keys(this.recipes).length
  }

  getRecipes () {
    this.recipes = this.get('recipes') || {}
    return this
  }

  getFilteredList(type, filter) {
    var outTitles = []

    for(const [key, value] of Object.entries(this.recipes)) {
      // type = {'makeSoon', 'triedNTrue'}
      // filter = {'yes', 'no' 'all'}
      if(filter == 'yes') {
        // We want the stored value to be true
        if(value[type] == true) {outTitles.push(key)}
      } else if (filter == 'no') {
        if(value[type] == false) {outTitles.push(key)}
      } else if(filter == 'all') {
        outTitles = this.parseTitles()
      } else {
        // TODO throw error
      }
    }
    return outTitles
  }

  addRecipe (recipeTitle, recipe) {
    // TODO just wanted get this going, but many opportunities to clean this up
    // --- First, it assumes there cannot be duplicated keys, it will just write over
    // --- data of a recipe with the same title...should probably throw a warning or something
    // -- Second, its just quite messy, probably relegate to a function

    // check if recipe key is already in recipes...
    // if so just overwrite the recipe indicated by the key
    if (this.size() == 0) {
      recipe['dateCreated'] = Date.now()
      this.recipes[recipeTitle] = recipe
    } else {
      var update = false

      for(const [recipeTitle_i, recipe_i] of Object.entries(this.recipes)) {
        if(recipeTitle_i == recipeTitle) {
          update = true
          this.recipes[recipeTitle_i]['delta'] = recipe['delta']
          this.recipes[recipeTitle_i]['tags']  = recipe['tags']
          this.recipes[recipeTitle_i]['makeSoon']  = recipe['makeSoon']
          this.recipes[recipeTitle_i]['triedNTrue']  = recipe['triedNTrue']
          this.recipes[recipeTitle_i]['dateLastModified'] = Date.now()
        }
      }

      if(!update) {
        // no duplicate recipe found, append to the list
        recipe['dateCreated'] = Date.now()
        this.recipes[recipeTitle] = recipe
      }
    }
    return this.saveRecipes()
  }

  modifyRecipe (recipeTitle, recipe, oldRecipeTitle) {
    // Delete the old recipe
    this.deleteRecipe(oldRecipeTitle)
    this.addRecipe(recipeTitle, recipe)
    return this.saveRecipes()
  }

  deleteRecipe (recipeTitle) {
    delete this.recipes[recipeTitle]
    return this.saveRecipes()
  }

  parseTitles () {
    return Object.keys(this.recipes)
  }

}

module.exports = RecipeStore