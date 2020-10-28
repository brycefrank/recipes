/**
 * Implements the navigation bar, the left-most menu system
 */
class NavBar {
  constructor() {
    this.loaded = 'recipes'
    this.navBarContents = document.getElementById('navbar-contents')
    this.constructButtonListeners()

    // At this point the only splits are navbar and editor-frame
    Split(['#navbar', '#editor-frame'], {
      sizes: [25, 75]
    })

    this.tagContext = new TagContext()

    // Add event listeners for main process
    ipcRenderer.on('display-tags', (evt, tags) => {
      this.displayTags(tags)
    })

    ipcRenderer.on('display-recipe-list', (evt, recipeList) => {
      this.displayRecipeList(recipeList)
    })

    ipcRenderer.on('display-search', () => {
      this.displaySearch()
    })

    ipcRenderer.on('highlight-recipe', (evt, recipeTitle) => {
      this.highlightRecipe(recipeTitle)
    })
  }

  /**
   * Assigns event listeners to the Recipes, Tags and Search buttons in the navBar
   */
  constructButtonListeners() {
    // Recipes button
    document.getElementById('recipes-btn').addEventListener('click', () => {
      // If the recipes are already loaded do nothing, otherwise render them.
      if(this.loaded != 'recipes') {
        this.loaded = 'recipes'
        ipcRenderer.send('get-recipe-titles')
        this.navBarContents.innerHTML = ''
      }
    })

    // Tags button
    document.getElementById('tags-btn').addEventListener('click', () => {
      if(this.loaded != 'tags') {
        this.loaded = 'tags'
        ipcRenderer.send('get-tags-nav')
      }
    })

    // Search button
    document.getElementById('search-btn').addEventListener('click', () => {
      if(this.loaded != 'search') {
        this.loaded = 'search'
        this.displaySearch() // this doesn't need interaction with main
      }
    })
  }

  /**
   * Highlights the recipe DOM elements that match the recipeTitle.
   * @param {string} recipeTitle A string representing the title of the recipe to highlight.
   */
  highlightRecipe(recipeTitle) {
    // TODO also need to do this for the tagContext...
    // "Dehighlight" any existing highlights
    const recipeTitles = document.querySelectorAll('.recipe-title')
    recipeTitles.forEach((el) => {
      if(el.innerText == recipeTitle) {
        el.style.fontWeight='bold'
      } else {
        el.style.fontWeight='normal'
      }
    })

    // Highlight (i.e. embolden) the recipe text in this element??
    //evt.target.style.fontWeight='bold'
  }

  /**
   * Used in the callback to display the clicked recipe in the navBar.
   * @param {object} evt The event emitted from the callback.
   */
  displayRecipe(evt, navBarContents, loaded) {
    const title = evt.target.textContent

    // Attempt to load the recipe
    ipcRenderer.send('attempt-load-recipe', title)

  }

  /**
   * Displays the recipeList, adds click event listener to each element.
   * @param {string[]} recipeList An array containing all recipes in the data.
   */
  displayRecipeList(recipeList) {
    var recipeListDiv = navbar.getElementsByClassName('recipe-list')[0]

    // If titles div does not exist, make it
    if(recipeListDiv == null) {
      recipeListDiv = document.createElement('ul')
      recipeListDiv.setAttribute('class', 'recipe-list')
    } else {
      // Otherwise clear its contents
      recipeListDiv.innerHTML = ''
    }

    // Create html string
    const titlesHTML = recipeList.reduce((html, title) => {
      html += `<li class = 'recipe-title'>${title}</li>`
      return html
    }, '')

    recipeListDiv.innerHTML = titlesHTML
    this.navBarContents.appendChild(recipeListDiv)

    this.navBarContents.querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', (evt) => {
        this.displayRecipe(evt, this.navBarContents, this.loaded)
      })
    })
  }


  /**
   * Function used in the callback when a tag is clicked in the navBar.
   * @param {object} evt The event emitted from the callback.
   * @param {object} tagContext An object of class TagContext that represents the tagContext menu.
   */
  handleTag(evt, tagContext) {
    if(!tagContext.displayed) {
      tagContext.display()
    }

    // currentTarget refers to the element with the event listener
    // and avoids returning the interior text of the tag
    const tag = evt.currentTarget
    const tagTitle = tag.getAttribute('title')

    //// de-embolden any tags
    document.querySelectorAll('.tag-container').forEach((el) =>{
      const tag_i = el.children[0]
      tag_i.children[0].innerHTML = tag_i.getAttribute('title')
    })

    const tagText = tag.children[0]
    tagText.innerHTML = `<b>${tagTitle}</b>`
    ipcRenderer.send('get-tag-recipe-list', tagTitle)
  }

  /**
   * Displays all existing the tags in the navBar.
   * @param {object[]} tags Received from main, an array of tag objects.
   */
  displayTags(tags) {
    this.navBarContents.innerHTML=''

    for(var i =0; i < tags.length; i++) {
      const tagTitle = tags[i].value

      // A tagContainer holds the tagify element (tagElm) and the recipe list (recipeList)
      const tagContainer = document.createElement('div')
      tagContainer.setAttribute('class', 'tag-container')
      tagContainer.classList.add(tags[i].division)

      const tagElm = this.constructTagElm(tagTitle)
      tagContainer.appendChild(tagElm)
      this.navBarContents.appendChild(tagContainer)
    }

    this.navBarContents.querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', this.loadRecipe)
    })

    // FIXME this is broken because the meaning of "this" changes inside the forEach call
    this.navBarContents.querySelectorAll('tag').forEach(tag => {
      tag.addEventListener('click', (evt)=>{this.handleTag(evt, this.tagContext)})
    })
  }

  /**
   * Displays the search interface in the navBar.
   */
  displaySearch() {
    this.navBarContents.innerHTML = `
      <div id="search-bar">
        <input type="text" id="search-input">
      </div>`

    document.getElementById('search-input').addEventListener('input', (e) => {
      const content = e.target.value
      ipcRenderer.send('update-search', content)
    })
  }

  /**
   * Constructs the DOM element representing a tag.
   * @param {string} tagTitle The title of the tag.
   * @returns {object} A DOM element representing the tag.
   */
  constructTagElm(tagTitle) {
    const tagElm = document.createElement('tag')
    tagElm.setAttribute('title', tagTitle)
    tagElm.setAttribute('contenteditable', 'false')
    tagElm.setAttribute('spellcheck', 'false')
    tagElm.setAttribute('tabindex', '-1')
    tagElm.setAttribute('class', 'tagify__tag tagify--noAnim nav-tag')
    tagElm.setAttribute('__isvalid', 'true')
    tagElm.setAttribute('value', 'tag1')
    tagElm.innerHTML = `<div>
        <span class="tagify__tag-text">${tagTitle}</span>
    </div>`
    return(tagElm)
  }
}

