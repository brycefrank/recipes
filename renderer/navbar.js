const { ipcRenderer } = require("electron")
var Tagify = require('@yaireo/tagify')

class NavBar {
  constructor() {
    this.loaded = 'recipes'
    this.navBarContents = document.getElementById('navbar-contents')
    this.constructButtonListeners()

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

    // Add button listeners

  }


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
    //document.getElementById('search-btn').addEventListener('click', () => {
    //  if(loaded != 'search') {
    //    loaded = 'search'

    //    const navbar = document.getElementById('navbar-contents')
    //    navbar.innerHTML = `
    //    <div id="search-bar">
    //      <input type="text" id="search-input">
    //    </div>`

    //    document.getElementById('search-input').addEventListener('input', (e) => {
    //      const content = e.target.value
    //      ipcRenderer.send('update-search', content)
    //    })

    //  }
    //})
  }

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
      title.addEventListener('click', loadRecipe)
    })
  }

  displayTags(tags) {
    this.navBarContents.innerHTML=''
    const tagNames = Object.keys(tags)

    for(var i =0; i < tagNames.length; i++) {
      const tagTitle = tagNames[i]

      // A tagContainer holds the tagify element (tagElm) and the recipe list (recipeList)
      const tagContainer = document.createElement('div')
      tagContainer.setAttribute('class', 'tag-container')
      tagContainer.classList.add(tags[tagTitle].division)

      const tagElm = this.constructTagElm(tagTitle)
      tagContainer.appendChild(tagElm)
      this.navBarContents.appendChild(tagContainer)
    }

    this.navBarContents.querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', loadRecipe)
    })

    this.navBarContents.querySelectorAll('tag').forEach(tag => {
      tag.addEventListener('click', handleTag)
    })
  }

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

const navBar  = new NavBar()
