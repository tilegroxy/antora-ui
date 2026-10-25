;(function () {
  'use strict'

  var toc = document.querySelector('aside.toc')
  var menu = toc && toc.querySelector('.toc-menu')
  if (!menu) return

  // :page-toclevels: controls the depth (1 = h2 only)
  var levels = parseInt(toc.getAttribute('data-levels'), 10) || 2
  var selector = ['h2', 'h3', 'h4']
    .slice(0, Math.min(levels, 3))
    .map(function (h) { return '.doc ' + h + '[id]' })
    .join(',')
  var headings = [].slice.call(document.querySelectorAll(selector)).filter(function (h) {
    if (h.closest('.page-header') || h.closest('.hero') || h.closest('.admonitionblock')) return false
    return h.offsetParent !== null
  })
  // a contents list of one or two entries isn't worth the panel
  if (headings.length < 3) return toc.classList.add('is-empty')

  var list = document.createElement('ul')
  var lastItem
  headings.forEach(function (heading) {
    var item = document.createElement('li')
    var link = document.createElement('a')
    link.href = '#' + heading.id
    var clone = heading.cloneNode(true)
    ;[].slice.call(clone.querySelectorAll('.anchor')).forEach(function (anchor) {
      anchor.parentNode.removeChild(anchor)
    })
    link.textContent = clone.textContent.trim()
    item.appendChild(link)
    if (heading.tagName !== 'H2' && lastItem) {
      var sublist = lastItem.querySelector('ul') || lastItem.appendChild(document.createElement('ul'))
      sublist.appendChild(item)
    } else {
      list.appendChild(item)
      lastItem = item
    }
    heading.tocLink = link
  })
  menu.appendChild(list)

  // ---------- Scroll-spy ----------
  function spy () {
    var current = headings[0]
    headings.forEach(function (heading) {
      if (heading.getBoundingClientRect().top < 120) current = heading
    })
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = headings[headings.length - 1]
    headings.forEach(function (heading) {
      heading.tocLink.classList.toggle('is-active', heading === current)
    })
  }
  window.addEventListener('scroll', spy, { passive: true })
  spy()
})()
