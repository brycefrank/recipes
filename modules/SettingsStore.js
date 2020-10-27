const Store = require('electron-store')

class SettingsStore extends Store {
  constructor(settings) {
    super(settings)
    this.settings = this.get('settings') || {}
  }

  setSelectedRecipe(recipeTitle) {
    this.settings['selectedRecipe'] = recipeTitle
    this.set('settings', this.settings)
  }

  getSelectedRecipeTitle() {
    return(this.settings['selectedRecipe'])
  }
}

module.exports = SettingsStore