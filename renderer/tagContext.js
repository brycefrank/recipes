const { ipcRenderer } = require('electron')
const Split = require('split.js')


/**
 * Impelements the tagContext menu that appears when a tag is 
 * clicked in the navBar.
 */
class TagContext{
  constructor() {
    this.displayed = false

    // Event listeners for main
    ipcRenderer.on('display-tag-recipe-list', (evt, recipeList) => {
      this.displayRecipeList(recipeList)
    })
  }

  /**
   * Displays the tagContext menu.
   * @param {number} tagContextWidth The width in pixels of the tagContextMenu
   */
  display(tagContextWidth=250) {
    // create the DOM elements
    const contextDOM = this.constructContextDOM()

    // append to the body
    const body = document.getElementsByTagName('body')[0]
    body.insertBefore(contextDOM, body.children[2])

    // remove the current gutter
    const gutters = document.getElementsByClassName('gutter gutter-horizontal')
    gutters[0].remove()

    // set the split
    // TODO I want the navbar to remain the same size. Right now it is "jiggling"
    var navWidth = document.getElementById('navbar-contents').offsetWidth
    navWidth = navWidth + 5 // Split.js removes 5 pixels by default, so add them back in

    const bodyWidth = document.body.clientWidth 
    const editorWidth = bodyWidth - tagContextWidth - navWidth


    Split(['#navbar', '#tag-context', '#editor-frame'], {
      sizes: [100 * navWidth/bodyWidth, 100 * tagContextWidth/bodyWidth, 100 * editorWidth/bodyWidth]
    })

    this.displayed = true
  }

  /**
   * Hides the tagContext menu.
   */
  hide() {
    if(this.displayed) {
      // Select the DOM elements and the "gutter" from split and delete
      document.getElementById('tag-context').remove()
      const gutters = document.getElementsByClassName('gutter gutter-horizontal')

      for (var i = gutters.length - 1; i >= 0; i--) {
        gutters[0].parentNode.removeChild(gutters[0]);
      }

      // reinstantiate the original Split
      // TODO I want the navbar to remain the same size. Right now it is "jiggling"
      Split(['#navbar', '#editor-frame'])
      
      this.displayed = false
    }
  }

  /**
   * Used in the click event of a recipe in the Context menu.
   * @param {object} evt Event object from the callback.
   */
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

  /**
   * Removes any existing recipes displayed in the tagContext menu.
   */
  removeRecipeList() {
    var recipeListDOM = document.getElementById('tag-context').getElementsByClassName('recipe-title')

    if(recipeListDOM.length > 0) {
      for (var i = recipeListDOM.length - 1; i >= 0; i--) {
        recipeListDOM[0].parentNode.removeChild(recipeListDOM[0]);
      }
    }
  }

  /**
   * Displays the recipeList in the tagContext menu. 
   * @param {string[]} recipeList An array containing all recipes in the data.
   */
  displayRecipeList(recipeList) {
    this.removeRecipeList()

    var recipeListDOM = this.constructRecipeListDOM(recipeList)

    document.getElementById('tag-context')
      .insertAdjacentHTML('beforeend', recipeListDOM)


    document.getElementById('tag-context').querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', this.displayRecipe)
    })

  }

  /**
   * Constructs the DOM element representing the recipeList.
   * @param {string[]} recipeList An array containing all recipes in the data.
   */
  constructRecipeListDOM(recipeList) {
    var recipeListDiv = document.createElement('ul')
    recipeListDiv.setAttribute('class', 'recipe-list')

    const titlesHTML = recipeList.reduce((html, title) => {
      html += `<li class = 'recipe-title'>${title}</li>`
      return html
    }, '')
    return(titlesHTML)
  }

  /**
   * Constructs the DOM element representing the tagContext with no recipes displayed.
   */
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