const Store = require('electron-store')

class TagsStore extends Store {
  constructor (settings) {
    super(settings)
    this.tags = this.get('tags') || {}
  }

  saveTags () {
    // save tags to JSON file
    this.set('tags', this.tags)
    return this
  }

  getTaggedRecipes (tag) {
    return this.tags[tag].recipes
  }

  organizeTags(recipes) {
    // this only gets run in development basically, we parse the 
    // recipesData for tags and sort the recipes that have those tags
    // into the correct data structure
    this.tags = {}

    // FIXME if tags is empty, this crashes
    //for(var i = 0; i < recipes.length; i++) {
    for(const [recipeTitle_i, recipe_i] of Object.entries(recipes)) {
      if(recipe_i.tags.length > 0) {
        const rec_i_tags = recipe_i.tags
        const rec_title = recipeTitle_i

        for(var j = 0; j < rec_i_tags.length; j++) {
          const tag_name = [rec_i_tags[j]['value']]
          const tag_division = rec_i_tags[j]['division']

          // By default the tag division is 'Category'
          if(tag_division) {
            this.addRecipe(rec_title, tag_name, tag_division)
          } else {
            this.addRecipe(rec_title, tag_name, 'division-category')
          }
        }
      }
    }
    return this.saveTags()
  }

  addRecipe(recTitle, tagName, division) {
    // Add the recipe to the list only if it is not already there
    if(this.tags[tagName] != undefined) {
      if(!this.tags[tagName].recipes.includes(recTitle)) {
        this.tags[tagName].recipes.push(recTitle)
      }
    } else {
      // Division is set to Category by default
      this.tags[tagName] = {
        'recipes' : [recTitle],
        'division': division
      }
    }
  }

  updateTags(recipe) {
    const recTitle = recipe['title']

    if(recipe['tags'].length > 0) {
      const recTags = recipe['tags'].map((tag) => {return tag['value']})

      // First we want to add any missing tags
      for(var i=0; i < recTags.length; i++) {
        const recTag_i = recTags[i]
        if (!Object.keys(this.tags).includes(recTag_i)) {
          this.addRecipe(recTitle, recTag_i)
        }
      }

      // Now we iterate over the currently indexed tags and update them
      // by deleting removed tags or adding new tags from recTag_i
      for(const [ix_tag, ix_rec_list] of Object.entries(this.tags)) {
        // Does the rec_title belong to this tag currently? If it does
        // AND if the rec_tags indicate it SHOULDNT we should remove it.
        if(this.tags[ix_tag].recipes.includes(recTitle)) {

          if(!recTags.includes(ix_tag)) {
            // we want to DELETE ourselves from this.tags[ix_tag]
            this.tags[ix_tag].recipes = this.tags[ix_tag].recipes.map((recTitle_i) => {
              if(recTitle_i != recTitle) {
              return(recTitle_i)
            }})

            // finally, if the recList is empty, delete the tag completely from this.tags
            if(this.tags[ix_tag].recipes[0] == undefined) { delete this.tags[ix_tag] }

          }
        } else {
          // Otherwise the rec_title does NOT belong to the tag currently. Check if 
          // we should add it to thist.tags[ix_tag] (i.e. rec_tags contains ix_tag)
          if(recTags.includes(ix_tag)) {
            this.tags[ix_tag].recipes.push(recTitle)
          }
        }
      }
    }
  }
}

module.exports = TagsStore