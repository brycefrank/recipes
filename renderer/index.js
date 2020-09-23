var Quill = require('quill')
const { ipcRenderer, ipcMain } = require('electron')

const loadRecipe = (evt) => {
  const title = evt.target.textContent
  const key =  title.replace(/\s/g, '')

  // Get the delta from main
  ipcRenderer.send('load-recipe', key)
}

document.getElementById('saveContentBtn').addEventListener('click', () => {
  var title = document.getElementById('title').textContent;

  // A recipe is an object containing the key, title and delta
  var recipe = {
    key: title.replace(/\s/g, ''),
    title: title.trim(),
    delta: editor.getContents()
  }
  ipcRenderer.send('save-recipe', recipe)
})

document.getElementById('deleteContentBtn').addEventListener('click', () => {
  ipcRenderer.send('delete-recipe', recipe)
})

ipcRenderer.on('render-delta', (event, delta) => {
  // Render the delta
  editor.setContents(delta)
})

ipcRenderer.on('update-title-bar', (event, title) => {
  const title_html = document.getElementById('title')
  title_html.innerHTML = `<h1>${title}</h1>`
})

ipcRenderer.on('recipe-titles', (event, titles) => {
  const navbar = document.getElementById('navbar-contents')

  // Create html string
  const titles_html = titles.reduce((html, title) => {
    html += `<li class = 'recipe-title'>${title}</li>`
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
