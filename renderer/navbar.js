
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
    document.getElementById('search-btn').addEventListener('click', () => {
      if(this.loaded != 'search') {
        this.loaded = 'search'
        this.displaySearch() // this doesn't need interaction with main
      }
    })
  }

  // Callback used in the event listener for recipe-title click
  displayRecipe(evt) {
    const title = evt.target.textContent
    // Get the delta from main
    ipcRenderer.send('load-recipe', title)

    // "Dehighlight" any existing highlights
    const recipe_titles = this.navBarContents.querySelectorAll('.recipe-title')
    recipe_titles.forEach((el) => {
      el.style.fontWeight='normal'
    })

    // Highlight (i.e. embolden) the recipe text in this element??
    evt.target.style.fontWeight='bold'
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
      title.addEventListener('click', this.loadRecipe)
    })
  }


  // This is called when a tag in the navbar is clicked
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
      title.addEventListener('click', this.loadRecipe)
    })

    // FIXME this is broken because the meaning of "this" changes inside the forEach call
    this.navBarContents.querySelectorAll('tag').forEach(tag => {
      tag.addEventListener('click', (evt)=>{this.handleTag(evt, this.tagContext)})
    })
  }

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

