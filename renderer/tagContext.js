const Split = require('split.js')

// implements the tagContext menu
class TagContext {
  constructor(navBar) {
    // The "parent" navBar
    this.navBar = navBar
    this.displayed = false
    this.selectedTag = '' //FIXME is this typical to define it this way?

    // Received tag-recipe-list from main
    ipcRenderer.on('tag-recipe-list', (evt, titles) => {
      this.constructContextMenu(titles)
    })
  }

  // Displays the context with recipes belonging to tagTitle
  display(tagTitle) {
    // TODO This is basically another function that should be made in TagContext
    if(this.displayed==true) {
      if(tagTitle != this.selectedTag) {
        ipcRenderer.send('get-tag-recipe-list', tagTitle)
      }
    } else {
      // make the tagContext appear
      this.displayed = true
      this.selectedTag = title
      // TODO this should be able to handle multiple tags (with shift click)
      ipcRenderer.send('get-tag-recipe-list', tagTitle)
    }
  }
}

//var selectedTag = null

var instance = Split(['#navbar', '#editor-frame'], {
  sizes: [25, 75]
})


const deleteContextMenu = () => {
    instance.destroy()
    instance = Split(['#navbar', '#editor-frame'], {
      sizes: [25, 75]
    })
    document.getElementById('tag-context').remove()
}

const constructContextMenu = (titles) => {
  var tagContext = document.getElementById('tag-context')

  if(tagContext == null) {
    tagContext = document.createElement('div')
    tagContext.setAttribute('id', 'tag-context')
  } else {
    // Otherwise clear its contents
    tagContext.innerHTML = ''
  }

  // Create the top right button
  const closeButton = document.createElement('div')
  closeButton.setAttribute('id', 'close-tag-context-button')
  closeButton.innerText = 'x'

  closeButton.addEventListener('click', () => {
    deleteContextMenu()
  })

  tagContext.appendChild(closeButton)


  // Create html string
  const recipeList = constructRecipeList(titles)
  tagContext.appendChild(recipeList)


  const body = document.getElementsByTagName('body')[0]
  body.insertBefore(tagContext, body.children[2])

  // get the width of the navbar in pixels?
  // TODO the new split changes the size of the navbar, I want this
  // to be fixed but having some trouble getting the right values here
  const navbar = document.querySelector('#navbar')
  const width = navbar.clientWidth
  const widthBody = body.clientWidth
  const initContextWidth = 225

  // reinitialize the Split
  instance.destroy()
  instance = Split(['#navbar', '#tag-context', '#editor-frame'], {
    sizes: [25, 20, 60]
  })


  document.querySelectorAll('.recipe-title').forEach(title => {
    title.addEventListener('click', loadRecipe)
  })
}

