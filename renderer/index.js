// initialize Tagify
const Split = require('split.js')
var tagInput = document.querySelector('input[name=tags]');
tagify = new Tagify(tagInput)

// Initialize Split for the navbar and editor-frame
Split(['#navbar', '#editor-frame'], {
  sizes: [25, 75]
})

// Save button
document.getElementById('save-content-btn').addEventListener('click', () => {
  var title = document.getElementById('title').textContent

  var recipe = {
    title: title.trim(),
    tags: tagInput.value,
    delta: editor.getContents()
  }

  ipcRenderer.send('save-recipe', recipe)
})

// Delete button
document.getElementById('delete-content-btn').addEventListener('click', () => {
  const title = document.getElementById('title').textContent;
  ipcRenderer.send('delete-recipe', title)
})

ipcRenderer.on('render-delta', (event, delta) => {
  // Render the delta
  editor.setContents(delta)
})

ipcRenderer.on('render-tags', (event, tags) => {
  // Remove the tags
  tagify.removeAllTags()
  tags = JSON.parse(tags)
  tagify.addTags(tags)
})

ipcRenderer.on('update-title-bar', (event, title) => {
  const title_html = document.getElementById('title')
  title_html.innerHTML = `<h1>${title}</h1>`
})


