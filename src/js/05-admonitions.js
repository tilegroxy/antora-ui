;(function () {
  'use strict'

  // A block title on an admonition is rendered as a heading next to the type label
  ;[].slice.call(document.querySelectorAll('article.doc .admonitionblock')).forEach(function (block) {
    if (block.querySelector('td.content > .title')) block.classList.add('has-title')
  })
})()
