// implements the tagContext menu
// variable that tracks if the tagContext is displayed
var tagContextDisplayed = false

// Initialize Split for the navbar and editor-frame
const Split = require('split.js')
const { ipcRenderer, ipcMain } = require('electron')

Split(['#navbar', '#editor-frame'], {
  sizes: [25, 75]
})

// This is called when a tag in the navbar is clicked
const handleTag = (evt) => {
  // currentTarget refers to the element with the event listener
  // and avoids returning the interior text of the tag
  if(tagContextDisplayed==true) {

  } else {
    // make the tagContext appear
    const tag = evt.currentTarget.getAttribute('title')

    ipcRenderer.send('get-tag-recipe-list', tag)
  }
}

const constructContextMenu = (titles) => {
  const tagContext = document.createElement('div')

  titles_div = document.createElement('ul')
  titles_div.setAttribute('class', 'titles')

  // Create html string
  const titles_html = titles.reduce((html, title) => {
    html += `<li class = 'recipe-title'>${title}</li>`
    return html
  }, '')

  titles_div.innerHTML = titles_html
  tagContext.appendChild(titles_div)

  const body = document.getElementsByTagName('body')[0]
  body.insertBefore(tagContext, body.children[2])
}

// Received tag-recipe-list from main
ipcRenderer.on('tag-recipe-list', (evt, titles) => {
  constructContextMenu(titles)
})
