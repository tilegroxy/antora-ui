;(function () {
  'use strict'

  // Search results (rendered by @antora/lunr-extension) show where each page sits in the nav,
  // e.g. "Configure / Reference / Proxy › Section", in the left column instead of the bare title,
  // and drop the title the extension repeats above the snippet on the right
  var field = document.getElementById('search-field')
  if (!field || !window.MutationObserver) return

  var trails

  new window.MutationObserver(function () {
    find('.search-result-item:not([data-trail])').forEach(decorate)
  }).observe(field, { childList: true, subtree: true })

  function decorate (item) {
    item.setAttribute('data-trail', '')
    var title = item.querySelector('.search-result-document-title')
    var link = item.querySelector('.search-result-document-hit > a')
    if (!title || !link) return
    var section = link.querySelector('.search-result-section-title')
    if (section) link.removeChild(section)

    var page = document.createElement('span')
    page.className = 'search-result-page'
    while (title.firstChild) page.appendChild(title.firstChild)
    ;(trailFor(link) || []).forEach(function (label) {
      var crumb = document.createElement('span')
      crumb.className = 'search-result-crumb'
      crumb.textContent = label
      title.appendChild(crumb)
    })
    title.appendChild(page)
    // a hit in a section links to its heading; the extension shows the page title there otherwise
    if (section && link.hash) {
      var heading = document.createElement('span')
      heading.className = 'search-result-section'
      while (section.firstChild) heading.appendChild(section.firstChild)
      title.appendChild(heading)
    }
    title.addEventListener('click', function () {
      link.click()
    })
  }

  function trailFor (link) {
    // read on first use; the data sits after site.js in the page
    if (!trails) {
      var data = document.getElementById('search-trails')
      try {
        trails = JSON.parse(data.textContent)
      } catch (e) {
        trails = {}
      }
    }
    var script = document.getElementById('search-ui-script')
    var root = new window.URL((script && script.getAttribute('data-site-root-path')) || '.', window.location.href)
    var rootPath = root.pathname.replace(/\/?$/, '/')
    var path = link.pathname
    if (path.indexOf(rootPath) !== 0) return
    return trails['/' + path.slice(rootPath.length)]
  }

  function find (selector) {
    return [].slice.call(field.querySelectorAll(selector))
  }
})()
