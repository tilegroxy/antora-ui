;(function () {
  'use strict'

  // ⌘K / Ctrl K anywhere, or / when not typing, focuses the search field
  document.addEventListener('keydown', function (e) {
    var input = document.getElementById('search-input')
    if (!input) return
    var tag = (e.target.tagName || '').toLowerCase()
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault()
      input.focus()
      input.select()
    }
  })

  var kbd = document.querySelector('.search-kbd')
  if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = 'Ctrl K'
})()
