;(function () {
  'use strict'

  var header = document.querySelector('.header')
  var toggle = document.querySelector('.search-toggle')

  // on narrow screens search is an icon that opens the field over the header
  function openSearch (input) {
    if (header && toggle && toggle.offsetParent) {
      header.classList.add('is-search-open')
      toggle.setAttribute('aria-expanded', 'true')
    }
    input.focus()
  }

  function closeSearch () {
    if (!header || !header.classList.contains('is-search-open')) return
    header.classList.remove('is-search-open')
    if (toggle) toggle.setAttribute('aria-expanded', 'false')
  }

  if (toggle) {
    var field = document.getElementById('search-field')
    var input = document.getElementById('search-input')
    toggle.addEventListener('click', function () {
      openSearch(input)
    })
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSearch()
        input.blur()
      }
    })
    // keep it open while there's a query, so results stay clickable
    input.addEventListener('blur', function () {
      if (!input.value) closeSearch()
    })
    document.addEventListener('click', function (e) {
      if (!field.contains(e.target) && !toggle.contains(e.target)) closeSearch()
    })
  }

  // ⌘K / Ctrl K anywhere, or / when not typing, focuses the search field
  document.addEventListener('keydown', function (e) {
    var input = document.getElementById('search-input')
    if (!input) return
    var tag = (e.target.tagName || '').toLowerCase()
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault()
      openSearch(input)
      input.select()
    }
  })

  var kbd = document.querySelector('.search-kbd')
  if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = 'Ctrl K'
})()
