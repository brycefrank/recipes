var Tagify = require('@yaireo/tagify')

/**
 * A class used to input tags in the editor.
 */
class TagInput extends Tagify {
  constructor() {
    const tagInput = document.querySelector('input[name=tags]')
    super(tagInput, {
      callbacks: {
        add: (e) => {
          this.addContextListener(e.detail.tag)
          this.setDivision(e.detail.tag, e.detail.data.division)
        }
      }
    })
  }

  /**
   * For a given tag, attach an event listener for right clicks. Right click menus are used for 
   * setting the division of a given tag.
   * @param {object} tag The DOM element of a tag.
   */
  addContextListener(tag) {
    tag.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menu = new Menu();

      menu.append(new MenuItem({
        label: 'Category',
        click: () => {this.setDivision(tag, 'division-category')}
      }))

      menu.append(new MenuItem({
        label: 'Season',
        click: () => {this.setDivision(tag, 'division-season')}
      }))

      menu.append(new MenuItem({
        label: 'Source',
        click: () => {this.setDivision(tag, 'division-source')}
      }))

      menu.popup({window: remote.getCurrentWindow()})
    })
  }

  /**
   * Sets the division of a tag, used in the right-click event listener.
   * @param {object} tag The DOM element of a tag.
   * @param {string} division The division class, a string in the format 'division-[division class]'
   */
  setDivision(tag, division) {
    var newDivision = division
    const classList  = tag.classList
    const existingDivision = this.parseTagDivision(classList)

    if(classList.length > 1)  {
      if(existingDivision != newDivision) {
        // replace the existing division class with the new one
        tag.classList.replace(existingDivision, newDivision)
      }
    } else {
      // division class is NOT set, add it, if its undefined, division-category
      // is set as the default
      if(newDivision==undefined){newDivision = 'division-category'}
      tag.classList.add(newDivision)
    }
  }

  /**
   * 
   * @param {object} tagClassList A DOMTokenList of containing the classes of the target tag.
   * @returns{string} A string representing the division class in the format 
   * 'division-[division-class]'
   */
  parseTagDivision = (tagClassList) => {
    var division = undefined

    for(var i = 0; i < tagClassList.length; i++) {
      if(tagClassList[i].startsWith('division')) {
        division = tagClassList[i]     
      }
    }
    return(division)
  }
}