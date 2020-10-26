const Quill = require('quill')
const EventEmitter = require('events');

/**
 * A class used to handle editor omponents including the title, tagInput and
 * a Quill editor
 */
class Editor {
  constructor(toolbarOptions, tagInput) {
    this.qEditor = new Quill('#editor', {
      modules: {
        toolbar: toolbarOptions
      },
      theme: 'snow',
      scrollingContainer: '#editorcontainer'
    });

    this.tagInput = tagInput
    this.constructButtonListeners()
    this.constructChangeListeners()

    // Event listeners for main
    ipcRenderer.on('render-delta', (event, delta) => {
      // Render the delta
      this.qEditor.setContents(delta)
    })

    ipcRenderer.on('render-tags', (event, tags) => {
      // Remove the tags
      this.tagInput.removeAllTags()
      
      // Add the tags
      if(tags.length > 0 ) {
        this.tagInput.addTags(tags)
      }
    })

    ipcRenderer.on('update-title-bar', (event, title) => {
      const title_html = document.getElementById('title')
      title_html.innerHTML = `<h1>${title}</h1>`
    })
  }

  /**
   * These event listeners listen for a change in the title, tagInput or qEditor, if any change
   * was made, this.edited is set to true, which is used to fire a confirmation event if leaving
   * an unsaved recipe.
   */
  constructChangeListeners() {
    // Listener for the editor itself
    this.qEditor.on('text-change', () => {
      this.edited = true
      this.qEditor.off('text-change')
    })

    // Listener for the tagInput add and remove events
    // FIXME it does not appear that the .offs are working for these
    this.tagInput.on('add', () => {
      this.edited = true
      this.tagInput.off('add')
    })

    this.tagInput.on('remove', () => {
      this.edited = true
      this.tagInput.off('remove')
    })

    // Listener for title change
    const titleDOM = document.getElementById('title')

    // We apparently need a named function for this...
    // FIXME still does not get removed?
    var titleInputHandler = function(evt) {
      this.edited = true
      titleDOM.removeEventListener('input', titleInputHandler)
    }

    titleDOM.addEventListener('input', titleInputHandler)
  }

  /**
   * Adds event listeners to Save and Delete buttons.
   */
  constructButtonListeners() {
    // Save button
    document.getElementById('save-content-btn').addEventListener('click', () => {
      const recTitle = document.getElementById('title').textContent
      const recipe =  this.getRecipeObj(recTitle)
      ipcRenderer.send('save-recipe', recipe, this.loaded)
    })

    // Delete button
    document.getElementById('delete-content-btn').addEventListener('click', () => {
      const title = document.getElementById('title').textContent;
      ipcRenderer.send('delete-recipe', title)
    })
  }

  // Get the recipe object from a tag element
  /**
   * For a given recipe title, return its object. Used in the event listener for the save button
   * to send the recipe object to main process.
   * @param {string} recTitle A string representing the recipe title.
   * @returns {object} A recipe object that contains the title, tags and qEditor delta.
   */
  getRecipeObj(recTitle) {
    // TODO could hold a reference to this in the constructor?
    // or it may already exist in Tagify class
    const tagDOMs = document.getElementsByClassName('tagify')[0].getElementsByTagName('tag')

    var recipe = {
      'title': recTitle,
      'tags': [],
      'delta': this.qEditor.getContents()
    }

    for(var i=0; i < tagDOMs.length; i++) {
      const tag = tagDOMs[i]
      var tagObj = {
        'value': tag.getAttribute('title'),
        'division': this.tagInput.parseTagDivision(tag.classList)
      }
      recipe.tags.push(tagObj)
    }
    return(recipe)
  }
}
