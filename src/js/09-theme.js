;(function () {
  'use strict'

  var toggle = document.querySelector('.theme-toggle')
  if (!toggle) return

  var label = toggle.querySelector('.theme-label')
  var root = document.documentElement
  var media = window.matchMedia('(prefers-color-scheme: dark)')

  function isDark () {
    return root.dataset.theme ? root.dataset.theme === 'dark' : media.matches
  }

  // the button names the mode it switches to, matching the icon it shows
  function sync () {
    var dark = isDark()
    var text = dark ? 'Light mode' : 'Dark mode'
    toggle.dataset.dark = String(dark)
    toggle.setAttribute('aria-label', text)
    if (label) label.textContent = text
  }

  // an explicit choice is remembered; picking the OS default again clears it so the site follows the OS
  toggle.addEventListener('click', function () {
    var theme = isDark() ? 'light' : 'dark'
    var followsOs = (theme === 'dark') === media.matches
    try {
      if (followsOs) localStorage.removeItem('theme')
      else localStorage.setItem('theme', theme)
    } catch (e) {}
    if (followsOs) delete root.dataset.theme
    else root.dataset.theme = theme
    sync()
  })

  if (media.addEventListener) media.addEventListener('change', sync)
  sync()
})()
