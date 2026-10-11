;(function () {
  'use strict'

  var doc = document.querySelector('article.doc')
  if (!doc) return

  // ---------- Lay out a listing (or code tabs) and its callout list side by side ----------
  find('.colist', doc).forEach(function (colist) {
    var prev = colist.previousElementSibling
    if (!prev || !(prev.classList.contains('listingblock') || prev.classList.contains('tabs'))) return
    if (!colist.querySelector('tr')) return
    var wrap = document.createElement('div')
    wrap.className = 'annotated'
    prev.parentNode.insertBefore(wrap, prev)
    wrap.appendChild(prev)
    wrap.appendChild(colist)
  })

  // ---------- Clicking a number on either side highlights the line ----------
  document.addEventListener('click', function (e) {
    var wrap = e.target.closest && e.target.closest('.annotated')
    if (!wrap) return
    var conum = e.target.closest('pre .conum')
    if (conum) return activate(wrap, conum.getAttribute('data-value'))
    var tr = e.target.closest('.colist tr')
    if (tr) activate(wrap, String(find('.colist tr', wrap).indexOf(tr) + 1))
  })

  window.addEventListener('load', function () {
    find('.annotated', doc).forEach(function (wrap) {
      activate(wrap, '1')
    })
  })

  function activate (wrap, n) {
    find('.conum', wrap).forEach(function (conum) {
      conum.classList.toggle('is-active', conum.getAttribute('data-value') === n)
    })
    find('.colist tr', wrap).forEach(function (tr, i) {
      tr.classList.toggle('is-active', String(i + 1) === n)
    })
    find('.line-hl', wrap).forEach(function (hl) {
      hl.parentNode.removeChild(hl)
    })
    var target = find('pre .conum', wrap).filter(function (conum) {
      return conum.getAttribute('data-value') === n && conum.offsetParent
    })[0]
    if (!target) return
    var pre = target.closest('pre')
    var host = pre.parentNode
    var lineHeight = parseFloat(window.getComputedStyle(pre).lineHeight) || 22
    var top = target.getBoundingClientRect().top - host.getBoundingClientRect().top +
      target.offsetHeight / 2 - lineHeight / 2
    var hl = document.createElement('div')
    hl.className = 'line-hl'
    hl.style.top = top + 'px'
    hl.style.height = lineHeight + 'px'
    host.appendChild(hl)
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }
})()
