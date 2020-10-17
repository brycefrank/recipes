const Store = require('electron-store')

class TagsStore extends Store {
  constructor (settings) {
    super(settings)
    this.tags = this.get('tags') || {}
  }

  saveTags () {
    // save tags to JSON file
    this.set('tags', this.tags)
    return thisua
  }

  getTaggedRecipes (tag) {
    return this.tags[tag]
  }

  organizeTags(recipes) {
    // this only gets run in development basically, we parse the 
    // recipesData for tags and sort the recipes that have those tags
    // into the correct data structure

    // FIXME if tags is empty, this crashes
    for(var i = 0; i < recipes.length; i++) {
      if(recipes[i]['tags'].length > 0) {
        const rec_i_tags = JSON.parse(recipes[i]['tags'])
        const rec_title = recipes[i]['title']

        for(var j = 0; j < rec_i_tags.length; j++) {
          const tag_name = [rec_i_tags[j]['value']]
          this.addRecipe(rec_title, tag_name)
        }
      }
    }
  }

  addRecipe(recipe_title, tag_name) {
    // Add the recipe to the list only if it is not already there
    const tag_list = this.tags[tag_name]
    if(tag_list != undefined) {
      if(!this.tags[tag_name].includes(recipe_title)) {
        this.tags[tag_name].push(recipe_title)
      }
    } else {
      this.tags[tag_name] = [recipe_title]
    }
  }

  updateTags(recipe) {
    const rec_title = recipe['title']

    if(recipe['tags'].length > 0) {
      const rec_tags = JSON.parse(recipe['tags']).map((tag) => {return tag['value']})

      // First we want to add any missing tags
      for(var i =0; i < rec_tags.length; i++) {
        const rec_tag_i = rec_tags[i]
        if (!Object.keys(this.tags).includes(rec_tag_i)) {
          this.tags[rec_tag_i] = [rec_title]
        }
      }

      // Now we iterate over the currently indexed tags and update them
      // by deleting removed tags or adding new tags from rec_tag_i
      for(const [ix_tag, ix_rec_list] of Object.entries(this.tags)) {
        // Does the rec_title belong to this tag currently? If it does
        // AND if the rec_tags indicate it SHOULDNT we should remove it.
        if(this.tags[ix_tag].includes(rec_title)) {

          if(!rec_tags.includes(ix_tag)) {
            // we want to DELETE ourselves from this.tags[ix_tag]
            this.tags[ix_tag] = this.tags[ix_tag].map((rec_title_i) => {if(rec_title_i != rec_title){
              return(rec_title_i)
            }})
          }
        } else {
          // Otherwise the rec_title does NOT beling to the tag currently. Check if 
          // we should add it to thist.tags[ix_tag] (i.e. rec_tags contains ix_tag)
          if(rec_tags.includes(ix_tag)) {
            this.tags[ix_tag].push(rec_title)
          }
        }
      }

    }



  }

  //deleteRecipe (title) {
  //}
}

module.exports = TagsStore