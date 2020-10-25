const { ipcRenderer } = require('electron')
const Split = require('split.js')



class TagContext{
  constructor() {
    this.displayed = false

    // Event listeners for main
    ipcRenderer.on('display-tag-recipe-list', (evt, recipeList) => {
      this.displayRecipeList(recipeList)
    })
  }

  // displays the empty context menu
  display() {
    // create the DOM elements
    const contextDOM = this.constructContextDOM()

    // append to the body
    const body = document.getElementsByTagName('body')[0]
    body.insertBefore(contextDOM, body.children[2])

    // remove the current gutter
    const gutters = document.getElementsByClassName('gutter gutter-horizontal')
    gutters[0].remove()

    // set the split
    Split(['#navbar', '#tag-context', '#editor-frame'])

    this.displayed = true
  }

  hide() {
    if(this.displayed) {
      // Select the DOM elements and the "gutter" from split and delete
      document.getElementById('tag-context').remove()
      const gutters = document.getElementsByClassName('gutter gutter-horizontal')

      for (var i = gutters.length - 1; i >= 0; i--) {
        gutters[0].parentNode.removeChild(gutters[0]);
      }

      // reinstantiate the original Split
      Split(['#navbar', '#editor-frame'])
      
      this.displayed = false
    }
  }

  // TODO duplicated (basically) from navbar, one option is to make "controller" or 
  // "event listener"? object that handles all click events
  displayRecipe(evt) {
    const title = evt.target.textContent
    // Get the delta from main
    ipcRenderer.send('load-recipe', title)

    // "Dehighlight" any existing highlights
    const recipe_titles = document.getElementById('tag-context').querySelectorAll('.recipe-title')
    recipe_titles.forEach((el) => {
      el.style.fontWeight='normal'
    })

    // Highlight (i.e. embolden) the recipe text in this element??
    evt.target.style.fontWeight='bold'
  }

  removeRecipeList() {
    var recipeListDOM = document.getElementById('tag-context').getElementsByClassName('recipe-title')

    if(recipeListDOM.length > 0) {
      for (var i = recipeListDOM.length - 1; i >= 0; i--) {
        recipeListDOM[0].parentNode.removeChild(recipeListDOM[0]);
      }
    }
  }

  displayRecipeList(recipeList) {
    this.removeRecipeList()

    var recipeListDOM = this.constructRecipeListDOM(recipeList)

    document.getElementById('tag-context')
      .insertAdjacentHTML('beforeend', recipeListDOM)


    document.getElementById('tag-context').querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', this.displayRecipe)
    })

  }

  constructRecipeListDOM(recipeList) {
    var recipeListDiv = document.createElement('ul')
    recipeListDiv.setAttribute('class', 'recipe-list')

    const titlesHTML = recipeList.reduce((html, title) => {
      html += `<li class = 'recipe-title'>${title}</li>`
      return html
    }, '')

    return(titlesHTML)
  }

  constructContextDOM() {
    var tagContextDOM = document.createElement('div')
    tagContextDOM.setAttribute('id', 'tag-context')

    // Create the top right button
    const closeButton = document.createElement('div')
    closeButton.setAttribute('id', 'close-tag-context-button')
    closeButton.innerText = 'x'

    closeButton.addEventListener('click', () => {
      this.hide()
    })

    tagContextDOM.appendChild(closeButton)
    return(tagContextDOM)
  }
}