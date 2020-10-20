// implements the tagContext menu
// variable that tracks if the tagContext is displayed
var tagContextDisplayed = false
var selectedTag = null

// Initialize Split for the navbar and editor-frame
const Split = require('split.js')
//const { ipcRenderer, ipcMain } = require('electron')

var instance = Split(['#navbar', '#editor-frame'], {
  sizes: [25, 75]
})

const loadRecipe = (evt) => {
  const title = evt.target.textContent
  // Get the delta from main
  ipcRenderer.send('load-recipe', title)

  // "Dehighlight" any existing highlights
  const recipe_titles = document.querySelectorAll('.recipe-title')
  recipe_titles.forEach((el) => {
    el.style.fontWeight='normal'
  })

  // Highlight (i.e. embolden) the recipe text in this element??
  evt.target.style.fontWeight='bold'
}

// This is called when a tag in the navbar is clicked
const handleTag = (evt) => {
  // currentTarget refers to the element with the event listener
  // and avoids returning the interior text of the tag
  const tag = evt.currentTarget
  const title = tag.getAttribute('title')

  // de-embolden any tags
  document.querySelectorAll('.tag-container').forEach((el) =>{
    const tag_i = el.children[0]
    tag_i.children[0].innerHTML = tag_i.getAttribute('title')
  })

  // embolden the tag text
  // FIXME this seems unreasonably slow?
  const tagText = tag.children[0]
  tagText.innerHTML = `<b>${title}</b>`

  if(tagContextDisplayed==true) {
    if(title != selectedTag) {
      ipcRenderer.send('get-tag-recipe-list', title)
    }
  } else {
    // make the tagContext appear
    tagContextDisplayed = true
    selectedTag = title
    // TODO this should be able to handle multiple tags (with shift click)
    ipcRenderer.send('get-tag-recipe-list', title)
  }
}

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

// Received tag-recipe-list from main
ipcRenderer.on('tag-recipe-list', (evt, titles) => {
  constructContextMenu(titles)
})
