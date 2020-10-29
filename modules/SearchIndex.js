const elasticlunr = require('elasticlunr')
const Delta = require('quill-delta')
const toPlaintext = require('quill-delta-to-plaintext')

class SearchIndex {
  constructor(recipeStore) {
    this.index = elasticlunr(function() {
      this.setRef('title') // FIXME this could be replace with some numerical id probably
      this.addField('title')
      this.addField('text')
    })

    Object.entries(recipeStore.recipes).forEach(entry => {
      // TODO a little clunky, it seems that the Delta object
      // is lost when we write it to electron-store, so we have
      // to convert it back to a Delta, would be nice to eliminate this
      // ... if anything electron-store is temporary so we'll wait on that
      const [recipeTitle, recipe] = entry
      const delta = new Delta(recipe['delta'])

      this.index.addDoc({
        'title': recipeTitle,
        'text': toPlaintext(delta)
      })
    })
  }
}

module.exports = SearchIndex