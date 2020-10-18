// initialize Tagify
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

const parseTagDivision = (tagClassList) => {
  var division = undefined

  for(var i = 0; i < tagClassList.length; i++) {
    if(tagClassList[i].startsWith('division')) {
      division = tagClassList[i]     
    }
  }

  return(division)
}

// sets the division (which is a class) of a tag DOM element
// when the division is set bet the user
const setDivision = (tag, division) => {
  const newDivision = division
  const classList  = tag.classList
  const existingDivision = parseTagDivision(classList)

  if(classList.length > 1)  {
    if(existingDivision != newDivision) {
      // replace the existing division class with the new one
      tag.classList.replace(existingDivision, newDivision)
    }
  } else {
    // division class is NOT set, add it
    tag.classList.add(newDivision)
  }
}

// Adds event listener to a tag in the tagify entry point
// that allows setting the tag division
const addContextListener = (tag) => {
  tag.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Category',
      click: () => {setDivision(tag, 'division-category')}
    }))

    menu.append(new MenuItem({
      label: 'Season',
      click: () => {setDivision(tag, 'division-season')}
    }))

    menu.append(new MenuItem({
      label: 'Source',
      click: () => {setDivision(tag, 'division-source')}
    }))

    menu.popup({window: remote.getCurrentWindow()})
  })
}

var tagInput = document.querySelector('input[name=tags]');
tagify = new Tagify(tagInput, {
  callbacks: {
    add: (e) => {
      addContextListener(e.detail.tag)
      setDivision(e.detail.tag, e.detail.data.division)
    }
  }
})

// This constructs the recipe object
const parseTagInput = (recTitle) => {
  const tagDOMs = document.getElementsByClassName('tagify')[0].getElementsByTagName('tag')


  var recipe = {
    'title': recTitle,
    'tags': [],
    'delta': editor.getContents()
  }

  for(var i=0; i < tagDOMs.length; i++) {
    const tag = tagDOMs[i]
    var tagObj = {
      'value': tag.getAttribute('title'),
      'division': parseTagDivision(tag.classList)
    }
    recipe.tags.push(tagObj)
  }
  return(recipe)
}

// Save button
document.getElementById('save-content-btn').addEventListener('click', () => {
  const recTitle = document.getElementById('title').textContent
  const recipe =  parseTagInput(recTitle)
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
  
  // Add the tags
  if(tags.length > 0 ) {
    tagify.addTags(tags)
  }
})

ipcRenderer.on('update-title-bar', (event, title) => {
  const title_html = document.getElementById('title')
  title_html.innerHTML = `<h1>${title}</h1>`
})


