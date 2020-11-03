const { ipcRenderer } = require("electron")

/**
 * Implements the navigation bar, the left-most menu system
 */
class NavBar {
  constructor() {
    this.loaded = 'recipes'
    this.navBarContents = document.getElementById('navbar-contents')
    this.constructButtonListeners()

    this.selectedType = 'triedNTrue'
    this.selectedFilter = 'all'

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

    ipcRenderer.on('refresh-navbar', (evt, recipeTitle, recipeList) => {
      switch (this.loaded) {
        case 'recipes':
          this.displayRecipeList(recipeList, recipeTitle)
          break;
        case 'tags':
          ipcRenderer.send('get-tags-nav')
          break;
        case 'search':
          // TODO Not sure if search really needs anything after save
          // maybe just reset the search completely?
          break;
      }
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

    document.getElementById('add-btn').addEventListener('click', () => {
      ipcRenderer.send('new-recipe')
    })
  }

  /**
   * Used in the callback to display the clicked recipe in the navBar.
   * @param {object} evt The event emitted from the callback.
   */
  displayRecipe(evt) {
    const title = evt.target.textContent

    // Attempt to load the recipe
    ipcRenderer.send('attempt-load-recipe', title)
  }

  constructTypeOpt() {
    //---Drop down for tnt/ms--//
    var dropDownDOM = document.createElement('div')

    var selectDOM = document.createElement('select')
    selectDOM.setAttribute('id', 'filter-dropdown')

    const tntOpt = document.createElement('option')
    tntOpt.setAttribute('value', 'triedNTrue')
    tntOpt.innerText = "Tried 'n' True"

    const msOpt = document.createElement('option')
    msOpt.setAttribute('value', 'makeSoon')
    msOpt.innerText = 'Make Soon'

    selectDOM.appendChild(tntOpt)
    selectDOM.appendChild(msOpt)

    selectDOM.value = this.selectedType
    selectDOM.addEventListener('change', (evt)=>{this.handleTypeDropdown(evt, this)})

    dropDownDOM.appendChild(selectDOM)
    return dropDownDOM
  }

  handleTypeDropdown(evt, editor) {
    const selected = evt.target.value
    if(editor.selectedType != selected) {
      editor.selectedType = selected
      ipcRenderer.send('get-filtered-recipe-list', selected, editor.selectedFilter)
    }
  }

  constructFilterOpt() {
    //---Drop down for yes/no/all--//
    var dropDownDOM = document.createElement('div')

    var selectDOM = document.createElement('select')
    selectDOM.setAttribute('id', 'filter-dropdown')

    const yesOpt = document.createElement('option')
    yesOpt.setAttribute('value', 'yes')
    yesOpt.innerText = "Yes"

    const noOpt = document.createElement('option')
    noOpt.setAttribute('value', 'no')
    noOpt.innerText = 'No'

    const allOpt = document.createElement('option')
    allOpt.setAttribute('value', 'all')
    allOpt.innerText = 'All'

    selectDOM.appendChild(allOpt)
    selectDOM.appendChild(yesOpt)
    selectDOM.appendChild(noOpt)

    selectDOM.value = this.selectedFilter
    selectDOM.addEventListener('change', (evt) => {this.handleFilterDropdown(evt, this)})

    dropDownDOM.appendChild(selectDOM)
    return dropDownDOM
  }

  handleFilterDropdown(evt, editor) {
    const selected = evt.target.value
    if(editor.selectedFilter != selected) {
      editor.selectedFilter = selected
      ipcRenderer.send('get-filtered-recipe-list', editor.selectedType, selected)
    }
  }

  /**
   * Displays the recipeList, adds click event listener to each element.
   * @param {string[]} recipeList An array containing all recipes in the data.
   */
  displayRecipeList(recipeList, highlightTitle) {
    var recipeListDiv = navbar.getElementsByClassName('recipe-list')[0]
    this.navBarContents.innerHTML = ''

    // If titles div does not exist, make it
    if(recipeListDiv == null) {
      recipeListDiv = document.createElement('ul')
      recipeListDiv.setAttribute('class', 'recipe-list')
    }

    // Create html string
    const titlesHTML = recipeList.reduce((html, title) => {
      if(title != highlightTitle) {
        html += `<li class = 'recipe-title'>${title}</li>`
      } else {
        html += `<li class = 'recipe-title'><b>${title}</b></li>`
      }
      return html
    }, '')

    recipeListDiv.innerHTML = titlesHTML
    this.navBarContents.appendChild(recipeListDiv)

    this.navBarContents.querySelectorAll('.recipe-title').forEach(title => {
      title.addEventListener('click', (evt) => {
        this.displayRecipe(evt, this.navBarContents, this.loaded)
      })
    })

    // Add drop down menus for filtering
    // TODO this could be cleaned up a bit
    const typeOpt = this.constructTypeOpt()
    this.navBarContents.appendChild(typeOpt)

    const filterOpt = this.constructFilterOpt()
    this.navBarContents.appendChild(filterOpt)
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

