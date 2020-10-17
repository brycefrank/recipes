// initialize Tagify
const { remote } = require('electron');
const { Menu, MenuItem } = remote;


// Context menu for tags
const addContextListener = (tag) => {
  tag.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const menu = new Menu();
    const tagTitle = tag.children[1].children[0].innerText

    menu.append(new MenuItem({
      label: 'Category',
      click: () => {ipcRenderer.send('set-tag-division', tagTitle, 'Category')}
    }))

    menu.append(new MenuItem({
      label: 'Season',
      click: () => {ipcRenderer.send('set-tag-division', tagTitle, 'Season')}
    }))

    menu.append(new MenuItem({
      label: 'Source',
      click: () => {ipcRenderer.send('set-tag-division', tagTitle, 'Source')}
    }))

    menu.popup({window: remote.getCurrentWindow()})
  })
}

var tagInput = document.querySelector('input[name=tags]');
tagify = new Tagify(tagInput, {
  callbacks: {
    add: e => {addContextListener(e.detail.tag)}
  }
})

// Save button
document.getElementById('save-content-btn').addEventListener('click', () => {
  var title = document.getElementById('title').textContent

  var recipe = {
    title: title.trim(),
    tags: tagInput.value,
    delta: editor.getContents()
  }

  ipcRenderer.send('save-recipe', recipe, loaded)
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
  if(tags.length > 0 ) {
    tags = JSON.parse(tags)
    tagify.addTags(tags)
  }
})

ipcRenderer.on('update-title-bar', (event, title) => {
  const title_html = document.getElementById('title')
  title_html.innerHTML = `<h1>${title}</h1>`
})


