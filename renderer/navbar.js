var Tagify = require('@yaireo/tagify')

// Variable that tracks which 'tab' is loaded
var loaded = 'recipes'



const constructRecipeList = function(recipe_list) {
  const recipeList = document.createElement('ul')
  recipeList.setAttribute('class', 'titles')

  const recipe_list_html = recipe_list.reduce((html, recipe_title) => {
    html += `<li class = 'recipe-title'>${recipe_title}</li>`
    return html
  }, '')

  recipeList.innerHTML = recipe_list_html
  return(recipeList)
}

const constructTagElm = function(tag_title) {
    const tagElm = document.createElement('tag')
    tagElm.setAttribute('title', tag_title)
    tagElm.setAttribute('contenteditable', 'false')
    tagElm.setAttribute('spellcheck', 'false')
    tagElm.setAttribute('tabindex', '-1')
    tagElm.setAttribute('class', 'tagify__tag tagify--noAnim nav-tag')
    tagElm.setAttribute('__isvalid', 'true')
    tagElm.setAttribute('value', 'tag1')
    tagElm.innerHTML = `<div>
        <span class="tagify__tag-text">${tag_title}</span>
    </div>`
    return(tagElm)
}

const constructTags = function(tags) {
  const navbar_contents = document.getElementById('navbar-contents')
  navbar_contents.innerHTML=''
  const tag_names = Object.keys(tags)

  for(var i =0; i < tag_names.length; i++) {
    const tag_title = tag_names[i]

    // A tagContainer holds the tagify element (tagElm) and the recipe list (recipeList)
    const tagContainer = document.createElement('div')
    tagContainer.setAttribute('class', 'tag-container')

    const tagElm = constructTagElm(tag_title)
    tagContainer.appendChild(tagElm)
    navbar_contents.appendChild(tagContainer)
  }

  navbar_contents.querySelectorAll('.recipe-title').forEach(title => {
    title.addEventListener('click', loadRecipe)
  })


  navbar_contents.querySelectorAll('tag').forEach(tag => {
    tag.addEventListener('click', handleTag)
  })
}

// Recipes button
document.getElementById('recipes-btn').addEventListener('click', () => {
  // If the recipes are already loaded do nothing, otherwise render them.
  if(loaded != 'recipes') {
    // FIXME this has an old name
    ipcRenderer.send('get-recipe-titles')
    const navbar = document.getElementById('navbar-contents')
    navbar.innerHTML = ''
    loaded = 'recipes'
  }
})

// Tags button
document.getElementById('tags-btn').addEventListener('click', () => {
  if(loaded != 'tags') {
    loaded = 'tags'
    ipcRenderer.send('get-tags-nav')
  }
})

// Search button
document.getElementById('search-btn').addEventListener('click', () => {
  if(loaded != 'search') {
    loaded = 'search'

    const navbar = document.getElementById('navbar-contents')
    navbar.innerHTML = `
    <div id="search-bar">
      <input type="text" id="search-input">
    </div>`

    document.getElementById('search-input').addEventListener('input', (e) => {
      const content = e.target.value
      ipcRenderer.send('update-search', content)
    })

  }
})

ipcRenderer.on('update-tags-nav', (event, tags) => {
  constructTags(tags)
})

ipcRenderer.on('update-titles', (event, titles) => {
  const navbar = document.getElementById('navbar-contents')
  var titles_div = document.getElementById('titles')

  // If titles div does not exist, make it
  if(titles_div == null) {
    titles_div = document.createElement('ul')
    titles_div.setAttribute('class', 'titles')
  } else {
    // Otherwise clear its contents
    titles_div.innerHTML = ''
  }

  // Create html string
  const titles_html = titles.reduce((html, title) => {
    html += `<li class = 'recipe-title'>${title}</li>`
    return html
  }, '')

  titles_div.innerHTML = titles_html
  navbar.appendChild(titles_div)

  navbar.querySelectorAll('.recipe-title').forEach(title => {
    title.addEventListener('click', loadRecipe)
  })
})