var Quill = require('quill')
var Tagify = require('@yaireo/tagify')
const { ipcRenderer, ipcMain } = require('electron')


// initialize Tagify
var tagInput = document.querySelector('input[name=tags]');
tagify = new Tagify(tagInput)

const loadRecipe = (evt) => {
  const title = evt.target.textContent

  // Get the delta from main
  ipcRenderer.send('load-recipe', title)
}

// Event listener for text entry into search bar
document.getElementById('search-input').addEventListener('input', (e) => {
  const content = e.target.value
  ipcRenderer.send('update-search', content)
})


// Save button
document.getElementById('saveContentBtn').addEventListener('click', () => {
  var title = document.getElementById('title').textContent

  var recipe = {
    title: title.trim(),
    tags: tagInput.value,
    delta: editor.getContents()
  }
  ipcRenderer.send('save-recipe', recipe)
})

// Delete button
document.getElementById('deleteContentBtn').addEventListener('click', () => {
  const title = document.getElementById('title').textContent;
  ipcRenderer.send('delete-recipe', title)
})

ipcRenderer.on('render-delta', (event, delta) => {
  // Render the delta
  editor.setContents(delta)
})

ipcRenderer.on('render-tags', (event, tags) => {
  const tags_html = document.getElementById('tags')
  tags_html.innerHTML = tags.join()
})

ipcRenderer.on('update-title-bar', (event, title) => {
  const title_html = document.getElementById('title')
  title_html.innerHTML = `<h1>${title}</h1>`
})

ipcRenderer.on('update-titles', (event, titles, highlight_title) => {
  const navbar = document.getElementById('navbar-contents')

  // Create html string
  const titles_html = titles.reduce((html, title) => {
    if(title == highlight_title) {
      html += `<li class = 'recipe-title'><b>${title}</b></li>`
    } else {
      html += `<li class = 'recipe-title'>${title}</li>`
    }
    return html
  }, '')

  navbar.innerHTML = titles_html

  navbar.querySelectorAll('.recipe-title').forEach(title => {
    title.addEventListener('click', loadRecipe)
  })
})

var toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']    
]

var editor = new Quill('#editor', {
	modules: {
		toolbar: toolbarOptions
  },
  theme: 'snow'
});
